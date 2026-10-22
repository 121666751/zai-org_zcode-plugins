import { readFile, writeFile, mkdir, cp, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
const upstream = JSON.parse(await readFile("hybridindie.json", "utf8"));
await mkdir("web", { recursive: true });
const archive = "web/hybridindie.tar.gz";
try {
  await readFile(archive);
} catch {
  execFileSync("curl", [
    "-fsSL",
    "--retry",
    "2",
    `https://codeload.github.com/hybridindie/godot-mcp/tar.gz/${upstream.commit}`,
    "-o",
    archive,
  ]);
}
if (
  createHash("sha256")
    .update(await readFile(archive))
    .digest("hex") !== upstream.sha256
)
  throw new Error("Hybridindie source checksum mismatch");
await rm("dist", { recursive: true, force: true });
await mkdir("dist/upstream", { recursive: true });
execFileSync("tar", [
  "-xzf",
  archive,
  "--strip-components=1",
  "-C",
  "dist/upstream",
  ...[
    "mcp_server",
    "godot/addons/godot_mcp",
    "pyproject.toml",
    "uv.lock",
    "LICENSE",
    "README.md",
  ].map((p) => `godot-mcp-${upstream.commit}/${p}`),
]);
// Native editor launches from Finder have no MCP environment. Read the same
// per-project connection file created by setup; upstream token auth is retained.
const addon = "dist/upstream/godot/addons/godot_mcp/";
for (const [file, from, to] of [
  [
    "godot_mcp.gd",
    'var url := OS.get_environment("GODOT_MCP_BRIDGE_URL")',
    'var url := OS.get_environment("GODOT_MCP_BRIDGE_URL")\n\tif url.is_empty():\n\t\tvar cfg = JSON.parse_string(FileAccess.get_file_as_string("res://.godot/zcode-mcp.json")) if FileAccess.file_exists("res://.godot/zcode-mcp.json") else {}\n\t\tif cfg is Dictionary:\n\t\t\turl = str(cfg.get("url", ""))',
  ],
  [
    "mcp_bridge.gd",
    '_auth_token = auth_token if not auth_token.is_empty() else OS.get_environment("GODOT_MCP_BRIDGE_TOKEN")',
    '_auth_token = auth_token if not auth_token.is_empty() else OS.get_environment("GODOT_MCP_BRIDGE_TOKEN")\n\tif _auth_token.is_empty():\n\t\tvar cfg = JSON.parse_string(FileAccess.get_file_as_string("res://.godot/zcode-mcp.json")) if FileAccess.file_exists("res://.godot/zcode-mcp.json") else {}\n\t\tif cfg is Dictionary:\n\t\t\t_auth_token = str(cfg.get("token", ""))',
  ],
]) {
  let text = await readFile(addon + file, "utf8");
  if (!text.includes(from)) throw new Error(`Upstream integration point changed: ${file}`);
  await writeFile(addon + file, text.replace(from, to));
}
// Godot may deliver the probe ready message after the session started signal.
// A ready message itself proves that this debugger session is active.
const debuggerPath = addon + "mcp_debugger.gd";
const debuggerSource = await readFile(debuggerPath, "utf8");
const readyAnchor = "\t\t\t_probe_ready = true";
if (!debuggerSource.includes(readyAnchor))
  throw new Error("Upstream debugger integration point changed");
await writeFile(
  debuggerPath,
  debuggerSource
    .replace(readyAnchor, readyAnchor + "\n\t\t\t_session_active = true")
    .replace("live.append(s.id)", "live.append(get_sessions().find(s))"),
);
await cp("native.mjs", "dist/native.mjs");
await cp("hybridindie.json", "dist/hybridindie.json");
console.log(`Built native Godot MCP ${upstream.version}; no Web/UI payload`);
