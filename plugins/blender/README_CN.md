# Blender MCP（Blender 官方 Lab 版）

<p align="center"><img src="https://cdn-zcode.z.ai/zcode/official-plugin/assets/blender/icon.png" width="96" alt="Blender"></p>

[English](./README.md)

本插件把 **Blender Lab 官方 MCP server**（`blender_mcp`）封装进 ZCode：通过 Blender Lab 的 MCP add-on 连接正在运行的 Blender 5.1+，提供官方 server 的 26 个工具，覆盖场景检查、bpy 执行、内置 API/手册检索、截图和渲染。

本插件是 MCP-only，替换之前带 UI 面板的 `blender` 插件，不提供侧边面板；它不是社区项目 `ahujasid/blender-mcp`。Blender 本体和 add-on 都不打包，需要在本地安装。

## 组成

| 组件 | 作用 |
| --- | --- |
| MCP server `blender-lab` | 官方 `blender-mcp` Python server，通过 `uvx` 从上游固定标签 `v1.0.3` 启动 |
| Skill `setup` | 检查 Blender 5.1+，安装/验证官方 add-on 与 `uv`，启动桥接，验证完整 MCP 链路 |
| Skill `blender` | 官方工具的操作闭环与安全规则：检查 → 执行 → 验证 → 保存 |
| Launcher `scripts/run.mjs` | 从 PATH、Homebrew、`~/.local/bin`、`~/.cargo/bin` 找到 `uvx`，再启动固定版本 server |

## 要求

- **Blender 5.1.0 或更新版本**。
- 已安装并启用 Blender Lab 的 **MCP add-on**，且 **Start MCP Server** 正在运行（默认 `localhost:9876`）。
- Blender Preferences → System → Network 里的 **Allow Online Access** 已开启；否则 add-on 会拒绝启动。
- **uv / uvx** 可用。macOS 可执行 `brew install uv`；官方安装说明：<https://docs.astral.sh/uv/getting-started/installation/>。
- 首次使用需要联网，让 `uvx` 下载固定版本的上游包和依赖。

## 设置

从 ZCode 插件市场安装并启用 `blender`，新建任务后运行 `/blender:setup`。Skill 会逐层检查并报告缺哪一环。

手动步骤：

1. 安装 Blender 5.1+。
2. Blender → Preferences → Get Extensions → Repositories → 添加 `https://lab.blender.org/`，搜索并安装 **MCP** add-on，然后启用。也可以从官方 release 下载 `mcp-1.0.3.zip`，用 **Install from Disk** 安装。
3. 打开 **Allow Online Access**，在 add-on 偏好设置里点击 **Start MCP Server**。
4. 安装 `uv`，确认 `uvx --version` 正常。
5. 在 Blender 里打开目标 `.blend`，让 ZCode 检查场景。

固定的 add-on 版本是 `v1.0.3`：<https://projects.blender.org/lab/blender_mcp/releases/tag/v1.0.3>。升级时同时更新 launcher 的标签和 add-on。

## 使用示例

- `检查当前场景，列出面数最高的 10 个对象。`
- `把材质数据块统一改成 LGT-/GEO-/MAT- 命名，并报告每一处修改。`
- `加一套三点布光，渲染 960x720 预览到 /tmp/still.png。`
- `用 CLI 工具审计 ./assets 下每个 .blend 的缺失外部文件。`
- `在内置 API 文档里搜索 glTF 导出 operator，列出参数。`

涉及 Blender/bpy/3D 的请求会自动触发 `blender` skill，也可以在 composer 的 Skills 组里手动选择。

## 安全边界

- 官方 server **会在 Blender 里执行模型生成的 Python**。add-on 只对少数 operator 和 `sys.exit` 做了弱拦截，**不是安全沙箱**，必须按任意代码执行对待。
- 默认在副本上工作；破坏性修改前先备份。保存或覆盖 `.blend` 必须有用户明确要求。
- 桥接只绑定 loopback。保持 host 为 `localhost`，不要改成 `0.0.0.0`，也不要对外暴露 `9876` 端口。
- 不要在执行的代码里把场景数据、凭证或密钥发到外部服务。
- 社区包也叫 `blender-mcp`，同样使用 `9876` 端口；官方和社区 server 不要同时运行。

## 上游与许可

- 官方页面：<https://www.blender.org/lab/mcp-server/>
- 源码：<https://projects.blender.org/lab/blender_mcp>
- 上游 release：`v1.0.3`，commit `2cea8d566dde07fbac28a61d698909d69724e853`
- 许可：GPL-3.0-or-later，见 [`LICENSE`](./LICENSE) 与 [`UPSTREAM.md`](./UPSTREAM.md)。

本 ZCode 封装由 Z.ai 维护，不是 Blender Foundation 或 Blender Lab 发布的插件。

启用或更新插件后请新建 ZCode session，确保 Skill 清单和 MCP server 列表刷新。
