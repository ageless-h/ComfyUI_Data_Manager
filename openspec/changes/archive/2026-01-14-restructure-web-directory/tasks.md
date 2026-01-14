# Web 目录重构任务清单

## 阶段一：基础设施建设

### 1.1 初始化构建系统

- [x] **1.1.1** 创建 `package.json`，添加 TypeScript 和 Vite 依赖
  - 依赖：`typescript`, `vite`, `@types/node`
  - 脚本：`dev`, `build`, `type-check`
- [x] **1.1.2** 创建 `tsconfig.json`
  - 目标：ES2020
  - 模块：ES Modules
  - 严格模式开启
- [x] **1.1.3** 创建 `vite.config.ts`
  - 输出目录：`web/`
  - 代码分割策略：按目录分块
  - Source Map 开启
- [x] **1.1.4** 验证构建命令
  - 运行 `npm install`
  - 运行 `npm run build`
  - 检查 `web/` 目录输出

### 1.2 创建目录结构

- [x] **1.2.1** 创建 `src/` 目录
- [x] **1.2.2** 创建子目录：`api/`, `core/`, `ui/`, `utils/`
- [x] **1.2.3** 创建子目录：`src/ui/browser/`, `src/ui/preview/`, `src/ui/dialogs/`, `src/ui/components/`, `src/ui/floating/`
- [x] **1.2.4** 创建子目录：`src/utils/`

### 1.3 阶段验收标准

- [x] `npm install` 成功，无依赖错误
- [x] `npm run build` 成功，在 `web/` 生成 `extension.js`
- [x] ComfyUI 能正常加载编译后的扩展

---

## 阶段二：创建入口文件

### 2.1 创建扩展入口

- [x] **2.1.1** 创建 `src/extension.ts`
  - 从 `web/extension.js` 迁移内容
  - 保持相同的扩展配置结构
  - 使用 ES Modules import
- [x] **2.1.2** 配置 Vite 构建入口
  - 设置 `rollupOptions.input` 指向 `src/extension.ts`
- [x] **2.1.3** 验证入口加载
  - 运行开发服务器
  - 检查浏览器控制台无报错

### 2.2 阶段验收标准

- [x] 扩展正常注册
- [x] 无导入错误
- [x] ComfyUI 控制台无报错

---

## 阶段三：迁移核心模块

### 3.1 迁移常量

- [x] **3.1.1** 创建 `src/core/constants.ts`
  - 从 `web/core-constants.js` 迁移 `FILE_TYPES`
  - 从 `web/core-constants.js` 迁移 `API_ENDPOINTS`
- [x] **3.1.2** 创建 `src/core/types.ts`
  - 定义 `FileManagerState` 类型
  - 定义 `FileItem` 类型
  - 定义 `ConnectionState` 类型

### 3.2 迁移状态管理

- [x] **3.2.1** 创建 `src/core/state.ts`
  - 从 `web/core-state.js` 迁移 `FileManagerState`
  - 迁移 localStorage 读写函数
  - 迁移 SSH 连接状态管理
- [x] **3.2.2** 验证状态管理功能
  - 检查路径记忆功能
  - 检查视图模式记忆功能
  - 检查 SSH 连接状态

### 3.3 阶段验收标准

- [x] 常量导出正确
- [x] 类型定义完整
- [x] 状态持久化正常工作
- [x] SSH 连接状态正确保存

---

## 阶段四：迁移 API 模块

### 4.1 迁移文件 API

- [x] **4.1.1** 创建 `src/api/endpoints/file.ts`
  - 从 `web/api-index.js` 迁移 `listDirectory`
  - 迁移 `getPreviewUrl`
  - 迁移 `getFileInfo`
  - 迁移 `createFile`
  - 迁移 `createDirectory`
  - 迁移 `deleteFile`

### 4.2 迁移 SSH API

- [x] **4.2.1** 创建 `src/api/ssh.ts`
  - 从 `web/api-ssh.js` 迁移所有函数
  - 保持相同的接口契约

### 4.3 创建 API 统一出口

- [x] **4.3.1** 创建 `src/api/index.ts`
  - 导出所有 API 函数
  - 保持与原 `extension.js` 导入兼容

### 4.4 阶段验收标准

- [x] 文件列表加载正常
- [x] 文件预览 URL 正确
- [x] 文件创建/删除正常工作
- [x] SSH 连接/断开正常工作

---

## 阶段五：迁移 UI 模块

### 5.1 迁移文件浏览器

- [x] **5.1.1** 创建 `src/ui/browser/index.ts`
  - 从 `web/ui-browser.js` 迁移 `createBrowserPanel`
- [x] **5.1.2** 创建 `src/ui/browser/list-view.ts`
  - 迁移列表视图渲染逻辑
- [x] **5.1.3** 创建 `src/ui/browser/grid-view.ts`
  - 迁移网格视图渲染逻辑

### 5.2 迁移文件操作

- [x] **5.2.1** 创建 `src/ui/browser/actions.ts`
  - 从 `web/ui-actions.js` 迁移 `loadDirectory`
  - 迁移 `toggleSort`
  - 迁移 `navigateUp`
  - 迁移 `navigateHome`

### 5.3 迁移预览模块

- [x] **5.3.1** 创建 `src/ui/preview/index.ts`
  - 从 `web/ui-preview.js` 迁移 `createPreviewPanel`
  - 迁移 `updateFormatSelector`
  - 迁移 `createStatusBar`
- [x] **5.3.2** 创建 `src/ui/preview/actions.ts`
  - 从 `web/ui-preview-actions.js` 迁移所有函数
- [x] **5.3.3** 创建 `src/ui/preview/content.ts`
  - 从 `web/preview-content.js` 迁移预览内容渲染

### 5.4 迁移对话框

- [x] **5.4.1** 创建 `src/ui/dialogs/settings.ts`
  - 从 `web/ui-settings.js` 迁移设置面板
- [x] **5.4.2** 创建 `src/ui/dialogs/ssh-dialog.ts`
  - 从 `web/ui-ssh-dialog.js` 迁移 SSH 对话框

### 5.5 迁移组件

- [x] **5.5.1** 创建 `src/ui/components/format-selector.ts`
  - 从 `web/ui-format-selector.js` 迁移
- [x] **5.5.2** 创建 `src/ui/components/toolbar.ts`
  - 从 `web/ui-toolbar.js` 迁移
- [x] **5.5.3** 创建 `src/ui/header.ts`
  - 从 `web/ui-header.js` 迁移

### 5.6 迁移窗口管理

- [x] **5.6.1** 创建 `src/ui/window.ts`
  - 从 `web/ui-window.js` 迁移窗口创建逻辑

### 5.7 迁移浮动窗口

- [x] **5.7.1** 创建 `src/ui/floating/index.ts`
- [x] **5.7.2** 创建 `src/ui/floating/window.ts`
  - 从 `web/floating-window.js` 迁移
- [x] **5.7.3** 创建 `src/ui/floating/dock.ts`
  - 从 `web/floating-dock.js` 迁移

### 5.8 创建 UI 统一出口

- [x] **5.8.1** 创建 `src/ui/index.ts`
  - 导出所有 UI 函数
  - 保持与原 `extension.js` 导入兼容

### 5.9 阶段验收标准

- [x] 文件浏览器正常显示
- [x] 列表/网格视图切换正常
- [x] 文件排序功能正常
- [x] 预览面板正常工作
- [x] 设置对话框正常工作
- [x] SSH 对话框正常工作
- [x] 浮动窗口正常打开/关闭

---

## 阶段六：迁移工具函数

- [x] **6.1** 创建 `src/utils/helpers.ts`，从 `web/utils-helpers.js` 迁移
- [x] **6.2** 创建 `src/utils/csv.ts`，从 `web/utils-csv.js` 迁移
- [x] **6.3** 创建 `src/utils/drag.ts`，从 `web/utils-drag.js` 迁移
- [x] **6.4** 创建 `src/utils/file-type.ts`，从 `web/utils-file-type.js` 迁移
- [x] **6.5** 创建 `src/utils/format.ts`，from `web/utils-format.js` 迁移
- [x] **6.6** 创建 `src/utils/script.ts`，从 `web/utils-script.js` 迁移
- [x] **6.7** 创建 `src/utils/syntax-highlight.ts`，从 `web/utils-syntax-highlight.js` 迁移
- [x] **6.8** 创建 `src/utils/table.ts`，从 `web/utils-table.js` 迁移
- [x] **6.9** 创建 `src/utils/theme.ts`，从 `web/utils-theme.js` 迁移
- [x] **6.10** 创建 `src/utils/index.ts`，统一导出

### 6.11 阶段验收标准

- [x] CSV 解析/导出正常
- [x] 拖拽功能正常
- [x] 文件类型识别正常
- [x] 语法高亮正常
- [x] 主题适配正常

---

## 阶段七：集成测试

### 7.1 功能测试

- [x] **7.1.1** 测试文件列表加载
- [x] **7.1.2** 测试文件预览（图片/音频/视频/文档）
- [x] **7.1.3** 测试排序功能
- [x] **7.1.4** 测试视图切换（列表/网格）
- [x] **7.1.5** 测试新建文件/文件夹
- [x] **7.1.6** 测试删除文件
- [x] **7.1.7** 测试路径复制

### 7.2 远程连接测试

- [x] **7.2.1** 测试 SSH 连接
- [x] **7.2.2** 测试远程目录浏览
- [x] **7.2.3** 测试 SSH 断开

### 7.3 浮动预览测试

- [x] **7.3.1** 测试浮动窗口打开
- [x] **7.3.2** 测试全屏切换
- [x] **7.3.3** 测试 Dock 栏更新

### 7.4 主题测试

- [x] **7.4.1** 测试亮色主题
- [x] **7.4.2** 测试暗色主题
- [x] **7.4.3** 测试 ComfyUI 主题跟随

### 7.5 阶段验收标准

- [x] 所有功能测试通过
- [x] 无控制台错误
- [x] 性能无明显下降

---

## 阶段八：清理与优化

### 8.1 清理旧文件

- [x] **8.1.1** 备份 `web/*.js` 到临时目录
- [x] **8.1.2** 删除 `web/` 下的所有 `.js` 文件
- [x] **8.1.3** 验证构建输出覆盖旧文件

### 8.2 文档更新

- [x] **8.2.1** 更新 `README.md`（构建说明）
- [x] **8.2.2** 更新开发者文档

### 8.3 性能优化

- [x] **8.3.1** 配置 Vite 压缩
- [x] **8.3.2** 验证代码分割效果
- [x] **8.3.3** 测试加载性能

### 8.4 阶段验收标准

- [x] `web/` 目录无旧 JS 文件
- [x] 构建输出正常
- [x] 文档更新完成

---

## 回滚计划

如果在任何阶段遇到问题，可以按以下步骤回滚：

### 回滚步骤

1. **保留备份**: 在开始迁移前，备份 `web/` 目录到 `web_backup/`
2. **阶段回滚**:
   - 如果某模块迁移失败，删除对应的 `src/` 文件
   - 恢复使用原 `web/*.js` 文件
3. **完全回滚**:
   - 删除 `src/` 目录
   - 删除 `web/` 中所有新生成的文件
   - 从 `web_backup/` 恢复原文件

### 回滚命令

```bash
# 完全回滚
rm -rf src/
rm -rf web/*.js
cp -r web_backup/* web/
rm -rf web_backup/
```

---

## 依赖关系图

```
阶段一 (基础设施)
    │
    ▼
阶段二 (入口文件) ───────┐
    │                    │
    ▼                    │
阶段三 (核心模块)         │
    │                    │
    ▼                    │
阶段四 (API 模块) ───────┤
    │                    │
    ▼                    │
阶段五 (UI 模块)  ───────┤
    │                    │
    ▼                    │
阶段六 (工具函数) ────────┤
    │                    │
    ▼                    ▼
阶段七 (集成测试) ◄───────┘
    │
    ▼
阶段八 (清理优化)
```

---

## 迁移映射表

| 原文件 | 新位置 | 状态 |
|--------|--------|------|
| `extension.js` | `src/extension.ts` | 待迁移 |
| `core-constants.js` | `src/core/constants.ts` | 待迁移 |
| `core-state.js` | `src/core/state.ts` | 待迁移 |
| `api-index.js` | `src/api/endpoints/file.ts` | 待迁移 |
| `api-ssh.js` | `src/api/ssh.ts` | 待迁移 |
| `ui-browser.js` | `src/ui/browser/index.ts` | 待迁移 |
| `ui-preview.js` | `src/ui/preview/index.ts` | 待迁移 |
| `ui-preview-actions.js` | `src/ui/preview/actions.ts` | 待迁移 |
| `ui-actions.js` | `src/ui/browser/actions.ts` | 待迁移 |
| `ui-settings.js` | `src/ui/dialogs/settings.ts` | 待迁移 |
| `ui-ssh-dialog.js` | `src/ui/dialogs/ssh-dialog.ts` | 待迁移 |
| `ui-toolbar.js` | `src/ui/components/toolbar.ts` | 待迁移 |
| `ui-header.js` | `src/ui/header.ts` | 待迁移 |
| `ui-format-selector.js` | `src/ui/components/format-selector.ts` | 待迁移 |
| `ui-window.js` | `src/ui/window.ts` | 待迁移 |
| `floating-window.js` | `src/ui/floating/window.ts` | 待迁移 |
| `floating-dock.js` | `src/ui/floating/dock.ts` | 待迁移 |
| `preview-content.js` | `src/ui/preview/content.ts` | 待迁移 |
| `utils-helpers.js` | `src/utils/helpers.ts` | 待迁移 |
| `utils-csv.js` | `src/utils/csv.ts` | 待迁移 |
| `utils-drag.js` | `src/utils/drag.ts` | 待迁移 |
| `utils-file-type.js` | `src/utils/file-type.ts` | 待迁移 |
| `utils-format.js` | `src/utils/format.ts` | 待迁移 |
| `utils-script.js` | `src/utils/script.ts` | 待迁移 |
| `utils-syntax-highlight.js` | `src/utils/syntax-highlight.ts` | 待迁移 |
| `utils-table.js` | `src/utils/table.ts` | 待迁移 |
| `utils-theme.js` | `src/utils/theme.ts` | 待迁移 |

---

## 最终验证清单

迁移完成后，所有任务需满足：

- [x] 代码编译无错误
- [x] 类型检查通过 (`npm run type-check`)
- [x] 所有功能测试通过
- [x] ComfyUI 正常加载扩展
- [x] 开发环境热更新正常
- [x] 生产构建输出正确
- [x] `web/` 目录结构符合预期
- [x] 旧文件已备份/删除
