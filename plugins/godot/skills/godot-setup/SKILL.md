---
name: godot-setup
description: Set up the native Godot plugin before first use. Use when Godot or uv is missing, MCP cannot start, opening or creating a Godot project, or installing the project addon. Covers macOS, Windows and Linux dependency installation and connection verification.
---

# Native Godot setup

Run this workflow BEFORE calling MCP when prerequisites have not been verified. The plugin bundles the MCP server, addon and skills, but does not bundle Godot or uv. Do not tell the user to install them manually when you can perform the authorized setup with shell tools. Explain which missing dependencies will be installed, then proceed within the user's authorization and host permission policy. Preserve existing installations and projects.

## 1. Detect prerequisites

Detect OS and CPU architecture. Check Node (`node --version`), uv (`uv --version`) and native Godot (`godot --version` or the resolved executable with `--version`). Godot must be 4.4 or newer; the packaged integration was validated with 4.7.2. Prefer an existing compatible installation. For an existing project, preserve its engine version where possible; never silently migrate it to a newer major version. Standard Godot supports GDScript; C# projects require the .NET edition and SDK separately.

The launcher discovers GODOT_PATH / GODOT_MCP_GODOT_BIN, /Applications/Godot.app, ~/Applications/Godot.app, PATH godot/godot4, ~/.local/bin/godot, and Windows %LOCALAPPDATA%/ZCode/Godot/Godot.exe. uv is found via ZCODE_UV_PATH, PATH, ~/.local/bin/uv, or Homebrew. Resolve plugin root from the installed skill's location if ZCODE_PLUGIN_ROOT is not expanded in skill text.

## 2. Install only missing dependencies

Use the official Godot download page https://godotengine.org/download/ and its official godotengine/godot-builds GitHub release assets. Resolve a stable, compatible release and the correct CPU architecture at execution time; do not invent URLs or use a Web/WASM build. Verify the download against the publisher's SHA256 manifest before extraction. Do not overwrite an existing install, disable OS security protections, or request a Mac login password.

- macOS: if Homebrew already exists, `brew install --cask godot` and `brew install uv` are suitable. Otherwise extract the official macOS archive to ~/Applications/Godot.app without replacing an existing app. Let normal macOS first-launch approval happen if required.
- Windows: extract the official Windows archive into %LOCALAPPDATA%/ZCode/Godot. Keep the distribution files together; name the GUI executable Godot.exe for automatic discovery. Install uv through its official PowerShell installer from https://docs.astral.sh/uv/getting-started/installation/; follow the current official instructions. Do not change machine-wide execution policy.
- Linux: extract the official native Linux archive for the CPU architecture, make its executable runnable and place it at ~/.local/bin/godot. Prefer this user-local distribution over a sandboxed Flatpak for this local MCP integration. Install uv using its official standalone installer.

For macOS/Linux, the official uv installer is `curl -LsSf https://astral.sh/uv/install.sh | sh`. Refer to https://docs.astral.sh/uv/getting-started/installation/ for current supported options. Download and inspect installer scripts first where host policy requires it. No separate Python installation is normally needed: uv provisions the project's required Python and pinned dependencies. If Node is absent, use the existing system package manager or official Node installer compatible with ZCode's plugin runtime.

After installation execute both binaries with `--version`; verify exit codes. A downloaded archive alone is not successful installation. GUI-launched ZCode may have a stale PATH: prefer the discovery paths above or configure GODOT_PATH/ZCODE_UV_PATH in the plugin's MCP environment and restart its connection. Setting an environment variable in a temporary terminal does not update an already running MCP server. Do not claim Windows/Linux runtime validation from macOS-only checks.

## 3. Prepare the project

Use a ZCode workspace rooted at the directory containing project.godot. For a new game, create that directory and a minimal project.godot without replacing existing files, and ignore .godot/ in version control. Do not point the MCP server at a parent workspace while launching a different child project: connection credentials are per project.

Run `node "${ZCODE_PLUGIN_ROOT}/dist/native.mjs" launch "/absolute/project/path"`. In PowerShell use the actual plugin path and project path, not shell-specific $PWD expansion. This copies the bundled addon, enables it and starts the original Godot editor with an isolated debugger port. If the project is already open, use `setup` instead of `launch`, preserve unsaved changes and reload the project. An unmanaged addons/godot_mcp must be explicitly migrated, never overwritten. Keep .godot/zcode-mcp.json private and ignored by Git.

## 4. Verify the connection

Reconnect the plugin MCP server after installing prerequisites. Call godot_health_check: require bridge_connected=true and compatible server/addon versions. Use godot_inspection_get_project_info to verify the intended project. If a port is occupied, stop only this project's previous MCP client; never kill unrelated editors. This version supports one MCP client per project.

Then follow godot-getting-started for tool discovery, godot-expert for authoring, and godot-playtest-and-debug for runtime inspection and input. Discover live tool schemas; godot_enable_toolset takes category, and script writing is godot_scripts_write. Do not report setup complete just because the process started.
