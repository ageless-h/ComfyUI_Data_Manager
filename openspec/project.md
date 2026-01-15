# Project Context

## Purpose

ComfyUI Data Manager 是一个功能强大的 ComfyUI 扩展，提供：
1. 可视化文件管理和浏览界面
2. 灵活的路径配置节点系统
3. 多格式文件预览功能
4. SSH 远程文件系统访问
5. 安全的凭证管理

项目目标是通过现代化的 UI 和直观的节点系统，简化 ComfyUI 中的文件管理流程。

## Tech Stack

### 后端
- Python 3.8+
- ComfyUI V3 API (`comfy_api.latest`)
- aiohttp 3.8+ (HTTP API)
- paramiko (SSH 客户端)
- Pillow/PIL (图像处理)

### 前端
- TypeScript
- Vite (构建工具)
- Vue.js 3 (组件框架)
- Pinia (状态管理)
- Vitest (单元测试)

## Project Conventions

### Code Style

**Python:**
- 行长度: 100 字符
- 格式化: Black (`--line-length 100`)
- 导入排序: isort (`--profile black`)
- 检查: flake8 (`--max-line-length 100`)
- 文件编码: 必须添加 `# -*- coding: utf-8 -*-` 头部
- 文件 I/O: 必须指定 `encoding='utf-8'`

**TypeScript:**
- ESLint + Prettier
- `npm run lint` 检查代码
- `npm run format` 格式化代码

### Architecture Patterns

1. **后端分层架构**:
   - `core/` - 节点定义（V3 API）
   - `api/routes/` - HTTP 端点
   - `helpers/` - 辅助模块（文件操作、SSH、凭证管理）

2. **前端模块化**:
   - `api/` - API 客户端封装
   - `core/` - Pinia 状态存储
   - `ui/` - Vue.js 组件
   - `utils/` - 工具函数

3. **节点设计原则**:
   - 单一职责：每个节点专注一个功能
   - 模式化：通过输入参数切换不同模式
   - 向后兼容：保持 V1 API 支持

### Testing Strategy

**后端测试**:
- 使用 pytest 框架
- 测试文件位于 `backend/tests/`
- 运行: `python backend/tests/test_*.py`

**前端测试**:
- 使用 Vitest 框架
- 测试文件位于 `frontend/tests/`
- 运行: `npm test`
- CI: `npm run test:ci`
- 覆盖率: `npm run test:coverage`

### Git Workflow

**分支策略**:
- `master` - 主分支（稳定）
- 特性分支 - `feature/功能名称`

**提交消息规范**:
```
feat: 添加新功能
fix: 修复 bug
docs: 更新文档
refactor: 代码重构
test: 添加测试
chore: 构建/工具变更
```

**示例**:
- `feat: 添加 SSH 远程文件访问`
- `fix: 修复 DOCX 预览编码问题`
- `docs: 更新 API 文档`

## Domain Context

### ComfyUI 节点系统

ComfyUI 是基于有向无环图（DAG）的数据流编程环境：
- 节点通过输入/输出槽位（slots）连接
- 数据从上游节点流向下游节点
- 支持多种数据类型：IMAGE, LATENT, CONDITIONING, STRING, VIDEO, AUDIO

### INPUT_IS_LIST 机制（重要）

ComfyUI 的关键特性：
- **默认**（`INPUT_IS_LIST = False`）：节点接收列表输入时，引擎自动对每个元素迭代执行
- **启用**（`INPUT_IS_LIST = True`）：节点接收完整列表，一次性处理所有元素

**内存影响**:
- 自动迭代模式：每次只处理一个元素，内存安全
- 列表模式：所有元素同时在内存中，可能导致 OOM

### 文件类型分类

| 分类 | 支持类型 |
|------|---------|
| 图像 | PNG, JPG, WebP, BMP, TIFF, GIF |
| 视频 | MP4, WebM, AVI, MOV, MKV, FLV |
| 音频 | MP3, WAV, OGG, FLAC, M4A |
| 代码 | PY, JS, TS, JSON, YAML, MD, CPP, JAVA, 等 |
| 文档 | DOCX, PDF, TXT |
| 3D 模型 | OBJ, GLTF, STL |

### 节点类型

1. **DataManagerCore**: 核心文件管理器，提供可视化 UI
2. **InputPathConfig**: 配置输入文件路径
3. **OutputPathConfig**: 配置输出文件路径

## Important Constraints

1. **编码约束**:
   - 所有 Python 文件必须使用 UTF-8 编码
   - 文件 I/O 必须显式指定 `encoding='utf-8'`

2. **路径约束**:
   - 使用 `pathlib.Path` 或 `os.path` 处理路径
   - 必须兼容 Windows UNC 路径（`\\server\share\folder`）

3. **API 约束**:
   - 所有 API 端点以 `/dm/` 前缀开头
   - 必须返回 JSON 格式的错误信息
   - HTTP 方法语义正确（GET 查询，POST 修改）

4. **兼容性约束**:
   - 保持 V1 API 向后兼容
   - 新功能通过扩展现有节点实现，而非创建新节点

## External Dependencies

| 依赖 | 版本 | 用途 |
|------|------|------|
| ComfyUI | >= 0.2.0 | 节点宿主环境 |
| Pillow | Latest | 图像处理和保存 |
| paramiko | Latest | SSH 连接和 SFTP |
| aiohttp | >= 3.8.0 | 异步 HTTP API |
| send2trash | Optional | 回收站删除（如不可用则永久删除） |
| python-docx | Optional | DOCX 文件预览 |
| openpyxl | Optional | XLSX 文件预览 |

## ComfyUI 特定知识

### 自动迭代行为

当节点返回列表时（不设置 `OUTPUT_IS_LIST = True`）：
- 下游节点自动对每个元素执行一次
- 每次执行只处理一个元素
- 处理完成后数据被缓存系统释放
- **不会内存堆积**

### 内存安全设计

返回路径字符串列表 vs 返回数据列表：
- **路径列表**: 每个路径 ~100 字节，1000 个文件约 100KB
- **数据列表**: 每个图像/视频可能几 MB 到几 GB

**推荐实践**:
- 返回文件路径字符串列表
- 让下游节点按需加载数据
- 利用 ComfyUI 的自动迭代机制

### 节点执行顺序

ComfyUI 使用拓扑排序执行：
- 从后向前递归依赖（传统）
- 或从前向后惰性求值（现代，PR #2666）
- 支持条件分支和循环
