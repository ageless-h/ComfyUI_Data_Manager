# 前端测试文档

## 测试架构

ComfyUI Data Manager 使用多层次的测试策略：

```
┌─────────────────────────────────────────────────────┐
│                    测试金字塔                      │
├─────────────────────────────────────────────────────┤
│                                                   │
│                    E2E 测试                        │
│              (Playwright - 真实浏览器)              │
│                    ▲                               │
│                   ╱ ╲                              │
│                  ╱   ╲                             │
│               组件测试   单元测试                    │
│           (Vitest - Happy DOM)                     │
│                                                   │
└─────────────────────────────────────────────────────┘
```

## 测试类型

| 测试类型 | 框架 | 环境 | 用途 | 位置 |
|---------|------|------|------|------|
| 单元测试 | Vitest | Happy DOM | 测试函数和类 | `src/**/*.test.ts` |
| 组件测试 | Vitest | Happy DOM | 测试 Vue 组件 | `src/**/*.test.ts` |
| E2E 测试 | Playwright | 真实浏览器 | 测试完整流程 | `e2e/*.spec.ts` |

## 运行测试

### 单元测试和组件测试

```bash
# 运行所有测试
npm test

# 运行测试（单次，不监视）
npm run test:ci

# 生成覆盖率报告
npm run test:coverage

# UI 模式运行
npm run test:ui

# 监视模式
npm run test:watch
```

### E2E 测试

```bash
# 运行所有 E2E 测试
npm run test:e2e

# UI 模式运行
npm run test:e2e:ui

# 调试模式
npm run test:e2e:debug

# 有头模式（查看浏览器）
npm run test:e2e:headed
```

### 运行所有测试

```bash
npm run test:all
```

## 测试目录结构

```
frontend/
├── src/                        # 源代码
│   ├── api/                    # API 客户端
│   │   └── *.test.ts          # API 测试
│   ├── core/                   # 状态管理
│   │   └── *.test.ts          # 状态测试
│   ├── ui/                     # UI 组件
│   │   └── components/*.test.ts # 组件测试
│   ├── utils/                  # 工具函数
│   │   └── *.test.ts          # 工具测试
│   └── tests/                  # 测试设置
│       └── setup.ts           # Vitest 设置
├── tests/                      # 测试辅助
│   ├── unit/                   # 单元测试（待迁移）
│   ├── components/             # 组件测试（待迁移）
│   └── fixtures/               # 测试数据
│       ├── api-responses.ts    # API 响应 mock
│       └── test-data.ts        # 测试数据
├── e2e/                        # E2E 测试
│   ├── file-manager.spec.ts    # 文件管理器测试
│   ├── settings.spec.ts        # 设置测试
│   ├── preview.spec.ts         # 预览测试
│   ├── global-setup.ts         # 全局设置
│   ├── global-teardown.ts      # 全局清理
│   └── README.md              # E2E 测试文档
├── vitest.config.ts            # Vitest 配置
└── playwright.config.ts        # Playwright 配置
```

## 覆盖率目标

| 模块 | 目标覆盖率 |
|------|-----------|
| `api/` | 85% |
| `utils/` | 90% |
| `core/` | 80% |
| `ui/components/` | 75% |
| **总体** | **80%** |

查看覆盖率报告：
```bash
npm run test:coverage
# 报告位于: coverage/index.html
```

## 编写测试

### 单元测试模板

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { myFunction } from './my-module';

describe('myFunction', () => {
  it('should return expected result', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });

  it('should handle edge cases', () => {
    const result = myFunction('');
    expect(result).toBe(null);
  });
});
```

### 组件测试模板

```typescript
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import MyComponent from './MyComponent.vue';

describe('MyComponent', () => {
  it('should render correctly', () => {
    const wrapper = mount(MyComponent, {
      props: { title: 'Test' }
    });
    expect(wrapper.text()).toContain('Test');
  });

  it('should emit event on button click', async () => {
    const wrapper = mount(MyComponent);
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('click')).toBeTruthy();
  });
});
```

## 测试数据

测试 fixtures 位于 `tests/fixtures/`：

- `api-responses.ts` - API 响应 mock 数据
- `test-data.ts` - 通用测试数据

使用示例：
```typescript
import { mockFileListResponse } from '../fixtures/api-responses';

vi.mock('../api/client', () => ({
  listFiles: vi.fn().mockResolvedValue(mockFileListResponse),
}));
```

## 故障排查

### Vitest 测试

**问题**: 模块导入错误
- 确保 `src/tests/setup.ts` 正确配置
- 检查 vitest.config.ts 中的别名设置

**问题**: Happy DOM 行为不一致
- 某些 API 在 Happy DOM 中不完全支持
- 考虑使用 vi.mock() 模拟

### Playwright 测试

**问题**: 元素未找到
- 确保 ComfyUI 正在运行
- 检查选择器是否正确
- 增加等待时间

**问题**: 测试超时
- 检查网络连接
- 增加 playwright.config.ts 中的超时设置

**问题**: 测试不稳定
- 使用 data-testid 属性
- 避免依赖文本内容（可能国际化）
- 添加显式等待

## CI/CD

测试在 CI/CD 管道中自动运行：

```yaml
# 单元测试
- npm run test:ci

# E2E 测试
- npm run test:e2e

# 覆盖率检查
- npm run test:coverage
```

## 相关文档

- [Vitest 文档](https://vitest.dev/)
- [Playwright 文档](https://playwright.dev/)
- [Vue Test Utils](https://test-utils.vuejs.org/)
