# Godot

[English](README.md)

通过打包的 hybridindie MCP 和四套 skills 开发原生 Godot 游戏。这是普通插件，没有 ZCode 侧栏 UI 或 Web 编辑器，直接操作原版桌面 Godot。

## 开始使用

让 Agent“配置 Godot 并创建游戏”，或调用插件的 `open` 命令。`godot-setup` 检查 Node、原生 Godot 4.4+ 和 uv，在用户授权范围内从官方来源安装缺失依赖，再安装并启用项目 addon。插件不包含 Godot 或 uv 本体；保留已有安装与非插件托管的 addon。C# 项目还需要 Godot .NET 和对应 SDK。

将 ZCode 工作区设为包含 `project.godot` 的目录。执行 `node "${ZCODE_PLUGIN_ROOT}/dist/native.mjs" launch "/absolute/project/path"` 初始化并启动；如果项目已经打开，使用 `setup`，保存改动后重新载入项目。手动执行时将 `${ZCODE_PLUGIN_ROOT}` 替换为实际插件安装路径。编辑前确认 `godot_health_check` 返回 `bridge_connected=true`，并核对项目身份。安装依赖后重新连接 MCP。同一项目当前只支持一个 MCP 客户端。

| Skill | 用途 |
| --- | --- |
| godot-setup | 检测和安装依赖、初始化 addon、检查连接 |
| godot-getting-started | 工具发现、提示词和资源接口 |
| godot-expert | 场景、脚本编写与引擎约定 |
| godot-playtest-and-debug | 运行、模拟输入、读取状态和调试 |

## 依赖与副作用

Node 启动 uv，首次使用时联网配置 Python 并安装锁定的上游依赖。构建从 GitHub 下载并校验上游源码归档。环境初始化可能从官方来源下载 Godot 和 uv。不需要付费 API 或独立模型密钥；Agent 使用宿主配置的模型。

初始化写入 `addons/godot_mcp`、在 `project.godot` 启用插件，并将私有连接凭据写入 `.godot/zcode-mcp.json`；请让 Git 忽略 `.godot/`。状态、Python 环境和编辑器日志位于 `~/.zcode/plugin-data/godot-native/`，可用 `ZCODE_GODOT_DATA_DIR` 隔离。桥接仅监听 localhost，并进行 token 认证。启动编辑器使用独立调试端口。MCP 可以编辑文件和场景、执行项目代码及启动子进程，仅用于可信项目；保留上游工具分组、提示词、资源和修改操作确认机制。

在 MCP 环境配置 `GODOT_PATH` / `GODOT_MCP_GODOT_BIN` 和 `ZCODE_UV_PATH` 可覆盖程序发现。仅在终端设置环境变量不会改变已运行的宿主。缺失依赖由 setup skill 处理，MCP 启动过程不会静默安装这些程序。

## 来源与验证范围

打包的 [hybridindie/godot-mcp](https://github.com/hybridindie/godot-mcp) 版本为 2026.10.21b2，提交 `39055305346cf3b46a18ddc31385427230ef9382`，遵循 MIT 许可，见 LICENSE-hybridindie.txt。构建对 addon 增加项目级凭据读取和原生调试会话兼容处理。Godot 图标来自 Godot Engine，遵循 MIT，许可见源码仓库 `assets/godot/LICENSE.txt`。这是社区 MCP 集成，并非 Godot 官方 MCP 产品。

已在 macOS/Godot 4.7.2 通过安装后的 MCP 入口验证：写脚本和场景、保存、原生运行、模拟输入、钓满三条鱼、完成/重置断言和游戏截图。Windows/Linux 安装说明尚未实机验证；没有在现有 ZCode UI 会话中重复本次原生 MCP 端到端流程。源码沿用仓库 `ui-plugins/godot` 构建目录约定，但插件不提供 UI。
