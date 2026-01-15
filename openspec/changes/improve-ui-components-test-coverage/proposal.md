# 提案：提高 ui/components 测试覆盖率

**提案 ID**: `improve-ui-components-test-coverage`
**创建日期**: 2026-01-16
**状态**: 草案
**优先级**: 中

## 问题陈述

当前 `frontend/src/ui/components/` 模块的测试覆盖率仅为 **52.08%**，低于 75% 的目标覆盖率。

### 当前覆盖率分析

| 组件 | 行数 | 测试状态 | 覆盖率问题 |
|------|------|---------|-----------|
| `actions.ts` | 458 行 | ❌ 无测试 | 文件操作核心逻辑未测试 |
| `browser.ts` | 199 行 | ❌ 无测试 | 文件列表/网格视图未测试 |
| `header.ts` | 233 行 | ❌ 无测试 | 窗口头部组件未测试 |
| `preview-actions.ts` | 677 行 | ❌ 无测试 | 预览操作未测试 |
| `ssh-dialog.ts` | 274 行 | ❌ 无测试 | SSH 对话框未测试 |
| `toolbar.ts` | 540 行 | ❌ 无测试 | 工具栏组件未测试 |
| `format-selector.ts` | 235 行 | ✅ 有测试 | 95.12% 覆盖率 |
| `preview.ts` | 275 行 | ✅ 有测试 | 54.7% 覆盖率 |
| `settings.ts` | 350 行 | ✅ 有测试 | 28.12% 覆盖率 |

### 未覆盖的关键功能

1. **文件导航** - `actions.ts`: `loadDirectory`, `navigateUp`, `navigateBack`, `navigateForward`
2. **文件选择** - `actions.ts`: `selectFile`, `selectGridItem`, `openFile`
3. **文件排序** - `actions.ts`: `toggleSort`, `updateHeaderSortIndicators`
4. **列表/网格视图** - `browser.ts`: `createFileListItem`, `createFileGridItem`
5. **SSH 连接** - `ssh-dialog.ts`: `createSshDialog`, SSH 连接流程
6. **工具栏操作** - `toolbar.ts`: 远程选择器、视图切换、导航按钮

## 目标

### 主要目标

1. 将 `ui/components/` 模块的测试覆盖率从 **52.08%** 提高到 **75%**

2. 为以下组件创建单元测试：
   - `actions.test.ts` - 文件操作和导航
   - `browser.test.ts` - 文件列表和网格视图
   - `header.test.ts` - 窗口头部组件
   - `ssh-dialog.test.ts` - SSH 连接对话框
   - `toolbar.test.ts` - 工具栏组件

3. 为以下组件创建补充测试：
   - `preview.test.ts` - 补充预览功能测试（目标 75%）
   - `settings.test.ts` - 补充设置面板测试（目标 60%）

### 成功标准

- [ ] 所有新测试通过（100% 成功率）
- [ ] `ui/components/` 模块覆盖率达到 75%
- [ ] 测试文件结构清晰，符合项目规范
- [ ] 边界情况和错误处理有对应测试

## 实施范围

### 包含

- ✅ 单元测试（使用 Vitest + Happy DOM）
- ✅ 组件渲染测试
- ✅ 用户交互测试（点击、输入等）
- ✅ 状态管理测试
- ✅ Mock API 响应
- ✅ 边界情况测试
- ✅ 错误处理测试

### 不包含

- ❌ E2E 测试（由 Playwright 负责）
- ❌ 集成测试（需要完整 ComfyUI 环境）
- ❌ 性能测试
- ❌ 视觉回归测试

## 技术方案

### 测试框架

- **Vitest** - 单元测试框架
- **Happy DOM** - 轻量级 DOM 环境
- **vi.mock** - API 和模块 Mock

### 测试结构

```
frontend/src/ui/components/
├── actions.ts              → actions.test.ts (新建)
├── browser.ts              → browser.test.ts (新建)
├── header.ts               → header.test.ts (新建)
├── preview-actions.ts      → preview-actions.test.ts (新建)
├── ssh-dialog.ts           → ssh-dialog.test.ts (新建)
├── toolbar.ts              → toolbar.test.ts (新建)
├── format-selector.ts      → format-selector.test.ts (已存在)
├── preview.ts              → preview.test.ts (补充)
└── settings.ts             → settings.test.ts (补充)
```

### 测试类别

| 测试类型 | 说明 | 示例 |
|---------|------|------|
| 渲染测试 | 验证组件正确渲染 DOM | `should render file list item` |
| 交互测试 | 验证用户交互触发正确行为 | `should select file on click` |
| 状态测试 | 验证状态管理正确更新 | `should update FileManagerState on navigation` |
| Mock 测试 | Mock API 响应测试异步逻辑 | `should load directory from API` |
| 边界测试 | 验证边界条件处理 | `should handle empty file list` |
| 错误测试 | 验证错误处理逻辑 | `should show error on API failure` |

## 风险与限制

### 风险

1. **DOM 依赖** - 部分组件依赖 `document.getElementById`，需要在测试中设置 mock DOM
2. **异步操作** - 文件加载、SSH 连接等异步操作需要正确 mock
3. **全局状态** - `FileManagerState` 需要在测试间正确重置

### 缓解措施

1. 使用 `beforeEach` 清理和重置状态
2. 使用 `vi.mock()` 模拟 API 调用
3. 创建测试 fixtures 提供一致的测试数据

## 验收标准

1. 运行 `npm test` 所有测试通过
2. 运行 `npm run test:coverage` 显示 `ui/components/` 覆盖率 ≥ 75%
3. 测试文件位于 `frontend/src/ui/components/*.test.ts`
4. 每个测试文件包含清晰的 `describe` 分组
5. 测试用例命名清晰（`should ...` 格式）

## 后续工作

本提案完成后，可以考虑：

1. 补充 `api/` 模块测试（当前 44.44%）
2. 补充 `ui/floating/` 模块测试（当前 32.83%）
3. 添加组件快照测试（可选）

## 参考资料

- [Vitest 文档](https://vitest.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
- [Happy DOM 文档](https://github.com/capricorn86/happy-dom)
