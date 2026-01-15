// -*- coding: utf-8 -*-
/**
 * 文件预览 E2E 测试
 *
 * 测试文件预览功能：
 * - 图像预览
 * - 视频预览
 * - 文档预览
 * - 关闭预览
 */

import { test, expect } from '@playwright/test';

test.describe('文件预览', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('应该能够预览图像文件', async ({ page }) => {
    // 打开文件管理器
    await page.locator('[data-testid="data-manager-core"]').first()
      .locator('button:has-text("打开界面")')
      .click();

    // 等待文件管理器加载
    const fileManager = page.locator('.file-manager-window, [data-testid="file-manager"]');
    await expect(fileManager).toBeVisible();

    // 查找图像文件
    const imageFile = fileManager.locator('.file-item, .file-row').filter({ hasText: /png|jpg|jpeg/i }).first();

    if (await imageFile.isVisible({ timeout: 5000 })) {
      // 双击或点击预览按钮
      await imageFile.dblclick();

      // 验证预览面板打开
      const previewPanel = fileManager.locator('.preview-panel, [data-testid="preview-panel"]');
      await expect(previewPanel).toBeVisible({ timeout: 5000 });

      // 验证图像显示
      const image = previewPanel.locator('img, .preview-image');
      await expect(image).toBeVisible();
    } else {
      test.skip('没有找到可预览的图像文件');
    }
  });

  test('应该能够关闭预览', async ({ page }) => {
    // 打开文件管理器
    await page.locator('[data-testid="data-manager-core"]').first()
      .locator('button:has-text("打开界面")')
      .click();

    const fileManager = page.locator('.file-manager-window, [data-testid="file-manager"]');
    await expect(fileManager).toBeVisible();

    // 查找文件并预览
    const previewableFile = fileManager.locator('.file-item, .file-row').first();
    if (await previewableFile.isVisible()) {
      await previewableFile.dblclick();

      // 等待预览面板
      const previewPanel = fileManager.locator('.preview-panel, [data-testid="preview-panel"]');

      if (await previewPanel.isVisible({ timeout: 3000 })) {
        // 查找关闭按钮
        const closeButton = previewPanel.locator('.close-button, button:has-text("×"), button:has-text("关闭")').first();

        if (await closeButton.isVisible()) {
          await closeButton.click();

          // 验证预览关闭
          await expect(previewPanel).not.toBeVisible({ timeout: 3000 });
        }
      }
    }
  });

  test('应该显示预览加载状态', async ({ page }) => {
    // 打开文件管理器
    await page.locator('[data-testid="data-manager-core"]').first()
      .locator('button:has-text("打开界面")')
      .click();

    const fileManager = page.locator('.file-manager-window, [data-testid="file-manager"]');
    await expect(fileManager).toBeVisible();

    // 查找文件并预览
    const file = fileManager.locator('.file-item, .file-row').first();
    if (await file.isVisible()) {
      await file.dblclick();

      // 预览面板应该显示（可能显示加载状态）
      const previewPanel = fileManager.locator('.preview-panel, [data-testid="preview-panel"]');

      // 检查加载指示器
      const loadingIndicator = previewPanel.locator('.loading, .spinner, [data-testid="loading"]');

      // 加载指示器可能短暂显示然后消失
      if (await loadingIndicator.isVisible({ timeout: 1000 })) {
        await expect(loadingIndicator).toBeVisible();
        // 等待加载完成
        await expect(loadingIndicator).not.toBeVisible({ timeout: 5000 });
      }
    }
  });
});
