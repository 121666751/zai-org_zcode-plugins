# Godot

[中文](README_CN.md)

Develop native Godot games through the bundled hybridindie MCP server and four skills. This standard plugin has no ZCode side pane or Web editor; it controls the original Godot desktop editor.

## Start

Ask the Agent to “set up Godot and create a game”, or invoke the plugin's `open` command. `godot-setup` checks Node, native Godot 4.4+ and uv, installs missing prerequisites from official sources within the user's authorization, then installs/enables the project addon. Godot and uv are not bundled. Existing installations and unmanaged addons are preserved. C# projects additionally require Godot .NET and its SDK.

Open ZCode in the directory containing `project.godot`. Run `node "${ZCODE_PLUGIN_ROOT}/dist/native.mjs" launch "/absolute/project/path"` to prepare and launch it; use `setup` for an already open project, save changes and reload the project. Replace `${ZCODE_PLUGIN_ROOT}` with the installed plugin path when running manually. Require `godot_health_check` to report `bridge_connected=true` and inspect project identity before editing. Restart the MCP connection after installing dependencies. Only one MCP client per project is supported.

| Skill | Purpose |
| --- | --- |
| godot-setup | Dependency detection/installation, addon setup and connection checks |
| godot-getting-started | Tool discovery, prompts and resources |
| godot-expert | Scene/script authoring and engine conventions |
| godot-playtest-and-debug | Run, simulate input, inspect state and debug |

## Dependencies and side effects

Node launches uv, which provisions Python and installs the pinned upstream dependencies on first use (network required). Build downloads a checksum-verified upstream source archive from GitHub. Dependency setup may download Godot and uv from their official distributors. No paid API or separate model key is required; the Agent uses the host's configured model.

Setup writes `addons/godot_mcp`, enables it in `project.godot`, and stores private connection credentials in `.godot/zcode-mcp.json`; ignore `.godot/` in Git. State, Python environments and editor logs live in `~/.zcode/plugin-data/godot-native/` (`ZCODE_GODOT_DATA_DIR` overrides this for isolation). The bridge binds localhost with token authentication. Launch starts an editor with an isolated debugger port. MCP tools can edit files/scenes, execute project code and run subprocesses; only use trusted projects. Toolsets, prompts, resources and upstream mutation confirmations are preserved.

Override executable discovery with `GODOT_PATH` / `GODOT_MCP_GODOT_BIN` and `ZCODE_UV_PATH` in the MCP environment. A terminal-only environment change does not alter an already running host. Missing prerequisites are handled by the setup skill, not silently installed by MCP startup.

## Provenance and validation

Bundled [hybridindie/godot-mcp](https://github.com/hybridindie/godot-mcp), version 2026.10.21b2, commit `39055305346cf3b46a18ddc31385427230ef9382`, is MIT licensed (see LICENSE-hybridindie.txt). Build applies small addon adaptations for per-project credentials and native debugger session handling. The Godot icon is from Godot Engine under MIT; see `assets/godot/LICENSE.txt` in the source repository. This is a community MCP integration, not an official Godot MCP product.

macOS/Godot 4.7.2 was exercised through the installed MCP entry: script/scene writes, save, native play, input, three successful catches, completion/restart assertions and game screenshots. Windows/Linux setup instructions have not been validated on physical machines. The existing ZCode UI session was not used to repeat this native MCP end-to-end run. Plugin sources use the repository's existing `ui-plugins/godot` build convention despite providing no UI.
