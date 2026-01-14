# ComfyUI Data Manager

> 强大的文件管理器扩展，为 ComfyUI 提供可视化的文件管理功能

## 特性

- 📁 可视化文件浏览和管理
- 🔀 支持多路径配置（输入/输出路径）
- 🎨 现代化 UI 界面（列表/网格视图）
- 🔄 兼容 V1/V3 API（向后兼容）
- 🔍 文件预览（图像、视频、音频、代码）
- 📝 文件操作（新建、删除、重命名、复制路径）

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

### Data Manager - Output Path
配置输出路径节点

**参数**:
- `source_path`: 源目录路径
- `file_type`: 文件类型
- `input`: 来自 Core 节点的文件路径

## API 文档

详见 [docs/API.md](docs/API.md)

## 测试

### 后端测试

```bash
cd tests
python test_data_manager.py
```

### 前端测试

前端代码使用 Vitest 进行测试：

```bash
cd frontend

# 运行所有测试
npm test

# 运行测试（CI模式）
npm run test:ci

# 监视模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage

# 打开测试 UI
npm run test:ui
```

测试详情请参阅 [docs/testing.md](docs/testing.md)

## 项目结构

```
ComfyUI_Data_Manager/
├── core/              # 核心节点定义
│   ├── nodes_v1.py    # V1 API 实现
│   └── nodes_v3.py    # V3 API 实现
├── utils/             # 工具函数
│   ├── file_ops.py    # 文件操作
│   ├── path_utils.py  # 路径工具
│   └── formatters.py  # 格式化工具
├── api/               # HTTP API 端点
│   └── routes/        # API 路由
├── frontend/          # 前端代码（TypeScript + Vite）
│   ├── src/          # 源代码
│   │   ├── api/      # API 客户端
│   │   ├── core/     # 状态管理
│   │   ├── ui/       # UI 组件
│   │   └── utils/    # 工具函数
│   ├── tests/        # 测试文件
│   └── vitest.config.ts  # Vitest 配置
├── web/               # 前端扩展构建产物
│   └── extension.js   # 文件管理器 UI
├── tests/             # 后端测试文件
└── docs/              # 文档
    └── testing.md     # 测试指南
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 作者

Your Name

## 更新日志

详见 [CHANGELOG.md](CHANGELOG.md)

## 致谢

感谢 ComfyUI 社区的支持
