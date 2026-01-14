# Web 目录重构提案

## Why

当前 `web/` 目录存在以下问题，影响代码的可维护性和开发效率：

1. **文件膨胀**: 26 个 JS 文件挤在一个目录，难以管理
2. **命名混乱**: 使用前缀命名法（如 `ui-preview-actions.js`），文件名冗长且重复
3. **定位困难**: 查找相关功能需要扫描整个目录
4. **无模块边界**: 所有文件平铺，没有逻辑分组
5. **扩展困难**: 新功能不知道应该放在哪里
6. **缺乏类型检查**: 纯 JavaScript 代码容易在运行时才发现错误
7. **开发效率低**: 无热更新支持，每次修改需要手动刷新浏览器

## What Changes

将 `ComfyUI_Data_Manager` 的前端代码从 **26 个平铺的 JavaScript 文件** 重构为 **TypeScript + Vite 多层级目录结构**。

### 技术方案

采用 **TypeScript + Vite** 方案（方案 A）：

```
ComfyUI_Data_Manager/
├── src/                          # 源码目录（多层级）
│   ├── api/
│   │   ├── endpoints/file.ts
│   │   ├── ssh.ts
│   │   └── index.ts
│   ├── core/
│   │   ├── constants.ts
│   │   ├── state.ts
│   │   ├── types.ts
│   │   └── index.ts
│   ├── ui/
│   │   ├── browser/
│   │   ├── preview/
│   │   ├── dialogs/
│   │   ├── components/
│   │   ├── floating/
│   │   └── index.ts
│   ├── utils/
│   │   ├── helpers.ts
│   │   ├── theme.ts
│   │   └── index.ts
│   └── extension.ts              # 入口文件
├── web/                          # 编译输出目录
│   ├── extension.js
│   ├── ui-preview-actions.js
│   ├── ssh.js
│   └── ...
├── package.json                  # 依赖管理
├── tsconfig.json                 # TS 配置
└── vite.config.ts                # Vite 配置
```

### 迁移策略

采用渐进式迁移，分 8 个阶段完成：

1. **阶段一**: 基础设施建设（package.json, tsconfig.json, vite.config.ts）
2. **阶段二**: 创建入口文件（src/extension.ts）
3. **阶段三**: 迁移核心模块（constants, state, types）
4. **阶段四**: 迁移 API 模块（file API, ssh API）
5. **阶段五**: 迁移 UI 模块（browser, preview, dialogs, components, floating）
6. **阶段六**: 迁移工具函数（所有 utils-*.js）
7. **阶段七**: 集成测试（功能验证）
8. **阶段八**: 清理优化（删除旧文件，更新文档）

### 迁移映射表

| 原文件 | 新位置 |
|--------|--------|
| `extension.js` | `src/extension.ts` |
| `core-constants.js` | `src/core/constants.ts` |
| `core-state.js` | `src/core/state.ts` |
| `api-index.js` | `src/api/endpoints/file.ts` |
| `api-ssh.js` | `src/api/ssh.ts` |
| `ui-browser.js` | `src/ui/browser/index.ts` |
| `ui-preview.js` | `src/ui/preview/index.ts` |
| `ui-preview-actions.js` | `src/ui/components/preview-actions.ts` |
| `ui-actions.js` | `src/ui/components/actions.ts` |
| `ui-settings.js` | `src/ui/components/settings.ts` |
| `ui-ssh-dialog.js` | `src/ui/components/ssh-dialog.ts` |
| `ui-toolbar.js` | `src/ui/components/toolbar.ts` |
| `ui-header.js` | `src/ui/components/header.ts` |
| `ui-format-selector.js` | `src/ui/components/format-selector.ts` |
| `ui-window.js` | `src/ui/main-window.ts` |
| `floating-window.js` | `src/ui/floating/window.ts` |
| `floating-dock.js` | `src/ui/floating/dock.ts` |
| `preview-content.js` | `src/ui/floating/preview-content.ts` |
| `utils-helpers.js` | `src/utils/helpers.ts` |
| `utils-csv.js` | `src/utils/csv.ts` |
| `utils-drag.js` | `src/utils/drag.ts` |
| `utils-file-type.js` | `src/utils/file-type.ts` |
| `utils-format.js` | `src/utils/format.ts` |
| `utils-script.js` | `src/utils/script.ts` |
| `utils-syntax-highlight.js` | `src/utils/syntax-highlight.ts` |
| `utils-table.js` | `src/utils/table.ts` |
| `utils-theme.js` | `src/utils/theme.ts` |

### 预期收益

- **类型安全**: TypeScript 编译时检查，减少运行时错误
- **热更新**: Vite HMR 支持，开发效率提升
- **代码分割**: 按需加载，减小初始加载体积
- **模块化**: 清晰的目录结构，便于维护和扩展
- **IDE 支持**: 智能提示和重构支持
