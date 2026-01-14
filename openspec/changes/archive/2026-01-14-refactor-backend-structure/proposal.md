# Proposal: Refactor Backend Directory Structure

## Summary

重构后端目录结构，参考 `ComfyUI_Agent_Manager` 的项目结构，将分散的后端代码组织到统一的 `backend/` 目录下，提高代码可维护性和一致性。

## Motivation

### 当前问题
1. 后端代码分散在多个根目录子目录（`api/`, `core/`, `utils/`, `tests/`）
2. 测试文件在根目录，与业务代码混合
3. 与同系列项目 `ComfyUI_Agent_Manager` 结构不一致
4. 缺少专门的配置存储目录

### 预期收益
1. 统一的后端代码组织结构
2. 更清晰的项目布局，前后端分离更明确
3. 与同系列项目保持一致的架构风格
4. 便于未来的扩展和维护

## Proposed Solution

### 新的目录结构
```
ComfyUI_Data_Manager/
├── __init__.py
├── backend/          # 后端统一入口
│   ├── api/          # 从 ./api 移动
│   ├── core/         # 从 ./core 移动
│   ├── helpers/      # 从 ./utils 重命名移动
│   └── tests/        # 从 ./tests 移动
├── config/           # 新建，用于配置文件存储
├── frontend/         # 保持不变
├── web/              # 保持不变
├── openspec/         # 保持不变
└── docs/             # 保持不变
```

### 主要变更

1. **创建 `backend/` 目录**
2. **移动 `api/` 到 `backend/api/`**
3. **移动 `core/` 到 `backend/core/`**
4. **重命名 `utils/` 为 `backend/helpers/`**
5. **移动 `tests/` 到 `backend/tests/`**
6. **创建 `config/` 目录**

## Impact

- 所有 Python 文件的导入语句
- 测试文件的导入路径
- pytest.ini 配置

## Success Criteria

- [x] 所有目录移动完成
- [x] 所有导入路径更新完成
- [x] 模块导入测试通过
- [x] 项目结构与 ComfyUI_Agent_Manager 一致
