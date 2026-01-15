// -*- coding: utf-8 -*-
/**
 * E2E 测试全局清理
 *
 * 在所有测试运行后执行
 */

import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('✅ E2E tests completed');
  console.log('📊 Report available at: playwright-report/index.html');
}

export default globalTeardown;
