# 提案: 补充现有组件测试

> **提案 ID**: `supplement-existing-tests`
> **创建日期**: 2026-01-16
> **状态**: 进行中

---

## 概述

补充 `preview.test.ts` 和 `settings.test.ts` 的测试用例，将测试覆盖率提升到目标水平。

### 当前覆盖率

| 文件 | 当前覆盖率 | 目标覆盖率 | 差距 |
|------|-----------|-----------|------|
| preview.test.ts | 54.7% | 75% | +20.3% |
| settings.test.ts | 28.12% | 60% | +31.88% |

---

## 背景分析

### preview.ts 缺失覆盖

| 函数/功能 | 未覆盖内容 | 优先级 |
|-----------|-----------|--------|
| `checkNodeConnectionAndUpdateFormat()` | 完全未测试 | 高 |
| `detectTypeFromSourceNode()` | 完全未测试 | 高 |
| `createPreviewPanel()` | 预览占位内容、文件信息区 | 中 |
| `createStatusBar()` | 连接指示器、SSH 状态、setTimeout | 中 |

### settings.ts 缺失覆盖

| 函数/功能 | 未覆盖内容 | 优先级 |
|-----------|-----------|--------|
| `showConnectionForm()` | 完全未测试 | 高 |
| `renderSavedCredentialsList()` | 凭证渲染、删除流程 | 高 |
| `createSettingsInput()` | 完全未测试 | 低 |
| 连接表单交互 | 输入验证、保存凭证、错误处理 | 高 |
| 密码提示流程 | `prompt()` 调用 | 中 |

---

## 提案目标

1. **preview.test.ts**: 新增 ~20 个测试用例
   - 测试节点连接检测功能
   - 测试类型检测逻辑
   - 测试状态栏连接指示器更新

2. **settings.test.ts**: 新增 ~30 个测试用例
   - 测试连接表单创建和交互
   - 测试凭证列表渲染
   - 测试删除凭证流程
   - 测试连接成功/失败场景

---

## 实施计划

### Phase 1: 补充 preview.test.ts

- [ ] 添加 `checkNodeConnectionAndUpdateFormat` 测试套件
- [ ] 添加 `detectTypeFromSourceNode` 测试套件
- [ ] 添加 `createStatusBar` 连接状态测试

### Phase 2: 补充 settings.test.ts

- [ ] 添加 `createSettingsInput` 测试套件
- [ ] 添加 `showConnectionForm` 测试套件
- [ ] 添加 `renderSavedCredentialsList` 测试套件
- [ ] 添加连接流程端到端测试

### Phase 3: 验证和文档

- [ ] 运行测试验证通过率 >98%
- [ ] 生成覆盖率报告确认目标达成
- [ ] 更新测试文档

---

## 验收标准

- [ ] 所有新增测试通过
- [ ] preview.test.ts 覆盖率 >= 75%
- [ ] settings.test.ts 覆盖率 >= 60%
- [ ] 整体测试通过率 >= 98%

---

## 相关文件

- `frontend/src/ui/components/preview.test.ts`
- `frontend/src/ui/components/preview.ts`
- `frontend/src/ui/components/settings.test.ts`
- `frontend/src/ui/components/settings.ts`
- `frontend/tests/fixtures/ui-fixtures.ts`

---

## 参考资料

- [Vitest 测试指南](https://vitest.dev/)
- [Happy DOM 文档](https://github.com/capricorn86/happy-dom)
- 项目测试规范: `frontend/tests/README.md`
