# backend-structure Specification

## Purpose
TBD - created by archiving change refactor-backend-structure. Update Purpose after archive.
## Requirements
### Requirement: Backend Directory Structure MUST Use Unified backend/ Folder

所有后端代码 MUST 组织在 `backend/` 目录下。

#### Scenario: Root directory organization

- **GIVEN** 项目根目录
- **WHEN** 列出目录结构
- **THEN** 必须包含 `backend/` 目录
- **AND** 必须包含 `frontend/` 目录
- **AND** 必须包含 `config/` 目录
- **AND** 后端代码不应分散在根目录

#### Scenario: Backend subdirectories

- **GIVEN** `backend/` 目录
- **WHEN** 列出其内容
- **THEN** 必须包含 `api/` 子目录（API 路由）
- **AND** 必须包含 `core/` 子目录（核心节点）
- **AND** 必须包含 `helpers/` 子目录（辅助工具）
- **AND** 必须包含 `tests/` 子目录（测试代码）

### Requirement: API Routes MUST Be Located in backend/api/

API 路由代码 MUST 位于 `backend/api/` 目录。

#### Scenario: API module imports

- **GIVEN** 任何模块需要导入 API 路由
- **WHEN** 使用导入语句
- **THEN** 必须使用 `from backend.api.routes import ...`
- **AND** 不应使用旧的 `from api.routes import ...`

### Requirement: Core Nodes MUST Be Located in backend/core/

ComfyUI 节点定义代码 MUST 位于 `backend/core/` 目录。

#### Scenario: Root package imports

- **GIVEN** 根目录 `__init__.py`
- **WHEN** 导入核心节点
- **THEN** 必须使用 `from .backend.core.nodes_v3 import ...`
- **AND** 必须使用 `from .backend.core.nodes_v1 import ...`

### Requirement: Helper Utilities MUST Be Located in backend/helpers/

辅助工具代码 MUST 位于 `backend/helpers/` 目录（原 `utils/`）。

#### Scenario: Helpers directory structure

- **GIVEN** `backend/helpers/` 目录
- **WHEN** 列出其内容
- **THEN** 必须包含 `__init__.py`
- **AND** 必须包含 `file_ops.py`（文件操作）
- **AND** 必须包含 `ssh_fs.py`（SSH 文件系统）
- **AND** 必须包含 `path_utils.py`（路径工具）
- **AND** 必须包含 `formatters.py`（格式化工具）
- **AND** 必须包含 `info.py`（信息获取）

#### Scenario: Helper module imports

- **GIVEN** 任何模块需要导入辅助工具
- **WHEN** 使用导入语句
- **THEN** 必须使用 `from backend.helpers import file_ops`
- **AND** 不应使用旧的 `from utils import ...`

### Requirement: Tests MUST Be Located in backend/tests/

测试代码 MUST 位于 `backend/tests/` 目录。

#### Scenario: Test imports

- **GIVEN** 测试文件需要导入被测模块
- **WHEN** 使用导入语句
- **THEN** 所有 `from core` 必须改为 `from backend.core`
- **AND** 所有 `from utils` 必须改为 `from backend.helpers`
- **AND** 所有 `from api` 必须改为 `from backend.api`

### Requirement: All Import Paths MUST Be Updated After Restructure

重构后，所有导入路径 MUST 更新为新路径。

#### Scenario: Root package imports

- **GIVEN** 根目录 `__init__.py`
- **WHEN** 重构后导入模块
- **THEN** `from .core` 必须改为 `from .backend.core`
- **AND** `from .api` 必须改为 `from .backend.api`

