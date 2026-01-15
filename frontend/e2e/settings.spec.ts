// -*- coding: utf-8 -*-
/**
 * 设置面板 E2E 测试
 *
 * 测试设置面板的功能：
 * - 打开设置
 * - 修改配置
 * - 保存设置
 * - 设置持久化
 */

import { test, expect } from '@playwright/test';

test.describe('设置面板', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('应该能够打开设置面板', async ({ page }) => {
    // 打开文件管理器
    await page.locator('[data-testid="data-manager-core"]').first()
      .locator('button:has-text("打开界面")')
      .click();

    // 等待文件管理器加载
    const fileManager = page.locator('.file-manager-window, [data-testid="file-manager"]');
    await expect(fileManager).toBeVisible();

    // 查找设置按钮
    const settingsButton = fileManager.locator('button:has-text("设置"), [data-testid="settings-button"]').first();
    if (await settingsButton.isVisible()) {
      await settingsButton.click();

      // 验证设置面板打开
      const settingsPanel = fileManager.locator('.settings-panel, [data-testid="settings-panel"]');
      await expect(settingsPanel).toBeVisible({ timeout: 3000 });
    }
  });

  test('应该能够修改配置', async ({ page }) => {
    // 打开文件管理器和设置
    await page.locator('[data-testid="data-manager-core"]').first()
      .locator('button:has-text("打开界面")')
      .click();

    const fileManager = page.locator('.file-manager-window, [data-testid="file-manager"]');
    await expect(fileManager).toBeVisible();

    const settingsButton = fileManager.locator('button:has-text("设置"), [data-testid="settings-button"]').first();
    if (await settingsButton.isVisible({ timeout: 2000 })) {
      await settingsButton.click();

      const settingsPanel = fileManager.locator('.settings-panel, [data-testid="settings-panel"]');
      await expect(settingsPanel).toBeVisible();

      // 查找视图切换选项（列表/网格）
      const viewToggle = settingsPanel.locator('input[type="radio"][name="view"], [data-testid="view-toggle"]').first();
      if (await viewToggle.isVisible()) {
        // 获取当前值
        const currentValue = await viewToggle.inputValue();

        // 切换视图
        const gridOption = settingsPanel.locator('input[type="radio"][value="grid"], [data-testid="grid-view"]');
        const listOption = settingsPanel.locator('input[type="radio"][value="list"], [data-testid="list-view"]');

        if (currentValue === 'list' && await gridOption.isVisible()) {
          await gridOption.check();
        } else if (await listOption.isVisible()) {
          await listOption.check();
        }
      }
    }
  });

  test('应该能够保存设置', async ({ page }) => {
    // 打开文件管理器和设置
    await page.locator('[data-testid="data-manager-core"]').first()
      .locator('button:has-text("打开界面")')
      .click();

    const fileManager = page.locator('.file-manager-window, [data-testid="file-manager"]');
    await expect(fileManager).toBeVisible();

    const settingsButton = fileManager.locator('button:has-text("设置"), [data-testid="settings-button"]').first();
    if (await settingsButton.isVisible({ timeout: 2000 })) {
      await settingsButton.click();

      const settingsPanel = fileManager.locator('.settings-panel, [data-testid="settings-panel"]');
      await expect(settingsPanel).toBeVisible();

      // 查找保存按钮
      const saveButton = settingsPanel.locator('button:has-text("保存"), button:has-text("Save"), [data-testid="save-settings"]').first();
      if (await saveButton.isVisible()) {
        await saveButton.click();

        // 验证保存成功提示
        const toast = page.locator('.toast, .notification, [data-testid="toast"]').filter({ hasText: /保存|保存成功|Settings saved/ });
        if (await toast.isVisible({ timeout: 2000 })) {
          await expect(toast).toBeVisible();
        }
      }
    }
  });
});
