# Unreal Engine

[English](README.md)

非 UI 的 ZCode 插件，通过 Epic 实验性 Unreal MCP 连接独立安装的 Unreal Editor。包含适配 ZCode 的官方 `unreal-mcp`、`create-toolset`、`unreal-skill` 三个 Skills，不打包引擎、原生代理或 UI 面板。

## 配置

1. 安装包含 `ModelContextProtocol` 和 `AllToolsets` 的 UE 版本（官方文档对应 UE 5.8），在目标项目中启用两者。
2. 用 Unreal Editor 打开项目，在编辑器控制台运行 `ModelContextProtocol.StartServer`。
3. 在 ZCode 插件市场安装并启用 **Unreal Engine**。插件设置 `endpoint` 默认 `http://127.0.0.1:8000/mcp`，端口不同时修改此设置；不要重复添加项目级 MCP 连接。
4. 对 ZCode 说：“使用 Unreal MCP 确认连接的项目，列出场景中的对象，不做修改。”成功的只读调用才证明已连通；仅配置好地址不代表编辑器可用。

`unreal-mcp` 用于操作编辑器，`create-toolset` 用于扩展 UE 工具，`unreal-skill` 用于编写 UE 项目 Agent Skills。详见[配置](skills/unreal-mcp/references/setup.md)与[排障](skills/unreal-mcp/references/operations.md)。

## 连接与安全

地址由运行 ZCode Agent 的机器解析。SSH、WSL、Docker 工作区里的回环地址指向对应环境，不是桌面。UE MCP 默认无鉴权，应保持回环监听，跨机器时显式使用受保护连接。多个编辑器同时运行时，先确认项目身份再修改。批量修改前保存，不是所有 MCP 操作都支持撤销。编辑器必须运行，可用工具取决于启用的 UE 工具集。

## 来源

Skills 来自 [EpicGames/unreal-engine-skills-for-claude-code-plugin](https://github.com/EpicGames/unreal-engine-skills-for-claude-code-plugin)，版本固定在 [upstream.json](skills/upstream.json)，各 Skill 目录保留 MIT 许可。ZCode 适配连接和配置说明；本插件由 Z.ai 维护，不表示 Epic 背书。Unreal Engine 本身遵循独立授权。市场图标由插件资源 CDN 提供。
