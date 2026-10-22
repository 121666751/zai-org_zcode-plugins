import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, cp, rm, symlink, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), "godot-plugin-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const project = join(root, "project");
  await mkdir(project);
  await cp(new URL("./native.mjs", import.meta.url), join(root, "native.mjs"));
  await mkdir(join(root, "upstream/godot/addons/godot_mcp"), { recursive: true });
  await writeFile(
    join(root, "upstream/godot/addons/godot_mcp/plugin.cfg"),
    '[plugin]\nname="MCP"\n',
  );
  await writeFile(
    join(project, "project.godot"),
    'config_version=5\n[editor_plugins]\nenabled=PackedStringArray("res://addons/other/plugin.cfg")\n',
  );
  const run = () =>
    new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [join(root, "native.mjs"), "setup", project], {
        env: { ...process.env, ZCODE_GODOT_DATA_DIR: join(root, "state") },
      });
      let output = "";
      child.stdout.on("data", (chunk) => (output += chunk));
      child.stderr.on("data", (chunk) => (output += chunk));
      child.on("error", reject);
      child.on("exit", (code) => resolve({ code, output }));
    });
  return { root, project, run };
}

test("setup preserves existing plugins and reuses credentials on repeat", async (t) => {
  const { project, run } = await fixture(t);
  assert.equal((await run()).code, 0);
  const before = await readFile(join(project, ".godot/zcode-mcp.json"), "utf8");
  assert.equal((await run()).code, 0);
  assert.equal(await readFile(join(project, ".godot/zcode-mcp.json"), "utf8"), before);
  const config = await readFile(join(project, "project.godot"), "utf8");
  assert.match(config, /addons\/other\/plugin.cfg/);
  assert.equal(config.split("res://addons/godot_mcp/plugin.cfg").length - 1, 1);
  assert.match(JSON.parse(before).url, /^ws:\/\/127\.0\.0\.1:\d+$/);
  assert.ok(JSON.parse(before).token.length > 20);
  if (process.platform !== "win32")
    assert.equal((await stat(join(project, ".godot/zcode-mcp.json"))).mode & 0o777, 0o600);
});

test("setup refuses to overwrite an unmanaged addon", async (t) => {
  const { project, run } = await fixture(t);
  const addon = join(project, "addons/godot_mcp");
  await mkdir(addon, { recursive: true });
  await writeFile(join(addon, "plugin.cfg"), "user content");
  const result = await run();
  assert.notEqual(result.code, 0);
  assert.match(result.output, /unmanaged/);
  assert.equal(await readFile(join(addon, "plugin.cfg"), "utf8"), "user content");
});

test(
  "setup refuses a symlinked addon parent",
  { skip: process.platform === "win32" },
  async (t) => {
    const { root, project, run } = await fixture(t);
    await mkdir(join(root, "outside"));
    await symlink(join(root, "outside"), join(project, "addons"));
    const result = await run();
    assert.notEqual(result.code, 0);
    assert.match(result.output, /symlink/);
  },
);
