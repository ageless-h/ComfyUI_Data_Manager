# 后端测试文档

## 测试目录结构

```
backend/tests/
├── unit/                    # 单元测试
│   ├── core/               # 核心节点测试
│   │   └── test_core.py    # nodes_v3.py 节点测试
│   ├── helpers/            # 辅助模块测试
│   │   ├── test_utils.py   # 工具函数测试
│   │   ├── test_batch_processing.py  # 批量处理测试
│   │   └── test_batch_processing_standalone.py
│   └── api/                # API 路由测试
│       ├── test_api_routes.py    # 文件 API 测试
│       ├── test_ssh_routes.py    # SSH API 测试
│       ├── test_preview_api.py   # 预览 API 测试
│       └── test_ssh_fs.py        # SSH 文件系统测试
├── integration/             # 集成测试
│   ├── test_comprehensive.py     # 综合功能测试
│   ├── test_batch_workflow_api.py # 批量工作流测试
│   ├── test_audio_video.py       # 音视频处理测试
│   ├── test_video_formats.py     # 视频格式测试
│   ├── test_video_save_backend.py # 视频保存测试
│   ├── test_all_formats.py       # 全格式测试
│   ├── test_image_formats.py     # 图像格式测试
│   ├── test_file_save.py         # 文件保存测试
│   ├── test_backend_direct.py    # 后端直接测试
│   └── test_backend_simple.py    # 后端简单测试
├── e2e/                    # 端到端测试（Playwright UI 测试）
│   ├── test_data_manager.py      # 主 UI 测试
│   ├── test_import.py            # 导入测试
│   ├── test_ui_button.py         # UI 按钮测试
│   ├── test_widgets.py           # Widget 组件测试
│   ├── test_ports_hidden.py      # 隐藏端口测试
│   ├── test_dom_widgets.py       # DOM Widget 测试
│   ├── test_debug.py             # 调试测试
│   └── test_format_selector.py   # 格式选择器测试
├── tools/                  # 测试工具和脚本
│   ├── generate_batch_test_images.py # 生成测试图像
│   ├── verify_batch_output.py        # 验证批量输出
│   ├── create_test_image.py          # 创建测试图像
│   └── run_tests.py                  # 运行测试脚本
├── fixtures/               # 测试数据
│   └── batch_test_workflow.json     # ComfyUI 工作流 JSON
├── conftest.py             # pytest 配置和 fixtures
├── pytest.ini              # pytest 设置
├── .coveragerc             # coverage 配置
└── README.md               # 本文档
```

## 运行测试

### 运行所有单元测试和集成测试

```bash
cd backend/tests
pytest
```

### 运行特定类型的测试

```bash
# 只运行单元测试
pytest unit/

# 只运行集成测试
pytest integration/

# 只运行 API 测试
pytest unit/api/ -m api

# 只运行 SSH 测试
pytest -m ssh
```

### 运行特定测试文件

```bash
# 运行核心节点测试
pytest unit/core/test_core.py

# 运行批量处理测试
pytest unit/helpers/test_batch_processing.py

# 运行 API 路由测试
pytest unit/api/test_api_routes.py
```

### 运行测试并生成覆盖率报告

```bash
# 生成终端报告
pytest --cov=backend --cov-report=term-missing

# 生成 HTML 报告
pytest --cov=backend --cov-report=html

# 生成 XML 报告（用于 CI）
pytest --cov=backend --cov-report=xml
```

报告将保存在 `htmlcov/` 目录中，打开 `htmlcov/index.html` 查看详细覆盖率。

### 运行 E2E 测试

E2E 测试使用 Playwright，需要先安装 Playwright 浏览器：

```bash
cd backend/tests
pytest e2e/
```

### 使用测试工具

```bash
# 生成测试图像
python tools/generate_batch_test_images.py

# 验证批量输出
python tools/verify_batch_output.py
```

## 测试覆盖率目标

| 模块 | 目标覆盖率 |
|------|-----------|
| `core/nodes_v3.py` | ≥ 80% |
| `helpers/*.py` | ≥ 75-85% |
| `api/routes/*.py` | ≥ 80% |
| **总体** | ≥ 80% |

## 测试标记

使用 pytest 标记来选择性运行测试：

- `unit`: 单元测试（不依赖外部服务）
- `integration`: 集成测试（依赖本地服务）
- `e2e`: 端到端测试（完整工作流）
- `slow`: 慢速测试（运行时间 > 1秒）
- `ssh`: SSH 相关测试（需要网络）
- `api`: API 路由测试

示例：

```bash
# 只运行快速测试
pytest -m "not slow"

# 只运行非 SSH 测试
pytest -m "not ssh"
```

## 测试截图

E2E 测试截图位于 `test_screenshots/` 目录：

- `01_initial_load.png`: 节点初始加载
- `02_search_results.png`: 搜索结果展示
- `03_final_state.png`: 最终状态
- `04_node_menu.png`: 节点菜单
- `07_file_manager_open.png`: 文件管理器打开
- `widgets_check.png`: Widget 检查
- `final_check.png`: 最终检查

## 故障排查

### 测试导入错误

如果遇到导入错误，确保：

1. 在项目根目录运行测试
2. Python 路径包含 ComfyUI 目录
3. 已安装所有依赖（torch, comfy_api 等）

### Coverage 报告错误

如果 coverage 报告不准确：

1. 删除 `.coverage` 文件
2. 删除 `htmlcov/` 目录
3. 重新运行 `pytest --cov=backend`

### SSH 测试失败

SSH 测试需要环境变量：

```bash
export SSH_TEST_HOST=127.0.0.1
export SSH_TEST_PORT=22
export SSH_TEST_USER=test_user
export SSH_TEST_PASSWORD=your_password
```
