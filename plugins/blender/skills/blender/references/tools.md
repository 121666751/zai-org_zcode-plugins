# 官方 Blender MCP 工具参考

官方版本：Blender Lab MCP v1.0.3（add-on 与 server 同版本）。工具名以实际 MCP 列表为准；宿主可能加 server 前缀。

## 执行

| 工具 | 参数 | 说明 |
| --- | --- | --- |
| `execute_blender_code` | `code: str` | 在**当前运行的 Blender** 里执行 Python。每次调用使用新命名空间，必须重新 import；给 `result` 赋 JSON 可序列化的 dict |
| `execute_blender_code_for_cli` | `blend_file: str, code: str` | 用 `blender --background` 打开文件并执行。修改默认丢弃，除非代码自己保存；使用 `BLENDER_PATH` 或 PATH 上的 `blender` |

`execute_blender_code` 的返回通常包含 `status`（`ok`/`error`）、`result`，以及捕获的 `stdout`/`stderr`。代码异常会以错误返回 traceback，不要把异常吞掉。

`_for_cli` 的临时文件行为：如果同一个 `.blend` 正在实时 Blender 中打开且有未保存修改，server 会先保存一个带 `_mcp_NNNN` 后缀的临时副本给后台进程使用，结束后删除该副本。它不会替你保存原始文件。

## Blend 文件摘要

以下 5 个工具有实时版本和 `_for_cli(blend_file)` 版本：

| 工具 | 返回 |
| --- | --- |
| `get_blendfile_summary_datablocks` | 数据块数量、活动工作区、渲染引擎 |
| `get_blendfile_summary_missing_files` | 缺失的外部文件引用（图片、库、字体、声音、影片、缓存、序列） |
| `get_blendfile_summary_of_linked_libraries` | 直接和间接链接库的树 |
| `get_blendfile_summary_path_info` | 文件路径、是否已保存、年龄、备份 |
| `get_blendfile_summary_usage_guess` | 主要用途的 0–100 打分猜测；是猜测，不是事实 |

CLI 版本示例：`get_blendfile_summary_path_info_for_cli(blend_file="/abs/scene.blend")`。

## 场景与对象

| 工具 | 参数 | 说明 |
| --- | --- | --- |
| `get_objects_summary` | 无 | 集合层级及对象（名称、类型、父级、数据名、选择、可见性） |
| `get_object_detail_summary` | `name: str` | 类型、变换、父/子、修改器、约束、材质、可见性、数据块、集合 |

对象名区分大小写；重名会自动加 `.001`，以工具返回的名字为准。

## 文档

| 工具 | 参数 | 说明 |
| --- | --- | --- |
| `get_python_api_docs` | `identifier: str` | 精确标识符（`bpy.types.Object`），或 `*` / `X.*` 发现子模块 |
| `search_api_docs` | `query: str, max_results=20, context=0, index=None` | 在打包的 Python API 文档中全文搜索 |
| `search_manual_docs` | 同上 | 在打包的用户手册中全文搜索 |

`search_*` 结果被截断时，用返回的 `index` 继续分页；`context` 增加命中附近的上下文行数。

## 截图与界面

| 工具 | 参数 | 说明 |
| --- | --- | --- |
| `get_screenshot_of_window_as_json` | 无 | 窗口布局、区域、活动对象、选择；先用它定位区域 |
| `get_screenshot_of_window_as_image` | `size_limit_in_bytes=0` | 整个 Blender 窗口的 PNG；0 表示使用 MCP 消息上限 |
| `get_screenshot_of_area_as_image` | `area_ui_type, size_limit_in_bytes=0` | 单个区域的 PNG |
| `jump_to_tab_by_name` | `name: str` | 切换工作区标签 |
| `jump_to_tab_by_space_type` | `space_type: str, allow_edits=False` | 切换到匹配区域类型的工作区；`allow_edits=True` 可新建 |
| `jump_to_view3d_object_by_name` | `name: str, allow_edits=False` | 把 3D 视图聚焦到对象；`allow_edits=True` 可取消隐藏 |
| `jump_to_view3d_object_data_by_name` | `name: str, allow_edits=False` | 同上，按数据块名查找 |

`area_ui_type` 常用值：`VIEW_3D`、`IMAGE_EDITOR`、`UV`、`ShaderNodeTree`、`CompositorNodeTree`、`GeometryNodeTree`、`OUTLINER`、`PROPERTIES`、`DOPESHEET_EDITOR`、`GRAPH_EDITOR`、`NLA_EDITOR`、`TEXT_EDITOR`、`CONSOLE`、`INFO`、`FILE_BROWSER`、`SPREADSHEET`、`PREFERENCES`。

`jump_to_*` 会移动用户的界面或视角，属于可见副作用；执行前说明，尤其 `allow_edits=True`。

## 渲染

| 工具 | 参数 | 说明 |
| --- | --- | --- |
| `render_thumbnail_to_path` | `output_path: str` | 临时覆盖设置，渲染低质量缩略图 |
| `render_viewport_to_path` | `output_path: str` | 使用当前场景设置渲染 |

两者都会写文件；用绝对路径，覆盖前先确认。渲染完成检查文件存在且大小非零。

## 连接错误

工具返回 `Cannot connect to Blender at <host>:<port>`（默认 `localhost:9876`）一类错误时，说明 add-on 桥接没起来，不是代码问题。按 `../setup/SKILL.md` 检查：Blender 是否运行、add-on 是否启用、Start MCP Server 是否点击、Allow Online Access 是否开启、端口是否与插件设置一致。
