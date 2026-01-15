# Spec: UI Components 测试规范

**版本**: 1.0
**更新日期**: 2026-01-16

## 概述

本文档定义 `frontend/src/ui/components/` 模块的测试规范。

## 测试框架配置

### Vitest 配置

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
});
```

## 测试文件规范

### 文件命名

- 测试文件与源文件同名，添加 `.test.ts` 后缀
- 示例：`actions.ts` → `actions.test.ts`

### 文件位置

测试文件放在源文件同目录下：

```
frontend/src/ui/components/
├── actions.ts
├── actions.test.ts      # 新建
├── browser.ts
├── browser.test.ts      # 新建
├── header.ts
├── header.test.ts       # 新建
└── ...
```

## 测试结构规范

### 基本结构

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { functionToTest } from './module.js';

describe('functionToTest', () => {
  beforeEach(() => {
    // 设置：创建 mock DOM、重置状态
  });

  afterEach(() => {
    // 清理：移除 DOM 元素、清除 mock
  });

  it('should do something expected', () => {
    // Arrange（准备）
    const input = 'test';

    // Act（执行）
    const result = functionToTest(input);

    // Assert（断言）
    expect(result).toBe('expected');
  });
});
```

### 命名规范

- **测试套件**：使用被测试的函数/组件名
- **测试用例**：使用 `should ...` 格式描述预期行为

```typescript
describe('loadDirectory', () => {
  it('should load files from local directory', async () => {
    // ...
  });

  it('should handle API errors gracefully', async () => {
    // ...
  });
});
```

## Mock 规范

### API Mock

```typescript
import { vi } from 'vitest';
import * as fileApi from '../../api/endpoints/file.js';

vi.mock('../../api/endpoints/file.js', () => ({
  listDirectory: vi.fn(),
  getFileInfo: vi.fn(),
}));

describe('loadDirectory', () => {
  beforeEach(() => {
    vi.mocked(fileApi.listDirectory).mockResolvedValue({
      files: [{ name: 'test.png', path: '/test.png', is_dir: false }],
      path: '/test',
    });
  });
});
```

### DOM Mock

```typescript
describe('Component with DOM', () => {
  beforeEach(() => {
    // 创建 mock DOM 元素
    const container = document.createElement('div');
    container.id = 'dm-file-list';
    document.body.appendChild(container);
  });

  afterEach(() => {
    // 清理 DOM
    document.body.innerHTML = '';
  });
});
```

### 状态 Mock

```typescript
import { FileManagerState } from '../../core/state.js';

describe('State-dependent test', () => {
  beforeEach(() => {
    // 重置状态
    FileManagerState.files = [];
    FileManagerState.currentPath = '.';
    FileManagerState.selectedFiles = [];
  });
});
```

## 测试类别

### 1. 渲染测试

验证组件正确生成 DOM：

```typescript
it('should render file list item with correct attributes', () => {
  const html = createFileListItem({
    name: 'test.png',
    path: '/test.png',
    is_dir: false,
  }, false);

  expect(html).toContain('data-path="/test.png"');
  expect(html).toContain('data-is-dir="false"');
  expect(html).toContain('test.png');
});
```

### 2. 交互测试

验证用户交互触发正确行为：

```typescript
it('should select file on click', () => {
  const item = document.createElement('div');
  item.dataset.path = '/test.png';
  item.dataset.isDir = 'false';

  selectFile(item);

  expect(FileManagerState.selectedFiles).toEqual(['/test.png']);
});
```

### 3. 状态测试

验证状态管理正确更新：

```typescript
it('should update sort order on toggle', () => {
  FileManagerState.sortBy = 'name';
  FileManagerState.sortOrder = 'asc';

  toggleSort('name');

  expect(FileManagerState.sortOrder).toBe('desc');
});
```

### 4. 异步测试

使用 `async/await` 处理异步操作：

```typescript
it('should load directory from API', async () => {
  vi.mocked(listDirectory).mockResolvedValue({
    files: [{ name: 'test.png', path: '/test.png', is_dir: false }],
    path: '/test',
  });

  await loadDirectory('/test');

  expect(FileManagerState.files).toHaveLength(1);
  expect(FileManagerState.files[0].name).toBe('test.png');
});
```

### 5. 边界测试

验证边界条件处理：

```typescript
it('should handle empty file list', () => {
  FileManagerState.files = [];

  renderFileListUI();

  const container = document.getElementById('dm-file-list');
  expect(container?.children.length).toBe(0);
});
```

### 6. 错误测试

验证错误处理逻辑：

```typescript
it('should show error on API failure', async () => {
  vi.mocked(listDirectory).mockRejectedValue(new Error('Network error'));

  await loadDirectory('/test');

  expect(FileManagerState.files).toEqual([]);
  // 验证错误消息显示
});
```

## Fixtures 规范

### 测试数据位置

```
frontend/tests/fixtures/
├── ui-fixtures.ts       # UI 组件专用 fixtures
├── api-responses.ts     # API 响应 mock
└── test-data.ts         # 通用测试数据
```

### Fixture 示例

```typescript
// frontend/tests/fixtures/ui-fixtures.ts
export const mockFileItems = [
  { name: 'image.png', path: '/image.png', is_dir: false, size: 1024 },
  { name: 'folder', path: '/folder', is_dir: true },
  { name: 'document.pdf', path: '/document.pdf', is_dir: false, size: 2048 },
];

export const mockTheme = {
  bgPrimary: '#1a1a1a',
  bgSecondary: '#2a2a2a',
  bgTertiary: '#3a3a3a',
  textPrimary: '#ffffff',
  textSecondary: '#a0a0a0',
  borderColor: '#4a4a4a',
  accentColor: '#3498db',
  successColor: '#27ae60',
  errorColor: '#e74c3c',
};
```

## 覆盖率目标

| 模块 | 当前覆盖率 | 目标覆盖率 |
|------|-----------|-----------|
| `actions.ts` | 0% | 80% |
| `browser.ts` | 0% | 85% |
| `header.ts` | 0% | 75% |
| `ssh-dialog.ts` | 0% | 75% |
| `toolbar.ts` | 0% | 75% |
| `preview-actions.ts` | 0% | 70% |
| `preview.ts` | 54.7% | 70% |
| `settings.ts` | 28.12% | 60% |
| **总体** | **52.08%** | **75%** |

## 运行测试

### 运行所有测试

```bash
cd frontend
npm test
```

### 运行特定组件测试

```bash
npm test -- ui/components/actions.test.ts
```

### 运行覆盖率报告

```bash
npm run test:coverage
```

### 监视模式

```bash
npm run test:watch
```

## 调试建议

1. **使用 `console.log` 调试**：在测试中输出 DOM 状态
2. **使用 `--ui` 参数**：运行 Vitest UI 界面
3. **使用 `--inspect` 参数**：启用 Node.js 调试器

```bash
npm test -- --ui
```

## 最佳实践

1. **保持测试独立**：每个测试应该能独立运行
2. **使用 beforeEach 清理**：确保测试间不共享状态
3. **Mock 外部依赖**：API、DOM、状态管理
4. **测试应该快速**：避免不必要的异步延迟
5. **清晰的测试名称**：使用 `should ...` 格式
6. **一个测试一个断言**：保持测试简单明了
