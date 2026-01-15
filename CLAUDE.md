# ComfyUI Data Manager - 项目指南

> 为 AI 助手提供的项目上下文和开发指南

## 项目概述

ComfyUI Data Manager 是一个强大的文件管理器扩展，为 ComfyUI 提供可视化的文件浏览、管理和路径配置功能。

### 核心功能

| 功能模块 | 说明 |
|---------|------|
| **可视化文件管理** | 图形界面浏览、搜索、预览文件（列表/网格视图） |
| **路径配置节点** | InputPathConfig（输入）、OutputPathConfig（输出）配置路径 |
| **文件操作** | 新建、删除、重命名、复制路径 |
| **文件预览** | 图像、视频、音频、代码、DOCX 等多种格式预览 |
| **SSH 远程访问** | 通过 SSH 协议访问远程服务器文件系统 |
| **凭证管理** | 本地加密存储 SSH 连接凭证 |

### 项目结构

```
ComfyUI_Data_Manager/
├── backend/                  # 后端 Python 代码
│   ├── api/                  # HTTP API 端点
│   │   └── routes/           # files.py, ssh.py, operations.py, metadata.py
│   ├── core/                 # 节点定义
│   │   ├── nodes_v3.py       # V3 API（Node 2.0/Vue.js）
│   │   └── nodes_v1.py       # V1 API（向后兼容）
│   ├── helpers/              # 辅助模块
│   │   ├── file_ops.py       # 文件操作（CRUD）
│   │   ├── path_utils.py     # 路径工具
│   │   ├── info.py           # 文件信息获取
│   │   ├── ssh_fs.py         # SSH 文件系统
│   │   ├── ssh_credentials.py # SSH 凭证存储
│   │   └── formatters.py     # 格式化工具
│   └── tests/                # 后端测试
├── frontend/                 # 前端 TypeScript + Vite
│   ├── src/
│   │   ├── api/              # API 客户端
│   │   ├── core/             # 状态管理（Pinia）
│   │   ├── ui/               # UI 组件（Vue.js）
│   │   └── utils/            # 工具函数
│   └── tests/                # Vitest 测试
├── web/                      # 前端构建产物
│   └── extension.js          # ComfyUI 扩展入口
├── openspec/                 # OpenSpec 规范管理
│   ├── specs/                # 当前能力规范
│   └── changes/              # 变更提案
└── __init__.py               # 扩展入口
```

---

## 技术栈

### 后端
- **Python** >= 3.8
- **ComfyUI API** (V3/Latest)
- **aiohttp** >= 3.8.0（HTTP API）
- **paramiko**（SSH 客户端）
- **Pillow/PIL**（图像处理）

### 前端
- **TypeScript**
- **Vite**（构建工具）
- **Vue.js 3**（组件框架）
- **Pinia**（状态管理）
- **Vitest**（单元测试）

---

## 代码规范

### Python 代码风格

```bash
# 格式化工具配置
black --line-length 100 .
isort --profile black .
flake8 --max-line-length 100 .
```

**规则**：
- 文件编码：必须添加 `# -*- coding: utf-8 -*-` 头部
- 文件 I/O：必须指定 `encoding='utf-8'`
- 行长度：100 字符
- 导入顺序：stdlib → third-party → local

### TypeScript 代码风格

```bash
cd frontend
npm run lint      # ESLint 检查
npm run format    # Prettier 格式化
```

---

## 节点架构

### 核心 API（V3）

使用 `comfy_api.latest` (V3) API，支持 Node 2.0/Vue.js 架构。

```python
from comfy_api.latest import ComfyExtension, io, InputImpl, Types

class DataManagerExtension(ComfyExtension):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    @override
    def register_nodes(self):
        return [
            DataManagerCore,
            InputPathConfig,
            OutputPathConfig,
        ]
```

### 节点定义模式

```python
class InputPathConfig(io.ComfyNode):
    @classmethod
    def define_schema(cls) -> io.Schema:
        return io.Schema(
            node_id="DataManager.InputPathConfig",
            display_name="Data Manager - Input Path",
            description="配置输入文件路径",
            inputs=[
                io.String.Input("target_path", default=""),
                io.Generic.Input("file_input", optional=True),
            ],
            outputs=[
                io.String.Output("config"),
            ],
        )
```

---

## 测试策略

### 后端测试
```bash
cd backend/tests
python test_data_manager.py
```

### 前端测试
```bash
cd frontend
npm test              # 运行所有测试
npm run test:ci       # CI 模式
npm run test:coverage # 覆盖率报告
```

---

## API 端点规范

所有 API 端点以 `/dm/` 前缀开头：

| 端点 | 方法 | 说明 |
|------|------|------|
| `/dm/files/list` | GET | 列出目录文件 |
| `/dm/files/info` | GET | 获取文件信息 |
| `/dm/ssh/credentials/save` | POST | 保存 SSH 凭证 |
| `/dm/ssh/credentials/list` | GET | 列出 SSH 凭证 |
| `/dm/operations/create_file` | POST | 创建新文件 |
| `/dm/operations/delete` | POST | 删除文件/文件夹 |

---

## 重要约束

1. **文件编码**：所有文件操作必须使用 UTF-8 编码
2. **路径处理**：使用 `pathlib.Path` 或 `os.path`，兼容 Windows UNC 路径
3. **错误处理**：所有 API 端点必须返回 JSON 格式的错误信息
4. **兼容性**：保持 V1 API 向后兼容

---

## ComfyUI 特定知识

### INPUT_IS_LIST 机制
- **默认**（`INPUT_IS_LIST = False`）：ComfyUI 自动对列表元素迭代执行
- **启用**（`INPUT_IS_LIST = True`）：节点接收完整列表，一次性处理

### 自动迭代行为
当节点返回列表时，下游节点会自动对每个元素执行一次（无需特殊配置）。

### 内存管理
- 返回路径字符串列表（非加载的数据）可避免内存溢出
- ComfyUI 使用 HierarchicalCache 在子图完成后释放数据

---

## Git 工作流

### 分支策略
- `master` - 主分支，稳定代码
- 特性分支 - `feature/功能名称`

### 提交消息规范
```
feat: 添加新功能
fix: 修复 bug
docs: 更新文档
refactor: 代码重构
test: 添加测试
chore: 构建/工具变更
```

---

## 域上下文

### ComfyUI 节点系统
- 基于有向无环图（DAG）的数据流编程
- 节点通过输入/输出槽位连接
- 支持多种数据类型：IMAGE, LATENT, CONDITIONING, STRING, 等

### 文件类型分类
| 分类 | 支持类型 |
|------|---------|
| 图像 | PNG, JPG, WebP, BMP, TIFF, GIF |
| 视频 | MP4, WebM, AVI, MOV, MKV, FLV |
| 音频 | MP3, WAV, OGG, FLAC, M4A |
| 代码 | PY, JS, TS, JSON, YAML, MD, 等 |
| 文档 | DOCX, PDF, TXT |

---

## 外部依赖

| 依赖 | 版本 | 用途 |
|------|------|------|
| ComfyUI | >= 0.2.0 | 节点宿主 |
| Pillow | Latest | 图像处理 |
| paramiko | Latest | SSH 连接 |
| aiohttp | >= 3.8.0 | HTTP API |
| send2trash | Optional | 回收站删除 |

---

<!-- OPENSPEC:START -->
# OpenSpec Instructions

这些指令是给在这个项目工作的 AI 助手使用的。

当请求涉及以下内容时，始终打开 `@/openspec/AGENTS.md`：
- 提到规划或提案（proposal, spec, change, plan 等词汇）
- 引入新功能、破坏性变更、架构转变或大型性能/安全工作
- 听起来模棱两可，需要权威规范才能编码

使用 `@/openspec/AGENTS.md` 了解：
- 如何创建和应用变更提案
- Spec 格式和约定
- 项目结构和指南

保持此托管块，以便 `openspec update` 可以刷新指令。

<!-- OPENSPEC:END -->
