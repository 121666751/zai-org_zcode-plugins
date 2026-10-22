# Upstream provenance

- Project: Blender Lab MCP
- Repository: https://projects.blender.org/lab/blender_mcp
- Release: `v1.0.3` (2026-09-11)
- Commit: `2cea8d566dde07fbac28a61d698909d69724e853`
- Add-on artifact: `mcp-1.0.3.zip` (Blender 5.1.0+, GPL-3.0-or-later)
- Server entry point: `blender-mcp = "blmcp:main"`
- License: GPL-3.0-or-later (see `LICENSE`)

## ZCode packaging changes

- Replaced the previous UI-based `blender` plugin and removed its `ui-plugins/blender` source. This plugin is MCP-only and declares no UI surface.
- Added `.zcode-plugin/plugin.json` and `.claude-plugin/plugin.json`.
- Added `.mcp.json` with a stdio server pinned to the upstream git tag `v1.0.3` via `uvx`.
- Added `scripts/run.mjs`, which resolves `uvx` from common install locations before launching the pinned server.
- Added ZCode-specific `setup` and `blender` skills and a tool reference.
- Added bilingual plugin documentation and kept the existing Blender marketplace icon (`assets/blender/icon.png`).

No upstream server or add-on source is vendored into this plugin. The MCP server is fetched from the pinned upstream git tag on first use; the add-on is installed separately inside Blender.

## Upstream behavior and security

The official server connects to the add-on's TCP socket at `localhost:9876` and relays Python code for execution inside Blender. The add-on includes a deliberately weak guard for a few operators and `sys.exit`; it is not a security sandbox. Treat all executed code as arbitrary code execution with the user's Blender privileges.

The official server and the community project `ahujasid/blender-mcp` share the package name `blender-mcp` and the default port `9876`. This plugin uses the Blender Lab git source, not the PyPI/uvx community package.
