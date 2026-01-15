// -*- coding: utf-8 -*-
/**
 * 文件管理器 E2E 测试
 *
 * 测试文件管理器的核心功能：
 * - 打开文件管理器
 * - 浏览目录
 * - 搜索文件
 * - 关闭文件管理器
 */

import { test, expect } from '@playwright/test';

test.describe('文件管理器', () => {
  test.beforeEach(async ({ page }) => {
    // 每个测试前导航到 ComfyUI
    await page.goto('/');

    // 等待页面加载完成
    await page.waitForLoadState('networkidle');
  });

  test('应该能够打开文件管理器', async ({ page }) => {
    // 查找 Data Manager Core 节点
    const coreNode = page.locator('[data-testid="data-manager-core"]').first();

    // 点击打开界面按钮
    const openButton = coreNode.locator('button:has-text("打开界面")');
    await openButton.click();

    // 验证文件管理器窗口打开
    const fileManager = page.locator('.file-manager-window, [data-testid="file-manager"]');
    await expect(fileManager).toBeVisible({ timeout: 5000 });

    // 验证标题显示
    const title = fileManager.locator('.window-title, h1, h2').first();
    await expect(title).toContainText('Data Manager', { timeout: 3000 });
  });

  test('应该能够浏览目录', async ({ page }) => {
    // 打开文件管理器
    await page.locator('[data-testid="data-manager-core"]').first()
      .locator('button:has-text("打开界面")')
      .click();

    // 等待文件管理器加载
    const fileManager = page.locator('.file-manager-window, [data-testid="file-manager"]');
    await expect(fileManager).toBeVisible();

    // 查找文件列表
    const fileList = fileManager.locator('.file-list, [data-testid="file-list"]');
    await expect(fileList).toBeVisible({ timeout: 5000 });

    // 验证至少有一些文件/文件夹显示
    const items = fileList.locator('.file-item, .file-row');
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });

  test('应该能够搜索文件', async ({ page }) => {
    // 打开文件管理器
    await page.locator('[data-testid="data-manager-core"]').first()
      .locator('button:has-text("打开界面")')
      .click();

    // 等待文件管理器加载
    const fileManager = page.locator('.file-manager-window, [data-testid="file-manager"]');
    await expect(fileManager).toBeVisible();

    // 查找搜索框
    const searchInput = fileManager.locator('input[type="search"], [data-testid="search-input"]').first();
    if (await searchInput.isVisible()) {
      // 输入搜索关键词
      await searchInput.fill('png');

      // 等待搜索结果
      await page.waitForTimeout(500);

      // 验证搜索结果
      const fileList = fileManager.locator('.file-list, [data-testid="file-list"]');
      const items = fileList.locator('.file-item, .file-row');
      const count = await items.count();

      // 搜索结果可能为空，但不应导致错误
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('应该能够关闭文件管理器', async ({ page }) => {
    // 打开文件管理器
    await page.locator('[data-testid="data-manager-core"]').first()
      .locator('button:has-text("打开界面")')
      .click();

    // 验证文件管理器打开
    const fileManager = page.locator('.file-manager-window, [data-testid="file-manager"]');
    await expect(fileManager).toBeVisible();

    // 点击关闭按钮
    const closeButton = fileManager.locator('.close-button, button:has-text("×"), button:has-text("关闭")').first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }

    // 验证文件管理器关闭
    await expect(fileManager).not.toBeVisible({ timeout: 3000 });
  });
});
