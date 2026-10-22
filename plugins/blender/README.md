# Blender MCP (Official Blender Lab)

<p align="center"><img src="https://cdn-zcode.z.ai/zcode/official-plugin/assets/blender/icon.png" width="96" alt="Blender"></p>

[中文文档](./README_CN.md)

This plugin wraps the **official Blender Lab MCP server** (`blender_mcp`) for ZCode. It connects to a running Blender 5.1+ instance through the Blender Lab MCP add-on and exposes the official server's 26 tools: scene inspection, bpy execution, bundled API/manual search, screenshots, and rendering.

This MCP-only plugin replaces the previous UI-based `blender` plugin; it adds no side panel. It is not the community `ahujasid/blender-mcp` project. The Blender binary and add-on are not bundled; both are installed locally.

## Components

| Component | What it does |
| --- | --- |
| MCP server `blender-lab` | Official `blender-mcp` Python server, launched with `uvx` from the pinned upstream tag `v1.0.3` |
| Skill `setup` | Checks Blender 5.1+, installs/verifies the official add-on and `uv`, starts the bridge, verifies the full MCP chain |
| Skill `blender` | Operating loop and safety rules for the official tools: inspect → execute → verify → save |
| Launcher `scripts/run.mjs` | Finds `uvx` from PATH, Homebrew, `~/.local/bin`, or `~/.cargo/bin`, then starts the pinned server |

## Requirements

- **Blender 5.1.0 or newer**.
- The **MCP add-on** from Blender Lab installed and enabled, with **Start MCP Server** running (default `localhost:9876`).
- **Allow Online Access** enabled in Blender Preferences → System → Network; the add-on refuses to start otherwise.
- **uv / uvx** available. On macOS: `brew install uv`. Official installer: <https://docs.astral.sh/uv/getting-started/installation/>.
- Network access on first use so `uvx` can download the pinned official package and its dependencies.

## Setup

Install and enable `blender` from the ZCode plugin manager, then run `/blender:setup` in a new task. The skill checks each layer and reports exactly what is missing.

Manual path:

1. Install Blender 5.1+.
2. In Blender: Preferences → Get Extensions → Repositories → add `https://lab.blender.org/`, then install and enable the **MCP** add-on. Alternatively install `mcp-1.0.3.zip` from the official release page via **Install from Disk**.
3. Enable **Allow Online Access**, then click **Start MCP Server** in the add-on preferences.
4. Install `uv` and confirm `uvx --version` works.
5. Keep the target `.blend` open in Blender and ask ZCode to inspect it.

The pinned add-on release is `v1.0.3`: <https://projects.blender.org/lab/blender_mcp/releases/tag/v1.0.3>. Update the launcher's tag and the add-on together.

## Usage

Examples:

- `Inspect the current scene and list the 10 objects with the highest polygon count.`
- `Rename all material data-blocks to the LGT-/GEO-/MAT- convention and report each change.`
- `Add a three-point light setup and render a 960x720 preview to /tmp/still.png.`
- `Use the CLI tools to audit every .blend in ./assets for missing external files.`
- `Search the bundled API docs for the glTF export operator and show its parameters.`

The `blender` skill activates on Blender/bpy/3D requests. You can also pick it explicitly from the composer's Skills group.

## Safety

- The official server **executes model-written Python inside Blender**. Its add-on has only a weak guard for a few operators and `sys.exit`; treat it as arbitrary code execution, not a sandbox.
- Work on copies and make backups before destructive edits. Saving or overwriting a `.blend` requires an explicit user request.
- Do not expose the bridge beyond loopback. Keep host `localhost`; do not bind `0.0.0.0` or publish port `9876`.
- Do not send scene data, credentials, or secrets to external services from executed code.
- The community package is also named `blender-mcp` and uses port `9876`. Do not run both the official and community servers at the same time.

## Upstream and license

- Official page: <https://www.blender.org/lab/mcp-server/>
- Source: <https://projects.blender.org/lab/blender_mcp>
- Upstream release: `v1.0.3`, commit `2cea8d566dde07fbac28a61d698909d69724e853`
- License: GPL-3.0-or-later. See [`LICENSE`](./LICENSE) and [`UPSTREAM.md`](./UPSTREAM.md).

This ZCode wrapper is maintained by Z.ai and is not published by the Blender Foundation or Blender Lab.

Open a new ZCode session after enabling or updating the plugin so the Skill catalog and MCP server list refresh.
