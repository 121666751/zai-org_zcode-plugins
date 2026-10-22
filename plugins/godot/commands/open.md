---
description: Connect a native Godot project to the bundled MCP server
---
Use godot-setup first to detect and install missing Godot/uv, then godot-getting-started. This plugin has no ZCode side pane. Work in the Godot project root containing project.godot. Run `node "${ZCODE_PLUGIN_ROOT}/dist/native.mjs" launch "$PWD"` to install the bundled addon, enable it, and open the original native editor. Set GODOT_PATH if Godot is not discoverable; uv is required by the MCP server. Preserve existing unmanaged addons and unsaved editor state. If the editor is already open, use setup instead of launch, then reload the project. Verify godot_health_check before editing. Use the bundled playtest skill to run, inspect, and simulate input in the native game.
