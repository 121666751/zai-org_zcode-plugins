---
name: setup
description: Install and verify the official Blender Lab MCP stack: Blender 5.1+, the MCP add-on and local bridge, uv/uvx, and the ZCode MCP connection.
---

# 设置 Blender 官方 MCP

官方 MCP 由两部分组成：Blender 里的 **MCP add-on**（TCP 桥，默认 `localhost:9876`）和独立运行的 **blender-mcp** Python server（stdio）。ZCode 插件负责启动 server；add-on 必须由用户在 Blender 里安装并启动。

## 0. 前置：插件和 server

本 skill 随 `blender` 插件安装。在 ZCode 里能选择本 skill 通常说明插件已加载；从源码目录直接阅读 `SKILL.md` 不算安装证据，以 **Settings → Plugins / Settings → MCP** 的实际状态为准。

如果 **Settings → MCP** 里没有 `blender-lab`：

- 插件未安装或未启用：先完成第 1–2 步的环境诊断，然后指导用户在 Plugin Marketplace 安装并启用 `blender`，新建 session。不要尝试调用不存在的工具，也不要继续第 5 步。
- 插件已启用但 server 未连接：先确认 Blender 已安装且版本满足要求；满足时按第 5 步检查 `uvx` 和 Settings → MCP 状态，Blender 缺失或版本不够时按第 1 步停下。

不要安装 PyPI/uvx 上同名的社区 `blender-mcp`（`ahujasid/blender-mcp`）。它和官方包同名、默认端口也相同，二者只能运行一个。

## 1. 检查 Blender

```bash
if command -v blender >/dev/null 2>&1; then
  blender --version
else
  echo "BLENDER_NOT_FOUND"
fi
```

用 `command -v` 判断是否存在；不要只看 `blender --version | head` 的管道退出码。要求 **Blender 5.1.0 或更新版本**。`command -v` 找不到时检查：

- macOS：`/Applications/Blender.app/Contents/MacOS/Blender`
- Linux：`/usr/bin/blender`、`/snap/bin/blender`，或官方 tarball 解压目录
- Windows：`C:\Program Files\Blender Foundation\Blender <version>\blender.exe`

记录真实路径，并填到 **Settings → Plugins → Blender → Blender 可执行文件**。后台工具（`execute_blender_code_for_cli` 等）通过 `BLENDER_PATH` 使用它；只做实时编辑时可以暂时留默认值 `blender`。

缺少 Blender 时，先报告检测结果并展示对应安装命令，不要静默安装。取得用户明确同意后可以代为执行；执行后回到第 1 步。未取得同意时只展示命令，并完成第 1–2 步的只读检查后停止：

- macOS：`brew install --cask blender`
- Linux：`sudo snap install blender --classic`，或从 <https://www.blender.org/download/> 下载官方 tarball
- Windows：`winget install BlenderFoundation.Blender`，或使用官方安装包

安装后重新验证版本，低于 5.1 时提示升级。

**未同意安装，或 Blender 仍缺失/低于 5.1 时，停在第 1–2 步**：可以继续检查 uv/uvx 是否存在，但不要安装 add-on、启动桥接或声称环境就绪。第 3–5 步留到 Blender 安装完成后执行。

## 2. 检查 uv / uvx

```bash
command -v uvx
uvx --version
```

缺少时先展示安装命令并取得用户明确同意；未同意时只展示，不要执行。同意后执行其中一种：

```bash
# macOS（Homebrew，推荐，GUI 环境通常能直接找到）
brew install uv

# macOS / Linux（官方脚本，装到 ~/.local/bin）
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Windows PowerShell：

```powershell
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

安装后重新打开终端并验证 `uvx --version`。如果 ZCode 在安装 uv 之前已经启动，重启 ZCode，让 MCP server 进程拿到新的 PATH。插件自带的 `scripts/run.mjs` 会额外查找 Homebrew 和 `~/.local/bin` 下的 `uvx`。

## 3. 安装官方 MCP add-on

在 Blender 内操作，先征得用户同意再改 Blender 配置。

**方式 A：从 Blender Lab 扩展仓库安装（推荐）**

1. Preferences → Get Extensions → Repositories（齿轮菜单）→ 添加仓库 `https://lab.blender.org/`。
2. 搜索 `MCP`，安装 Blender Lab 的 **MCP** add-on 并启用。
3. Preferences → System → Network，确认 **Allow Online Access** 已开启。add-on 的本地 socket 也受这个开关控制；关闭时它会拒绝启动。

**方式 B：安装固定版本（可复现）**

下载官方 release 里的 add-on zip：

```text
https://projects.blender.org/lab/blender_mcp/releases/download/v1.0.3/mcp-1.0.3.zip
```

然后 Preferences → Get Extensions → Install from Disk，选择该 zip，启用 add-on。版本应为 `1.0.3`，与插件固定的 server 版本一致。

## 4. 启动桥接服务

在 MCP add-on 的偏好设置里：

- 确认 Host = `localhost`，Port = `9876`（与插件设置一致）。
- 点击 **Start MCP Server**；需要每次随 Blender 启动时打开 **Auto Start**。
- 保持目标 `.blend` 文件在 Blender 中打开。

验证端口在监听（Host/Port 改过时替换下面的值）：

```bash
python3 - <<'PY'
import socket
with socket.create_connection(("localhost", 9876), timeout=3):
    print("BRIDGE_OK")
PY
```

失败时依次检查：Blender 是否在运行、add-on 是否启用、桥接服务是否 Start、Allow Online Access 是否开启、端口是否被其他程序占用。

后台/无头场景可以直接让 Blender 启动 add-on 的桥接服务：

```bash
blender --background --online-mode /absolute/path/scene.blend \
  --command blender_mcp --host localhost --port 9876
```

`--online-mode` 必须保留；否则 `bpy.app.online_access` 为假，add-on 会拒绝启动。该命令依赖 add-on 注册的 `blender_mcp` CLI：先用 `blender --background --command help` 确认它存在（显式加 `--background` 让意图明确）。如果命令不可用或失败，退回 GUI 启动桥接，不要反复尝试。

## 5. 验证 MCP server 与完整链路

先验证插件固定的 server 包能解析并启动：

```bash
uvx --from "blender-mcp @ git+https://projects.blender.org/lab/blender_mcp.git@v1.0.3#subdirectory=mcp" \
  blender-mcp --help
```

然后在 ZCode 里确认 **Settings → MCP** 的 `blender-lab` server 已连接。最后调用一个只读工具，例如 `get_blendfile_summary_path_info` 或 `get_objects_summary`；成功返回才证明 Blender → add-on → TCP → server → ZCode 全链路可用。

如果 `blender-lab` 未连接：

1. 确认插件已启用，并新建 session；Settings → MCP 里应能看到该 server。
2. 确认 `uvx --version` 正常，再运行上面的 `uvx ... blender-mcp --help`；首次运行需要联网下载。
3. 查看 Settings → MCP 里该 server 的状态/错误信息（以及 ZCode 的日志）定位 launcher 或 Python 依赖问题。
4. Blender 缺失或版本不够时，按第 1 步停下，不要在这一步反复重试。

Blender 缺失时 server 仍可能启动并列出工具（数量以实际 `list_tools` 为准），但实时工具会返回 `Cannot connect to Blender at <host>:<port>`（默认 `localhost:9876`）。这只证明 server 可启动，不证明环境可用。

只启动 server 不能证明桥接可用；只监听端口也不能证明 ZCode 能调用工具。

## 完成条件

报告实际 Blender 路径和版本、add-on 版本、host/port、uv 版本、`BRIDGE_OK` 结果，以及一次真实 MCP 只读调用的结果。缺少任一环节时，明确说明停在哪一层，不要报告“已就绪”。

## 缺少 Blender 时的最小报告

```text
ZCode plugin: 已安装并启用 / 未安装 / 未启用
Blender: 未安装 / <version> / <path>
uvx: 已安装 <version> / 缺失
Add-on: 未检查（需要 Blender 5.1+）
Bridge: 未监听 / 已监听 <host>:<port>
MCP server: 未注册 / 未连接 / 已连接未测试 / 已连接，工具数 <n>；实时调用 <成功 / 连接错误>
下一步: <安装命令或修复动作>
```

模板只列状态，不要把未执行的检查写成已验证结果；工具数、错误文本等以实际输出为准。
