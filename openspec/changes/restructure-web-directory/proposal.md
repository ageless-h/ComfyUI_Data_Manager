# Web 目录重构提案

## 概述

将 `ComfyUI_Data_Manager` 的 `web/` 目录从当前的 **26 个平铺文件** 重构为多层级目录结构，参考 `Comfyui_Ts` 项目的实现方案。

## 动机

当前 `web/` 目录存在以下问题：

1. **文件膨胀**: 26 个 JS 文件挤在一个目录，难以管理
2. **命名混乱**: 使用前缀命名法（`ui-preview-actions.js`），文件名冗长
3. **定位困难**: 查找相关功能需要扫描整个目录
4. **无模块边界**: 所有文件平铺，没有逻辑分组
5. **扩展困难**: 新功能不知道应该放在哪里

## 目标

1. **模块化**: 按功能分组组织代码（api/, core/, ui/, utils/）
2. **可维护**: 清晰的目录结构，便于定位和维护
3. **可扩展**: 新功能有明确的放置位置
4. **类型安全**: 引入 TypeScript，减少运行时错误
5. **开发效率**: 使用 Vite HMR 热更新

## 当前文件清单

| 文件 | 功能分类 | 行数 |
|------|----------|------|
| `extension.js` | 入口 | ~760 |
| `api-index.js` | API | ~117 |
| `api-ssh.js` | API | ~350 |
| `core-constants.js` | Core | ~50 |
| `core-state.js` | Core | ~130 |
| `ui-browser.js` | UI | ~600 |
| `ui-preview.js` | UI | ~400 |
| `ui-preview-actions.js` | UI | ~150 |
| `ui-actions.js` | UI | ~200 |
| `ui-settings.js` | UI | ~400 |
| `ui-ssh-dialog.js` | UI | ~250 |
| `ui-toolbar.js` | UI | ~200 |
| `ui-header.js` | UI | ~80 |
| `ui-format-selector.js` | UI | ~80 |
| `ui-window.js` | UI | ~100 |
| `floating-window.js` | UI | ~800 |
| `floating-dock.js` | UI | ~100 |
| `preview-content.js` | UI | ~600 |
| `utils-helpers.js` | Utils | ~60 |
| `utils-csv.js` | Utils | ~150 |
| `utils-drag.js` | Utils | ~50 |
| `utils-file-type.js` | Utils | ~80 |
| `utils-format.js` | Utils | ~50 |
| `utils-script.js` | Utils | ~30 |
| `utils-syntax-highlight.js` | Utils | ~200 |
| `utils-table.js` | Utils | ~150 |
| `utils-theme.js` | Utils | ~960 |

## 技术方案

### 方案 A：TypeScript + Vite（推荐）

```
ComfyUI_Data_Manager/
├── src/                          # 源码目录（多层级）
│   ├── api/
│   │   ├── index.ts
│   │   ├── ssh.ts
│   │   └── endpoints/
│   ├── core/
│   │   ├── constants.ts
│   │   ├── state.ts
│   │   └── types.ts
│   ├── ui/
│   │   ├── browser/
│   │   ├── preview/
│   │   ├── dialogs/
│   │   ├── components/
│   │   └── floating/
│   ├── utils/
│   │   └── ...
│   └── extension.ts
├── web/                          # 编译输出
│   ├── extension.js
│   └── ...
├── package.json
├── tsconfig.json
└── vite.config.ts
```

**优点**：
- 类型安全，编译时发现错误
- HMR 热更新，开发效率高
- 代码分割，按需加载
- IDE 智能提示和重构支持

**缺点**：
- 需要构建步骤
- 学习 TypeScript 语法

### 方案 B：原生 JS + ES Modules（备选）

```
web/                          # 源码 = 输出
├── api/
│   └── ...
├── core/
│   └── ...
├── ui/
│   └── ...
├── utils/
│   └── ...
└── extension.js
```

**优点**：
- 无需构建，直接运行
- 保持纯 JavaScript

**缺点**：
- 无类型检查
- 无代码分割
- 无热更新

## 迁移策略

采用渐进式迁移，共 8 个阶段：

1. **阶段一**: 基础设施建设（package.json, tsconfig.json, vite.config.ts）
2. **阶段二**: 创建入口文件（src/extension.ts）
3. **阶段三**: 迁移核心模块（constants, state, types）
4. **阶段四**: 迁移 API 模块（file API, ssh API）
5. **阶段五**: 迁移 UI 模块（browser, preview, dialogs, components, floating）
6. **阶段六**: 迁移工具函数（所有 utils-*.js）
7. **阶段七**: 集成测试（功能验证）
8. **阶段八**: 清理优化（删除旧文件，更新文档）

## 验证标准

- [ ] 所有现有功能正常工作
- [ ] ComfyUI 能正常加载扩展
- [ ] 开发环境支持热更新
- [ ] 生产构建输出正确
- [ ] 文件结构符合预期

## 决策确认

**请确认技术方案**：

- [ ] **方案 A: TypeScript + Vite** - 推荐，适合长期维护
- [ ] **方案 B: 原生 JS + ES Modules** - 备选，无需构建

## 资源

- 参考项目：`Comfyui_Ts`
- Vite 文档：https://vitejs.dev/
- TypeScript 文档：https://www.typescriptlang.org/
