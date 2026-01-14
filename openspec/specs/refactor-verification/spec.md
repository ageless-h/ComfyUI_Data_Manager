# refactor-verification Specification

## Purpose
TBD - created by archiving change verify-backend-refactor. Update Purpose after archive.
## Requirements
### Requirement: All Old Import Paths MUST Be Updated

所有旧的导入路径 MUST 更新为新路径。

#### Scenario: Direct imports from core

- **GIVEN** 任何 Python 文件
- **WHEN** 搜索导入语句
- **THEN** 不应包含 `from core import`
- **AND** 必须使用 `from backend.core import`

#### Scenario: Direct imports from utils

- **GIVEN** 任何 Python 文件
- **WHEN** 搜索导入语句
- **THEN** 不应包含 `from utils import`
- **AND** 必须使用 `from backend.helpers import`

#### Scenario: Direct imports from api

- **GIVEN** 任何 Python 文件
- **WHEN** 搜索导入语句
- **THEN** 不应包含 `from api import`
- **AND** 必须使用 `from backend.api import`

#### Scenario: Relative imports with ..utils

- **GIVEN** backend 中的 Python 文件
- **WHEN** 使用相对导入
- **THEN** 不应包含 `from ..utils import`
- **AND** 必须使用 `from ..helpers import`

#### Scenario: Relative imports with ...utils

- **GIVEN** backend 子目录中的 Python 文件
- **WHEN** 使用三级相对导入
- **THEN** 不应包含 `from ...utils import`
- **AND** 必须使用 `from ...helpers import`

### Requirement: Test File Paths MUST Reflect New Structure

测试文件中的路径引用 MUST 反映新的目录结构。

#### Scenario: Test module loading

- **GIVEN** 测试文件动态加载模块
- **WHEN** 计算模块路径
- **THEN** 路径必须指向 `backend/helpers/` 而非 `utils/`
- **AND** 路径必须指向 `backend/core/` 而非 `core/`
- **AND** 路径必须指向 `backend/api/` 而非 `api/`

#### Scenario: conftest.py path calculations

- **GIVEN** `backend/tests/conftest.py`
- **WHEN** 计算 project_root
- **THEN** 必须使用 `Path(__file__).parent.parent.parent`
- **AND** 路径拼接必须使用 `backend/helpers/`

### Requirement: All Tests MUST Pass

所有测试 MUST 通过以验证重构正确性。

#### Scenario: SSH tests

- **GIVEN** ComfyUI 环境
- **WHEN** 运行 `test_ssh_fs.py`
- **THEN** 所有 31 个测试必须通过

#### Scenario: SSH route tests

- **GIVEN** ComfyUI 环境
- **WHEN** 运行 `test_ssh_routes.py`
- **THEN** 所有测试必须通过

