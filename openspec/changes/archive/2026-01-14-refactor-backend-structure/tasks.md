# Tasks: Refactor Backend Directory Structure

## Phase 1: 准备工作

- [x] 1.1 创建 `backend/` 目录基础结构

## Phase 2: 创建 backend 目录结构

- [x] 2.1 创建 `backend/__init__.py`
- [x] 2.2 创建 `backend/api/` 目录
- [x] 2.3 创建 `backend/core/` 目录
- [x] 2.4 创建 `backend/helpers/` 目录（原 utils）
- [x] 2.5 创建 `backend/tests/` 目录
- [x] 2.6 创建 `config/` 目录（用于配置存储）

## Phase 3: 移动核心模块

- [x] 3.1 移动 `api/` → `backend/api/`
- [x] 3.2 移动 `core/` → `backend/core/`
- [x] 3.3 移动 `utils/` → `backend/helpers/`

## Phase 4: 移动测试代码

- [x] 4.1 移动 `tests/` → `backend/tests/`

## Phase 5: 更新导入路径

- [x] 5.1 更新根目录 `__init__.py`
  - [x] 更新 `from .core` → `from .backend.core`
  - [x] 更新 `from .api` → `from .backend.api`
- [x] 5.2 更新 `backend/core/` 中的导入
  - [x] 更新 `nodes_v1.py` 中的导入
  - [x] 更新 `nodes_v3.py` 中的导入
- [x] 5.3 更新 `backend/api/routes/` 中的导入
  - [x] 更新 `files.py` 中的导入
  - [x] 更新 `operations.py` 中的导入
  - [x] 更新 `ssh.py` 中的导入
- [x] 5.4 更新 `backend/tests/` 中的导入
  - [x] 更新所有测试文件的导入路径
  - [x] 更新 `conftest.py` 中的路径

## Phase 6: 更新配置文件

- [x] 6.1 更新 `pytest.ini` 中的 testpaths

## Phase 7: 验证和测试

- [x] 7.1 验证模块导入正常
- [x] 7.2 提交变更到 Git

## Phase 8: 提交和部署

- [x] 8.1 提交变更到 Git (commit: d0a7ed1)
- [x] 8.2 提交导入路径修复 (commit: 9b6f5d2)
