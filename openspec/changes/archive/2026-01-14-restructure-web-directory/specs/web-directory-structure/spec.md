# Web 目录结构规范

## ADDED Requirements

### Requirement: 目录组织结构

前端代码必须 (SHALL) 按照功能模块组织在 `src/` 目录下，采用层级目录结构。

#### Scenario: 源码目录结构

当创建新的前端模块时，代码应该放在 `src/` 目录下对应的功能子目录中。

| 目录 | 用途 | 示例文件 |
|------|------|----------|
| `src/api/` | API 调用模块 | `endpoints/file.ts`, `ssh.ts` |
| `src/core/` | 核心模块 | `constants.ts`, `state.ts`, `types.ts` |
| `src/ui/` | UI 组件模块 | `browser/`, `preview/`, `dialogs/` |
| `src/utils/` | 工具函数 | `helpers.ts`, `theme.ts` |

### Requirement: 构建系统配置

项目必须 (MUST) 使用 Vite 作为构建工具，将 `src/` 目录编译到 `web/` 目录。

#### Scenario: Vite 构建配置

当运行 `npm run build` 命令时，Vite 应该将 `src/extension.ts` 作为入口编译，输出文件应该放在 `web/` 目录下。

| 配置项 | 值 | 说明 |
|--------|-----|------|
| `outDir` | `web/` | 输出目录 |
| `input` | `src/extension.ts` | 入口文件 |
| `format` | `es` | ES Modules 格式 |
| `target` | `es2020` | 编译目标 |

### Requirement: 代码分割策略

构建系统必须 (MUST) 支持按目录进行代码分割。

#### Scenario: 代码分块

当构建项目时，Vite 应该按目录将代码分块输出。

| 源目录 | 输出文件 |
|--------|----------|
| `src/ui/` | `web/ui-preview-actions.js` |
| `src/core/` | N/A (inline in extension) |
| `src/api/` | `web/ssh.js` |
| `src/utils/` | N/A (inline) |

### Requirement: 模块导出规范

每个功能目录必须 (MUST) 有一个 `index.ts` 文件作为统一出口。

#### Scenario: 统一模块导出

当其他模块需要导入功能时，应该从对应目录的 `index.ts` 导入。

```typescript
// 从 src/ui/ 导入
import { createBrowserPanel } from './ui/index.js';

// 从 src/api/ 导入
import { listDirectory } from './api/index.js';

// 从 src/utils/ 导入
import { showToast } from './utils/index.js';
```

### Requirement: TypeScript 类型支持

项目必须 (MUST) 使用 TypeScript 进行类型检查。

#### Scenario: 类型定义

当定义新的数据结构时，应该使用 TypeScript 接口或类型别名。

| 类型 | 定义位置 |
|------|----------|
| `FileItem` | `src/core/types.ts` |
| `FileManagerState` | `src/core/state.ts` |
| `ComfyTheme` | `src/utils/theme.ts` |
