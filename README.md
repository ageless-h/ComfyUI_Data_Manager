# ComfyUI Data Manager

> 强大的文件管理器扩展，为 ComfyUI 提供可视化的文件管理功能

## 特性

- 📁 可视化文件浏览和管理
- 🔀 支持多路径配置（输入/输出路径）
- 🎨 现代化 UI 界面（列表/网格视图）
- 🔄 兼容 V1/V3 API（向后兼容）
- 🔍 文件预览（图像、视频、音频、代码、DOCX）
- 📝 文件操作（新建、删除、重命名、复制路径）
- 🚀 批量文件处理（Match 模式 + Batch 模式）
- 🔐 SSH 远程文件系统访问
- 🔑 本地加密存储 SSH 凭证

## 安装

### 方式 1: 手动安装

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/your-repo/ComfyUI_Data_Manager.git
```

### 方式 2: ComfyUI Manager

在 ComfyUI Manager 中搜索 "ComfyUI Data Manager" 并安装

## 依赖

- Python >= 3.8
- ComfyUI >= 0.2.0
- aiohttp >= 3.8.0（通常已包含）

## 快速开始

1. 启动 ComfyUI
2. 在节点搜索器中搜索 "Data Manager"
3. 添加 "Data Manager - Core" 节点
4. 点击 "打开界面" 按钮
5. 在弹出的文件管理器中管理文件

## 节点说明

### Data Manager - Core
核心文件管理器节点，提供可视化的文件管理界面

**输入**:
- `input` (STRING): 来自 InputPathConfig 的配置

**输出**:
- `output` (STRING): 选中的文件路径（JSON格式）

### Data Manager - Input Path
配置输入路径节点

**参数**:
- `target_path`: 目标目录路径
- `file_type`: 文件类型（string/image/audio/video/3d_model）
- `file_input`: 可选的文件输入端口
- `enable_batch`: 启用批量保存模式（Batch 模式）
- `naming_rule`: 批量命名规则（如 `result_{index:04d}`）

**Batch 模式**:
当输入为批次张量 `[N, H, W, C]` 时，自动迭代保存 N 个文件，使用 `naming_rule` 中的 `{index}` 作为索引。

### Data Manager - Output Path
配置输出路径节点

**参数**:
- `source_path`: 源目录路径
- `file_type`: 文件类型
- `input`: 来自 Core 节点的文件路径
- `enable_match`: 启用匹配模式（Match 模式）
- `pattern`: 通配符模式（如 `*.png`, `image_*.jpg`）

**Match 模式**:
使用通配符匹配多个文件，返回批次张量 `[N, H, W, 3]`，供下游节点批量处理。

## 批量处理工作流示例

### 场景：批量调整图像尺寸

以下工作流将批量加载 100 张图像，缩小到 51×51 像素，并保存到指定目录：

```
OutputPathConfig (Match) → ImageScale → InputPathConfig (Batch) → DataManagerCore
```

**节点配置**:

1. **OutputPathConfig** (Match 模式)
   - `enable_match`: ✅
   - `pattern`: `test_image_*.png`
   - `source_path`: `input/images/`
   - **输出**: 批次张量 `[100, 512, 512, 3]`

2. **ImageScale**
   - `width`: 51
   - `height`: 51
   - `upscale_method`: `lanczos`
   - **输出**: 批次张量 `[100, 51, 51, 3]`

3. **InputPathConfig** (Batch 模式)
   - `enable_batch`: ✅
   - `file_input`: 连接 ImageScale 输出
   - `target_path`: `output/resized/`
   - `naming_rule`: `resized_{index:04d}`
   - **结果**: 保存 `resized_0001.png` ~ `resized_0100.png`

4. **DataManagerCore**
   - 标记工作流结束

## API 文档

详见 [docs/API.md](docs/API.md)

## 测试

### 后端测试

```bash
# 运行所有后端测试
cd backend/tests
python -m pytest .

# 运行批量处理测试
python test_batch_workflow_api.py

# 生成测试图像
python generate_batch_test_images.py

# 验证批量输出
python verify_batch_output.py
```

### 前端测试

前端使用 Vitest（单元测试）和 Playwright（E2E 测试）：

```bash
cd frontend

# 单元测试和组件测试
npm test                 # 运行所有测试
npm run test:ci         # CI 模式运行
npm run test:coverage   # 生成覆盖率报告
npm run test:ui         # 测试 UI 界面
npm run test:watch      # 监视模式

# E2E 测试（需要 ComfyUI 运行）
npm run test:e2e        # 运行所有 E2E 测试
npm run test:e2e:ui     # UI 模式
npm run test:e2e:headed  # 有头模式（查看浏览器）

# 运行所有测试
npm run test:all
```

### 覆盖率目标

| 测试类型 | 框架 | 目标覆盖率 |
|---------|------|-----------|
| 单元测试 | Vitest | 80% |
| 组件测试 | Vitest | 75% |
| E2E 测试 | Playwright | 核心流程覆盖 |

测试详情请参阅：
- [backend/tests/README.md](backend/tests/README.md)
- [frontend/tests/README.md](frontend/tests/README.md)
- [frontend/e2e/README.md](frontend/e2e/README.md)

## 项目结构

```
ComfyUI_Data_Manager/
├── backend/                    # 后端 Python 代码
│   ├── api/                    # HTTP API 端点
│   │   └── routes/             # files.py, ssh.py, operations.py, metadata.py
│   ├── core/                   # 节点定义
│   │   ├── nodes_v3.py         # V3 API（Node 2.0/Vue.js）
│   │   └── nodes_v1.py         # V1 API（向后兼容）
│   ├── helpers/                # 辅助模块
│   │   ├── file_ops.py         # 文件操作（CRUD）
│   │   ├── path_utils.py       # 路径工具
│   │   ├── info.py             # 文件信息获取
│   │   ├── ssh_fs.py           # SSH 文件系统
│   │   ├── ssh_credentials.py  # SSH 凭证存储
│   │   ├── batch_namer.py      # 批量命名规则处理
│   │   └── formatters.py       # 格式化工具
│   └── tests/                  # 后端测试
│       ├── test_batch_workflow_api.py    # 批量处理工作流测试
│       ├── test_batch_processing.py      # 批量处理单元测试
│       ├── generate_batch_test_images.py # 测试图像生成
│       ├── verify_batch_output.py        # 输出验证脚本
│       └── fixtures/                       # 测试数据
│           └── batch_test_workflow.json   # ComfyUI 工作流 JSON
├── frontend/                   # 前端 TypeScript + Vite
│   ├── src/
│   │   ├── api/                # API 客户端
│   │   ├── core/               # 状态管理（Pinia）
│   │   ├── ui/                 # UI 组件（Vue.js）
│   │   └── utils/              # 工具函数
│   └── tests/                  # Vitest 测试
├── web/                        # 前端构建产物
│   └── extension.js            # ComfyUI 扩展入口
├── openspec/                   # OpenSpec 规范管理
│   ├── specs/                  # 当前能力规范
│   └── changes/                # 变更提案
│       └── archive/            # 已归档变更
└── __init__.py                 # 扩展入口
```

## 贡献

欢迎提交 Issue 和 Pull Request！

### 开发环境设置

1. 克隆仓库并安装依赖：
   ```bash
   # Python 依赖
   pip install black isort flake8 pre-commit

   # 前端依赖
   cd frontend
   npm install
   ```

2. 安装 pre-commit hooks：
   ```bash
   pre-commit install
   ```

### 代码风格

本项目使用统一的代码风格工具：

**Python:**
- Black - 代码格式化（行长度 100）
- isort - 导入排序
- flake8 - 代码检查

**TypeScript:**
- ESLint - 代码检查
- Prettier - 代码格式化

格式化代码：
```bash
# Python
black .
isort .

# TypeScript
cd frontend
npm run format
```

检查代码风格：
```bash
# Python
black --check .
flake8 .

# TypeScript
cd frontend
npm run lint
npm run format:check
```

## 许可证

MIT License

## 作者

ageless

## 更新日志

详见 [CHANGELOG.md](CHANGELOG.md)

## 致谢

感谢 ComfyUI 社区的支持
