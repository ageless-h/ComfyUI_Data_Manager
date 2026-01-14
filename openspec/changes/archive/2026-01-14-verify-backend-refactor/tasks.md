# Tasks: Verify Backend Refactor Import Paths

## Phase 1: 全局搜索旧导入路径

- [x] 1.1 搜索所有包含 `from core import` 的文件
- [x] 1.2 搜索所有包含 `from utils import` 的文件
- [x] 1.3 搜索所有包含 `from api import` 的文件
- [x] 1.4 搜索所有包含 `from .utils` 的文件
- [x] 1.5 搜索所有包含 `from ..utils` 的文件
- [x] 1.6 搜索所有包含 `from ...utils` 的文件
- [x] 1.7 搜索所有包含 `from ...api` 的文件
- [x] 1.8 搜索所有包含 `from ...core` 的文件
- [x] 1.9 搜索所有路径字符串中的 `/utils/` 或 `/api/` 或 `/core/`

## Phase 2: 检查测试文件

- [x] 2.1 检查所有 `test_*.py` 文件中的导入
- [x] 2.2 检查 `conftest.py` 中的路径计算
- [x] 2.3 检查 `pytest.ini` 配置
- [x] 2.4 检查其他测试辅助文件

## Phase 3: 检查文档和配置

- [x] 3.1 检查 README.md 中的路径引用
- [x] 3.2 检查其他 .md 文档
- [x] 3.3 检查配置文件

## Phase 4: 运行测试验证

- [x] 4.1 运行 `test_ssh_fs.py` 测试
- [x] 4.2 运行 `test_ssh_routes.py` 测试
- [x] 4.3 运行所有单元测试
- [x] 4.4 验证模块导入

## Phase 5: 修复和提交

- [x] 5.1 修复发现的任何问题
  - [x] 修复 `test_ssh_routes.py` 中的路径引用
- [x] 5.2 提交修复到 Git (commit: ccfbe82)
