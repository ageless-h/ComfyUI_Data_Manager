# 提案：重组后端测试结构并提高覆盖率

**状态**: 草案
**创建日期**: 2026-01-16
**优先级**: 中等

## 问题陈述

### 当前问题

1. **测试文件平铺在单一目录**
   - 当前所有测试文件位于 `backend/tests/` 目录下
   - 测试文件与源代码结构不匹配，难以定位对应测试
   - 测试文件数量多（30+ 个文件），缺乏组织结构

2. **测试覆盖不完整**
   - 部分核心功能缺少专门的测试文件
   - API 路由测试分散在多个文件中
   - 辅助函数测试覆盖不全面

3. **测试命名不一致**
   - 部分测试文件使用 `test_*.py` 命名
   - 部分工具脚本（如 `generate_batch_test_images.py`）混在测试目录中
   - 缺少清晰的测试分类

## 目标

### 主要目标

1. **重组测试目录结构**
   - 按照源代码结构组织测试文件
   - 创建清晰的测试分类（单元测试、集成测试、端到端测试）
   - 分离测试工具/脚本与实际测试代码

2. **提高测试覆盖率到 80% 以上**
   - 为所有核心模块添加单元测试
   - 为所有 API 端点添加集成测试
   - 补充缺失的测试场景

3. **标准化测试规范**
   - 统一测试文件命名
   - 添加测试文档说明各测试目的
   - 配置 pytest 和 coverage 工具

## 影响范围

### 涉及目录

- `backend/tests/` - 测试目录重组
- `backend/core/` - nodes_v3.py 测试补充
- `backend/helpers/` - 辅助模块测试补充
- `backend/api/routes/` - API 路由测试补充

### 不涉及

- 前端测试（`frontend/tests/`）
- ComfyUI 节点运行时行为（由测试工作流覆盖）

## 提议方案

### 新测试目录结构

```
backend/tests/
├── unit/                    # 单元测试
│   ├── core/               # 核心节点测试
│   │   ├── test_nodes_v3.py
│   │   ├── test_nodes_v1.py
│   │   └── test_save_load.py
│   ├── helpers/            # 辅助模块测试
│   │   ├── test_batch_namer.py
│   │   ├── test_batch_scanner.py
│   │   ├── test_file_ops.py
│   │   ├── test_path_utils.py
│   │   ├── test_info.py
│   │   ├── test_formatters.py
│   │   └── test_ssh_credentials.py
│   └── api/                # API 单元测试
│       ├── test_files_routes.py
│       ├── test_operations_routes.py
│       ├── test_metadata_routes.py
│       └── test_ssh_routes.py
├── integration/             # 集成测试
│   ├── test_batch_workflow.py
│   ├── test_file_operations.py
│   └── test_ssh_integration.py
├── e2e/                    # 端到端测试
│   └── test_full_workflow.py
├── tools/                  # 测试工具和脚本
│   ├── generate_test_images.py
│   ├── verify_batch_output.py
│   └── run_coverage.py
├── fixtures/               # 测试数据
│   └── batch_test_workflow.json
├── conftest.py             # pytest 配置
├── pytest.ini              # pytest 设置
├── .coveragerc             # coverage 配置
└── README.md               # 测试文档
```

### 测试覆盖率目标

| 模块 | 当前覆盖率 | 目标覆盖率 | 重点测试内容 |
|------|-----------|-----------|-------------|
| `core/nodes_v3.py` | ~40% | 80% | 节点输入输出、类型转换、错误处理 |
| `helpers/batch_namer.py` | ~60% | 85% | 命名规则解析、格式化、验证 |
| `helpers/batch_scanner.py` | ~30% | 80% | 文件扫描、模式匹配 |
| `helpers/file_ops.py` | ~50% | 85% | CRUD 操作、异常处理 |
| `helpers/path_utils.py` | ~40% | 80% | 路径解析、UNC/SSH 支持 |
| `api/routes/*.py` | ~30% | 80% | 所有端点、错误响应 |

## 实施步骤

1. 创建新的测试目录结构
2. 迁移现有测试文件到对应目录
3. 识别并补充缺失的测试
4. 配置 pytest 和 coverage
5. 运行并验证覆盖率达到目标

## 验收标准

- [ ] 新测试目录结构创建完成
- [ ] 现有测试全部迁移到对应目录
- [ ] 所有测试通过（无 regression）
- [ ] Coverage 报告显示总体覆盖率 ≥ 80%
- [ ] 每个核心模块覆盖率 ≥ 目标值
- [ ] 测试文档更新完成

## 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 测试迁移导致导入路径错误 | 高 | 逐个文件验证测试运行 |
| CI/CD 管道配置需要更新 | 中 | 同步更新 CI 配置文件 |
| 覆盖率目标难以达成 | 中 | 分阶段实施，优先核心功能 |
