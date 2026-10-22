#!/usr/bin/env node
/**
 * Launch the official Blender Lab MCP server through uvx.
 *
 * ZCode starts MCP servers from a GUI environment whose PATH may not include
 * Homebrew or ~/.local/bin, so resolve uvx from the common install locations.
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// Pinned to the official release tag. Update together with the add-on version.
const PACKAGE =
  "blender-mcp @ git+https://projects.blender.org/lab/blender_mcp.git@v1.0.3#subdirectory=mcp";

const home = homedir();
const candidates = [
  process.env.UVX,
  "/opt/homebrew/bin/uvx",
  "/usr/local/bin/uvx",
  join(home, ".local", "bin", "uvx"),
  join(home, ".cargo", "bin", "uvx"),
  join(home, ".local", "bin", "uvx.exe"),
  join(home, ".cargo", "bin", "uvx.exe"),
].filter(Boolean);

const uvx = candidates.find((candidate) => candidate === "uvx" || existsSync(candidate)) ?? "uvx";

const child = spawn(uvx, ["--from", PACKAGE, "blender-mcp"], {
  stdio: "inherit",
  env: { ...process.env, UV_NO_CONFIG: "1" },
});

child.on("error", (error) => {
  console.error(`[blender-mcp] failed to launch uvx: ${error.message}`);
  console.error(
    "[blender-mcp] Install uv, then restart ZCode: https://docs.astral.sh/uv/getting-started/installation/",
  );
  process.exit(1);
});

child.on("exit", (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    if (!child.killed) child.kill(signal);
  });
}
