# test-organization Specification

## Purpose

定义后端测试的组织结构、命名规范和覆盖率要求，确保代码质量和可维护性。

## ADDED Requirements

### Requirement: Test Directory Structure MUST Mirror Source Structure

测试目录结构 MUST 与源代码结构保持一致，便于定位和维护测试。

#### Scenario: Unit tests for core modules

- **GIVEN** 源代码位于 `backend/core/nodes_v3.py`
- **WHEN** 创建对应测试文件
- **THEN** 测试文件必须位于 `tests/unit/core/test_nodes_v3.py`
- **AND** 导入路径使用 `from backend.core import nodes_v3`

#### Scenario: Unit tests for helper modules

- **GIVEN** 源代码位于 `backend/helpers/file_ops.py`
- **WHEN** 创建对应测试文件
- **THEN** 测试文件必须位于 `tests/unit/helpers/test_file_ops.py`
- **AND** 导入路径使用 `from backend.helpers import file_ops`

#### Scenario: Unit tests for API routes

- **GIVEN** 源代码位于 `backend/api/routes/files.py`
- **WHEN** 创建对应测试文件
- **THEN** 测试文件必须位于 `tests/unit/api/test_files_routes.py`
- **AND** 导入路径使用 `from backend.api.routes import files`

### ADDED Requirement: Tests MUST Be Categorized by Type

测试文件 MUST 按类型分类到对应目录：unit/, integration/, e2e/。

#### Scenario: Unit test placement

- **GIVEN** 测试单个函数或类的行为
- **WHEN** 放置测试文件
- **THEN** 必须放置在 `tests/unit/` 目录
- **AND** 不依赖外部服务或 ComfyUI 运行时

#### Scenario: Integration test placement

- **GIVEN** 测试多个模块协作或 API 端点
- **WHEN** 放置测试文件
- **THEN** 必须放置在 `tests/integration/` 目录
- **AND** 可依赖本地服务或模拟环境

#### Scenario: E2E test placement

- **GIVEN** 测试完整的用户工作流
- **WHEN** 放置测试文件
- **THEN** 必须放置在 `tests/e2e/` 目录
- **AND** 使用真实 ComfyUI API

### ADDED Requirement: Test Utilities MUST Be Separated from Tests

测试工具和脚本 MUST 存放在 `tests/tools/` 目录，不与测试文件混合。

#### Scenario: Test data generation scripts

- **GIVEN** 生成测试数据的脚本（如 `generate_test_images.py`）
- **WHEN** 存放脚本
- **THEN** 必须放置在 `tests/tools/` 目录
- **AND** 不以 `test_*.py` 命名

#### Scenario: Verification scripts

- **GIVEN** 验证测试结果的脚本（如 `verify_batch_output.py`）
- **WHEN** 存放脚本
- **THEN** 必须放置在 `tests/tools/` 目录
- **AND** 可以独立运行

### ADDED Requirement: All Modules MUST Achieve 80% Code Coverage

所有核心模块 MUST 达到 80% 以上的代码覆盖率。

#### Scenario: Core nodes coverage

- **GIVEN** `backend/core/nodes_v3.py` 模块
- **WHEN** 运行 `pytest --cov=backend.core.nodes_v3`
- **THEN** 覆盖率必须 ≥ 80%
- **AND** 所有公共函数必须有测试

#### Scenario: Helper modules coverage

- **GIVEN** `backend/helpers/` 下的模块
- **WHEN** 运行 `pytest --cov=backend.helpers`
- **THEN** 平均覆盖率必须 ≥ 80%
- **AND** 每个模块覆盖率 ≥ 75%

#### Scenario: API routes coverage

- **GIVEN** `backend/api/routes/` 下的模块
- **WHEN** 运行 `pytest --cov=backend.api.routes`
- **THEN** 平均覆盖率必须 ≥ 80%
- **AND** 所有端点必须有测试

### ADDED Requirement: Coverage Report MUST Be Generated

每次运行测试 MUST 生成覆盖率报告，便于追踪进度。

#### Scenario: Coverage configuration

- **GIVEN** 项目根目录
- **WHEN** 配置 coverage
- **THEN** 必须创建 `.coveragerc` 文件
- **AND** 配置包含/排除规则
- **AND** 配置报告输出格式

#### Scenario: Coverage report generation

- **GIVEN** 测试套件运行完成
- **WHEN** 执行 `pytest --cov-report=html`
- **THEN** 必须生成 HTML 报告在 `htmlcov/` 目录
- **AND** 报告显示所有模块的覆盖率百分比

### ADDED Requirement: Test Documentation MUST Be Maintained

测试目录 MUST 包含 README.md 文档说明测试结构和运行方法。

#### Scenario: Test README content

- **GIVEN** `backend/tests/README.md` 文件
- **WHEN** 查看文档
- **THEN** 必须说明目录结构
- **AND** 必须说明如何运行不同类型的测试
- **AND** 必须说明如何查看覆盖率报告
- **AND** 必须列出每个测试文件的用途

### ADDED Requirement: Pytest Configuration MUST Be Centralized

Pytest 配置 MUST 集中在 `pytest.ini` 文件中。

#### Scenario: Pytest configuration

- **GIVEN** `backend/tests/pytest.ini` 文件
- **WHEN** 运行 pytest
- **THEN** 配置必须包含测试目录路径
- **AND** 配置必须包含覆盖率插件设置
- **AND** 配置必须包含测试发现模式
