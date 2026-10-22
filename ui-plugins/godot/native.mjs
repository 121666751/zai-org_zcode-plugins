import { readFile, writeFile, mkdir, realpath, cp, stat, lstat, access } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomUUID } from "node:crypto";
import { homedir } from "node:os";
import { createServer } from "node:net";
import { spawn } from "node:child_process";
import process from "node:process";
const here = dirname(fileURLToPath(import.meta.url));
const action = process.argv[2] || "serve";
if (!["setup", "launch", "serve"].includes(action))
  throw new Error("Usage: native.mjs setup|launch|serve [project-directory]");
const dataRoot =
  process.env.ZCODE_GODOT_DATA_DIR || join(homedir(), ".zcode/plugin-data/godot-native");
const project = await realpath(
  resolve(process.argv[3] || process.env.ZCODE_WORKSPACE_ROOT || process.cwd()),
);
const key = createHash("sha256").update(project).digest("hex").slice(0, 20);
const data = join(dataRoot, key);
await mkdir(data, { recursive: true, mode: 0o700 });
const connectionFile = join(data, "connection.json");
let connection;
try {
  connection = JSON.parse(await readFile(connectionFile, "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  const listener = createServer();
  await new Promise((ok, fail) => {
    listener.once("error", fail);
    listener.listen(0, "127.0.0.1", ok);
  });
  const port = listener.address().port;
  await new Promise((ok) => listener.close(ok));
  connection = { url: `ws://127.0.0.1:${port}`, token: randomUUID() };
  try {
    await writeFile(connectionFile, JSON.stringify(connection), { flag: "wx", mode: 0o600 });
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    connection = JSON.parse(await readFile(connectionFile, "utf8"));
  }
}
async function freePort() {
  const listener = createServer();
  await new Promise((ok, fail) => {
    listener.once("error", fail);
    listener.listen(0, "127.0.0.1", ok);
  });
  const port = listener.address().port;
  await new Promise((ok) => listener.close(ok));
  return port;
}
async function binary() {
  const candidates = [
    process.env.GODOT_PATH,
    process.env.GODOT_MCP_GODOT_BIN,
    "/Applications/Godot.app/Contents/MacOS/Godot",
    join(homedir(), "Applications/Godot.app/Contents/MacOS/Godot"),
    "/opt/homebrew/bin/godot",
    "/usr/local/bin/godot",
    join(homedir(), ".local/bin/godot"),
    ...(process.env.LOCALAPPDATA ? [join(process.env.LOCALAPPDATA, "ZCode/Godot/Godot.exe")] : []),
  ];
  for (const dir of (process.env.PATH || "").split(process.platform === "win32" ? ";" : ":"))
    for (const name of process.platform === "win32"
      ? ["godot.exe", "godot4.exe"]
      : ["godot", "godot4"])
      candidates.push(join(dir, name));
  for (const path of candidates.filter(Boolean)) {
    try {
      await access(path);
      return path;
    } catch {}
  }
  return undefined;
}
async function setup() {
  for (const relative of ["addons", "addons/godot_mcp", ".godot"]) {
    try {
      if ((await lstat(join(project, relative))).isSymbolicLink())
        throw new Error(`Refusing to write through symlink: ${relative}`);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  const configPath = join(project, "project.godot");
  let config = await readFile(configPath, "utf8");
  const destination = join(project, "addons/godot_mcp");
  try {
    await stat(destination);
    await access(join(destination, ".zcode-managed"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    try {
      await stat(destination);
      throw new Error(
        "Existing unmanaged addons/godot_mcp: preserve it and choose a clean project or migrate it explicitly.",
      );
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
    }
  }
  await cp(join(here, "upstream/godot/addons/godot_mcp"), destination, { recursive: true });
  await writeFile(join(destination, ".zcode-managed"), "hybridindie 2026.10.21b2\n");
  const resource = '"res://addons/godot_mcp/plugin.cfg"';
  if (!config.includes(resource)) {
    if (config.includes("[editor_plugins]"))
      config = config.replace(
        /(\[editor_plugins\])([\s\S]*?)(?=\n\[|$)/,
        (_, h, b) =>
          h +
          (/enabled\s*=\s*PackedStringArray\(/.test(b)
            ? b.replace(
                /enabled\s*=\s*PackedStringArray\(([^)]*)\)/,
                (_, values) =>
                  `enabled=PackedStringArray(${values.trim() ? values + ", " : ""}${resource})`,
              )
            : `\nenabled=PackedStringArray(${resource})\n${b}`),
      );
    else config += `\n[editor_plugins]\nenabled=PackedStringArray(${resource})\n`;
    await writeFile(configPath, config);
  }
  await mkdir(join(project, ".godot"), { recursive: true });
  await writeFile(join(project, ".godot/zcode-mcp.json"), JSON.stringify(connection), {
    mode: 0o600,
  });
}
async function uvBinary() {
  if (process.env.ZCODE_UV_PATH) return process.env.ZCODE_UV_PATH;
  const name = process.platform === "win32" ? "uv.exe" : "uv";
  const paths = (process.env.PATH || "")
    .split(process.platform === "win32" ? ";" : ":")
    .map((dir) => join(dir, name));
  paths.push(join(homedir(), ".local/bin", name), "/opt/homebrew/bin/uv", "/usr/local/bin/uv");
  for (const path of paths) {
    try {
      await access(path);
      return path;
    } catch {}
  }
  return name;
}
const godot = await binary();
const env = {
  ...process.env,
  GODOT_MCP_BRIDGE_URL: connection.url,
  GODOT_MCP_BRIDGE_TOKEN: connection.token,
  GODOT_MCP_PROJECT_DIR: project,
  GODOT_MCP_TRANSPORT: "stdio",
  GODOT_MCP_CHECK_UPDATES: "false",
  FASTMCP_CHECK_FOR_UPDATES: "off",
  FASTMCP_SHOW_SERVER_BANNER: "false",
  ...(godot ? { GODOT_MCP_GODOT_BIN: godot } : {}),
  UV_PROJECT_ENVIRONMENT: join(
    dataRoot,
    `python-39055305346c-${createHash("sha256").update(here).digest("hex").slice(0, 12)}`,
  ),
};
if (action === "setup" || action === "launch") {
  await setup();
  if (action === "launch") {
    if (!godot)
      throw new Error(
        "Godot not found. Install native Godot 4.4+ or set GODOT_PATH to its executable.",
      );
    const debugPort = await freePort();
    const child = spawn(
      godot,
      [
        "--editor",
        "--path",
        project,
        "--debug-server",
        `tcp://127.0.0.1:${debugPort}`,
        "--log-file",
        join(data, "editor.log"),
      ],
      { env, detached: true, stdio: "ignore" },
    );
    await new Promise((ok, fail) => {
      child.once("spawn", ok);
      child.once("error", fail);
    });
    child.unref();
  }
  console.log(
    JSON.stringify({
      project,
      addon: "installed",
      launched: action === "launch",
      godot: godot || null,
    }),
  );
} else if (action === "serve") {
  const check = createServer();
  await new Promise((ok, fail) => {
    check.once("error", () =>
      fail(
        new Error(
          "The project MCP port is already in use. Stop the previous MCP client for this project before reconnecting.",
        ),
      ),
    );
    check.listen(Number(new URL(connection.url).port), "127.0.0.1", ok);
  });
  await new Promise((ok) => check.close(ok));
  const child = spawn(
    await uvBinary(),
    [
      "run",
      "--directory",
      join(here, "upstream"),
      "--frozen",
      "--no-dev",
      "--no-editable",
      "python",
      "-m",
      "mcp_server.main",
    ],
    { env, stdio: "inherit" },
  );
  child.on("error", (error) => {
    console.error(`Godot MCP could not start: ${error.message}. Install uv or set ZCODE_UV_PATH.`);
    process.exitCode = 1;
  });
  child.on("exit", (code) => {
    process.exitCode = code ?? 1;
  });
  for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, () => child.kill(signal));
} else throw new Error("Usage: native.mjs setup|launch|serve [project-directory]");
