# -*- coding: utf-8 -*-
"""完整测试脚本"""
import sys
import os

# 添加 skills 目录
sys.path.insert(0, r"C:\Users\Administrator\.claude\skills\webapp-testing")

from playwright.sync_api import sync_playwright

def test_document_preview():
    """测试文档预览功能"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 捕获控制台
        console_logs = []
        page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))

        try:
            # 访问本地 ComfyUI
            print("🌐 访问 ComfyUI...")
            page.goto("http://127.0.0.1:8188", timeout=30000)
            page.wait_for_load_state("networkidle", timeout=30000)
            print("✅ 页面加载完成")

            # 查找菜单或按钮
            print("\n🔍 查找界面元素...")

            # 尝试查找侧边栏菜单
            menu_items = page.locator(".menu-item, [class*='menu'], [class*='sidebar']").all()
            print(f"找到 {len(menu_items)} 个菜单相关元素")

            # 查找包含"数据"或"Data"的按钮
            data_btns = page.locator("button:has-text('数据'), button:has-text('Data'), button:has-text('文件')").all()
            print(f"找到 {len(data_btns)} 个数据相关按钮")

            # 查找原始 HTML 结构
            html = page.content()
            if 'dm-' in html or 'data-manager' in html:
                print("✅ 检测到数据管理器相关元素")

            # 截图
            page.screenshot(path=r"C:\Users\Administrator\Documents\ai\ComfyUI\custom_nodes\ComfyUI_Data_Manager\test_result.png", full_page=True)
            print("📸 截图已保存")

            # 打印控制台日志
            print("\n📋 控制台日志:")
            for log in console_logs:
                if 'error' in log.lower() or 'warn' in log.lower():
                    print(f"  ⚠️  {log}")

            print("\n✅ 测试完成")

        except Exception as e:
            print(f"❌ 错误: {e}")
            import traceback
            traceback.print_exc()
        finally:
            browser.close()

if __name__ == "__main__":
    test_document_preview()
