# E2E 测试文档

## 概述

本目录包含 ComfyUI Data Manager 的端到端（E2E）测试，使用 Playwright 在真实浏览器环境中测试用户交互流程。

## 测试文件

| 文件 | 描述 | 测试场景 |
|------|------|----------|
| `file-manager.spec.ts` | 文件管理器测试 | 打开、浏览、搜索、关闭 |
| `settings.spec.ts` | 设置面板测试 | 打开设置、修改配置、保存 |
| `preview.spec.ts` | 文件预览测试 | 图像预览、关闭预览、加载状态 |

## 前置条件

1. **ComfyUI 运行中**
   - E2E 测试需要 ComfyUI 实例运行
   - 默认地址：`http://localhost:8188`
   - 可通过环境变量覆盖：`COMFYUI_URL`

2. **浏览器已安装**
   - 首次运行前安装浏览器：
     ```bash
     npx playwright install
     ```

## 运行测试

### 运行所有 E2E 测试

```bash
npm run test:e2e
```

### 在 UI 模式下运行

```bash
npm run test:e2e:ui
```

### 以有头模式运行（查看浏览器）

```bash
npm run test:e2e:headed
```

### 调试模式

```bash
npm run test:e2e:debug
```

### 运行特定测试文件

```bash
npx playwright test file-manager.spec.ts
```

### 运行特定测试用例

```bash
npx playwright test --grep "应该能够打开文件管理器"
```

## 测试配置

配置文件：`frontend/playwright.config.ts`

### 支持的浏览器

- Chromium（Desktop Chrome）
- Firefox
- WebKit（Desktop Safari）
- Mobile Chrome（Pixel 5）
- Mobile Safari（iPhone 13）

### 超时设置

- 测试超时：30 秒
- 期望超时：5 秒
- 操作超时：10 秒
- 导航超时：30 秒

### 重试机制

- CI 环境：2 次重试
- 本地开发：1 次重试

## 测试报告

测试完成后，报告将保存在：

- **HTML 报告**: `frontend/playwright-report/index.html`
- **JUnit 报告**: `frontend/test-results/junit.xml`

查看 HTML 报告：
```bash
npx playwright show-report
```

## 故障排查

### 测试失败

1. **检查 ComfyUI 是否运行**
   ```bash
   curl http://localhost:8188
   ```

2. **查看测试报告**
   - HTML 报告包含截图和视频
   - 位于 `playwright-report/` 目录

3. **以有头模式运行**
   ```bash
   npm run test:e2e:headed
   ```

### 选择器问题

如果测试找不到元素：

1. 检查元素是否在 DOM 中
2. 增加等待时间
3. 使用更具体的选择器

### 超时问题

如果测试超时：

1. 检查网络连接
2. 增加 `playwright.config.ts` 中的超时设置
3. 检查 ComfyUI 是否响应缓慢

## 编写新测试

### 测试模板

```typescript
import { test, expect } from '@playwright/test';

test.describe('功能模块', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('应该执行某个操作', async ({ page }) => {
    // 测试步骤
    const element = page.locator('.selector');
    await expect(element).toBeVisible();
  });
});
```

### 选择器最佳实践

1. **优先使用 data-testid**
   ```typescript
   page.locator('[data-testid="my-button"]')
   ```

2. **使用文本内容（谨慎）**
   ```typescript
   page.locator('button:has-text("打开")')
   ```

3. **结合多个条件**
   ```typescript
   page.locator('.file-item').filter({ hasText: 'png' })
   ```

## CI/CD 集成

E2E 测试可以在 CI/CD 管道中自动运行：

```yaml
- name: Run E2E tests
  run: |
    npm run test:e2e
  env:
    COMFYUI_URL: http://localhost:8188
```
