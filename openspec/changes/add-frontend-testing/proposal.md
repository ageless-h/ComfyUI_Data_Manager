# Change: Add Frontend Testing Infrastructure

## Why

当前 ComfyUI Data Manager 的前端代码完全没有测试覆盖，缺乏以下关键保障：
- 无自动化测试确保 UI 组件和工具函数的正确性
- 无 CI/CD 流程防止回归错误
- 重构和修改代码时缺乏安全网
- 无法验证跨浏览器兼容性

## What Changes

- **新增 Vitest 测试框架**：为 TypeScript 前端代码添加测试基础设施
- **测试配置**：vitest.config.ts、happy-dom 环境、覆盖率报告
- **单元测试**：覆盖工具函数、API 端点、状态管理等核心模块
- **组件测试**：测试 UI 组件的渲染和交互
- **CI/CD 集成**：GitHub Actions 自动运行测试

## Impact

- **Affected specs**: `specs/frontend-testing/spec.md` (新建)
- **Affected code**:
  - `frontend/src/utils/` - 工具函数测试
  - `frontend/src/api/` - API 端点测试
  - `frontend/src/core/` - 状态管理测试
  - `frontend/src/ui/` - UI 组件测试
- **Breaking changes**: 无
- **Dependencies**: 新增 vitest、happy-dom、@vitest/ui 等开发依赖
