# Web 目录重构设计方案

## 1. 当前问题分析

### 1.1 现状

当前 `web/` 目录下平铺了 26 个 JavaScript 文件：

```
web/
├── extension.js            (扩展入口)
├── api-index.js            (API 调用)
├── api-ssh.js              (SSH API)
├── core-constants.js       (常量定义)
├── core-state.js           (状态管理)
├── ui-browser.js           (文件浏览器)
├── ui-preview.js           (预览面板)
├── ui-preview-actions.js   (预览操作)
├── ui-actions.js           (文件操作)
├── ui-settings.js          (设置面板)
├── ui-ssh-dialog.js        (SSH 对话框)
├── ui-toolbar.js           (工具栏)
├── ui-header.js            (工具栏头部)
├── ui-format-selector.js   (格式选择器)
├── ui-window.js            (窗口管理)
├── floating-window.js      (浮动窗口)
├── floating-dock.js        (Dock 栏)
├── preview-content.js      (预览内容)
├── utils-helpers.js        (辅助函数)
├── utils-csv.js            (CSV 工具)
├── utils-drag.js           (拖拽工具)
├── utils-file-type.js      (文件类型)
├── utils-format.js         (格式化)
├── utils-script.js         (脚本工具)
├── utils-syntax-highlight.js (语法高亮)
├── utils-table.js          (表格工具)
└── utils-theme.js          (主题系统)
```

### 1.2 问题

1. **文件膨胀**: 26 个文件挤在一个目录，难以管理
2. **命名混乱**: 前缀命名法导致长文件名（`ui-preview-actions.js`）
3. **定位困难**: 查找相关功能需要扫描整个目录
4. **无模块边界**: 所有文件平铺，没有逻辑分组
5. **扩展困难**: 新功能不知道应该放在哪里

---

## 2. 技术方案对比

### 方案 A：TypeScript + Vite 构建系统

#### 优点

| 特性 | 说明 |
|------|------|
| **类型安全** | 编译时发现类型错误，减少运行时 bug |
| **现代语法** | 支持 async/await、装饰器等 ES6+ 特性 |
| **代码分割** | Vite 自动按需加载，提升首屏性能 |
| **开发体验** | HMR 热更新，修改即时生效 |
| **生态工具** | 可使用 TypeScript IDE 智能提示和重构 |
| **依赖管理** | 清晰的模块依赖关系 |

#### 缺点

| 特性 | 说明 |
|------|------|
| **构建流程** | 需要额外的构建步骤（`npm run build`） |
| **学习成本** | 需要了解 TypeScript 语法 |
| **构建时间** | 首次构建需要几秒钟 |
| **配置复杂度** | 需要配置 tsconfig.json 和 vite.config.ts |

#### Comfyui_Ts 参考实现

```
Comfyui_Ts/
├── src/                          # 源码目录（多层级）
│   ├── api/
│   │   ├── endpoints/
│   │   └── v1/
│   ├── core/
│   │   ├── constants.ts
│   │   ├── managers/
│   │   ├── services/
│   │   ├── state.ts
│   │   └── types.ts
│   ├── ui/
│   │   ├── components/
│   │   ├── dialogs/
│   │   ├── panels/
│   │   └── toolbar.ts
│   ├── utils/
│   │   ├── dom.ts
│   │   ├── formatters/
│   │   ├── helpers.ts
│   │   ├── theme.ts
│   │   └── validators/
│   └── extension.ts
├── web/                          # 编译输出（ComfyUI 兼容）
│   ├── api/
│   │   ├── api.js
│   │   └── v1.js
│   ├── core/
│   │   ├── core.js
│   │   └── services.js
│   ├── ui/
│   │   ├── components.js
│   │   ├── panels.js
│   │   └── ui.js
│   ├── utils/
│   │   ├── formatters.js
│   │   ├── utils.js
│   │   └── validators.js
│   └── extension.js
├── package.json
├── tsconfig.json
└── vite.config.ts
```

#### 关键构建配置（vite.config.ts）

```typescript
export default defineConfig({
  build: {
    outDir: 'web',
    rollupOptions: {
      input: resolve(__dirname, 'src/extension.ts'),
      output: {
        format: 'es',
        manualChunks(id) {
          // 按目录分块
          if (id.includes('/src/ui/')) return 'ui/ui';
          if (id.includes('/src/core/')) return 'core/core';
          if (id.includes('/src/api/')) return 'api/api';
          if (id.includes('/src/utils/')) return 'utils/utils';
        },
      },
    },
  },
});
```

### 方案 B：原生 JavaScript + ES Modules

#### 优点

| 特性 | 说明 |
|------|------|
| **零构建** | 直接在浏览器运行，无需构建步骤 |
| **简单直接** | 无需学习 TypeScript |
| **快速启动** | 修改立即生效，无需编译 |
| **透明性** | 代码即为最终运行代码 |

#### 缺点

| 特性 | 说明 |
|------|------|
| **无类型检查** | 运行时才能发现类型错误 |
| **无代码分割** | 所有代码一次性加载 |
| **依赖管理** | 手动管理 import 路径 |
| **无 IDE 支持** | 智能提示和重构受限 |

#### 实现方式

```
web/                          # 源码 = 输出（多层级）
├── api/
│   ├── index.js              # API 入口
│   ├── ssh.js                # SSH API
│   └── v1/
│       └── endpoints.js      # API 端点
├── core/
│   ├── constants.js          # 常量
│   └── state.js              # 状态
├── ui/
│   ├── browser/
│   │   ├── index.js          # 浏览器入口
│   │   ├── list-item.js      # 列表项
│   │   └── grid-item.js      # 网格项
│   ├── preview/
│   │   ├── index.js          # 预览入口
│   │   ├── panel.js          # 预览面板
│   │   └── actions.js        # 预览操作
│   ├── dialogs/
│   │   ├── settings.js       # 设置对话框
│   │   └── ssh-dialog.js     # SSH 对话框
│   ├── toolbar.js            # 工具栏
│   └── window.js             # 窗口管理
├── utils/
│   ├── csv.js                # CSV 工具
│   ├── drag.js               # 拖拽工具
│   ├── file-type.js          # 文件类型
│   ├── format.js             # 格式化
│   ├── helpers.js            # 辅助函数
│   └── theme.js              # 主题
└── extension.js              # 入口文件（扁平）
```

---

## 3. 推荐方案：方案 A（TypeScript + Vite）

### 3.1 选择理由

1. **长期可维护性**: 类型系统和模块化使代码更易维护
2. **参考项目成熟**: Comfyui_Ts 已验证此方案可行
3. **开发效率**: HMW 热更新提升开发效率
4. **代码质量**: 编译时检查减少运行时错误
5. **渐进式迁移**: 可以逐步迁移，无需一次性重写

### 3.2 目标目录结构

```
ComfyUI_Data_Manager/
├── src/                          # 源码目录
│   ├── api/
│   │   ├── index.ts              # API 统一出口
│   │   ├── ssh.ts                # SSH API
│   │   └── endpoints/            # API 端点
│   │       ├── index.ts
│   │       ├── file.ts           # 文件操作
│   │       └── dir.ts            # 目录操作
│   ├── core/
│   │   ├── constants.ts          # 常量定义
│   │   ├── state.ts              # 状态管理
│   │   └── types.ts              # 类型定义
│   ├── ui/
│   │   ├── index.ts              # UI 统一出口
│   │   ├── browser/
│   │   │   ├── index.ts          # 浏览器入口
│   │   │   ├── list-view.ts      # 列表视图
│   │   │   └── grid-view.ts      # 网格视图
│   │   ├── preview/
│   │   │   ├── index.ts          # 预览入口
│   │   │   ├── panel.ts          # 预览面板
│   │   │   ├── actions.ts        # 预览操作
│   │   │   └── content.ts        # 预览内容
│   │   ├── dialogs/
│   │   │   ├── index.ts          # 对话框入口
│   │   │   ├── settings.ts       # 设置面板
│   │   │   └── ssh-dialog.ts     # SSH 连接
│   │   ├── components/           # 可复用组件
│   │   │   ├── format-selector.ts
│   │   │   └── toolbar.ts
│   │   └── floating/             # 浮动窗口
│   │       ├── index.ts
│   │       ├── window.ts
│   │       └── dock.ts
│   ├── utils/
│   │   ├── index.ts              # 工具入口
│   │   ├── csv.ts                # CSV 处理
│   │   ├── drag.ts               # 拖拽
│   │   ├── file-type.ts          # 文件类型
│   │   ├── format.ts             # 格式化
│   │   ├── helpers.ts            # 辅助函数
│   │   ├── syntax-highlight.ts   # 语法高亮
│   │   ├── table.ts              # 表格
│   │   └── theme.ts              # 主题
│   └── extension.ts              # 扩展入口
├── web/                          # 编译输出
│   ├── api/
│   │   ├── index.js
│   │   └── ssh.js
│   ├── core/
│   │   ├── constants.js
│   │   └── state.js
│   ├── ui/
│   │   ├── browser.js
│   │   ├── preview.js
│   │   ├── dialogs.js
│   │   └── components.js
│   ├── utils/
│   │   ├── index.js
│   │   └── theme.js
│   └── extension.js
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 4. 迁移策略

### 4.1 阶段一：基础设施

1. 创建 `package.json`（TypeScript + Vite）
2. 创建 `tsconfig.json`
3. 创建 `vite.config.ts`
4. 创建 `src/` 目录结构
5. 创建 `src/extension.ts`（从 `extension.js` 迁移）

### 4.2 阶段二：核心模块迁移

1. 迁移 `core/constants.js` → `src/core/constants.ts`
2. 迁移 `core/state.js` → `src/core/state.ts`
3. 创建 `src/core/types.ts`

### 4.3 阶段三：API 模块迁移

1. 迁移 `api-index.js` → `src/api/endpoints/file.ts`
2. 迁移 `api-ssh.js` → `src/api/ssh.ts`

### 4.4 阶段四：UI 模块迁移

1. 迁移 `ui-browser.js` → `src/ui/browser/`
2. 迁移 `ui-preview.js` → `src/ui/preview/`
3. 迁移 `ui-actions.js` → `src/ui/browser/actions.ts`
4. 迁移 `ui-settings.js` → `src/ui/dialogs/settings.ts`
5. 迁移 `ui-ssh-dialog.js` → `src/ui/dialogs/ssh-dialog.ts`
6. 迁移 `ui-toolbar.js` → `src/ui/components/toolbar.ts`
7. 迁移 `ui-window.js` → `src/ui/window.ts`
8. 迁移 `ui-format-selector.js` → `src/ui/components/format-selector.ts`

### 4.5 阶段五：浮动窗口迁移

1. 迁移 `floating-window.js` → `src/ui/floating/window.ts`
2. 迁移 `floating-dock.js` → `src/ui/floating/dock.ts`
3. 迁移 `preview-content.js` → `src/ui/preview/content.ts`
4. 迁移 `ui-preview-actions.js` → `src/ui/preview/actions.ts`

### 4.6 阶段六：工具函数迁移

1. 迁移所有 `utils-*.js` → `src/utils/`

### 4.7 阶段七：清理

1. 删除旧的 `web/*.js` 文件
2. 验证功能完整性
3. 更新文档

---

## 5. 风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| 构建失败 | 使用 `vite --mode development` 本地测试 |
| 运行时错误 | 保留原文件备份，逐步迁移验证 |
| 功能回归 | 每个模块迁移后进行功能测试 |
| 构建时间过长 | 配置 Vite 增量构建 |

---

## 6. 验证标准

迁移完成后需满足：

1. 所有现有功能正常工作
2. ComfyUI 能正常加载扩展
3. 开发环境支持热更新
4. 生产构建输出到 `web/` 目录
5. 文件结构符合预期
