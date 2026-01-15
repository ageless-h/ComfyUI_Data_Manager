import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 测试配置
 *
 * 用于 ComfyUI Data Manager 的端到端测试
 */
export default defineConfig({
  // 测试文件位置
  testDir: './e2e',

  // 测试超时时间（毫秒）
  timeout: 30000,

  // 每个测试的超时时间
  expect: {
    timeout: 5000,
  },

  // 失败时重试次数
  retries: process.env.CI ? 2 : 1,

  // 并行执行测试
  workers: process.env.CI ? 1 : undefined,

  // 测试报告
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],

  // 共享设置
  use: {
    // 基础 URL（ComfyUI 地址）
    baseURL: process.env.COMFYUI_URL || 'http://localhost:8188',

    // 追踪测试失败
    trace: 'retain-on-failure',

    // 截图配置
    screenshot: 'only-on-failure',

    // 视频配置
    video: 'retain-on-failure',

    // 操作超时
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // 测试项目（不同浏览器）
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // 移动设备测试
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],

  // 测试运行前的全局设置
  globalSetup: './e2e/global-setup.ts',

  // 测试运行后的全局清理
  globalTeardown: './e2e/global-teardown.ts',

  // Web Server 配置（可选，用于启动开发服务器）
  // webServer: {
  //   command: 'npm run dev',
  //   port: 5173,
  //   reuseExistingServer: !process.env.CI,
  // },
});
