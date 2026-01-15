// -*- coding: utf-8 -*-
/**
 * E2E 测试全局设置
 *
 * 在所有测试运行前执行
 */

import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E tests...');
  console.log(`📁 Test directory: ${config.projects?.[0]?.testDir}`);
  console.log(`🌐 Base URL: ${config.projects?.[0]?.use?.baseURL}`);
}

export default globalSetup;
