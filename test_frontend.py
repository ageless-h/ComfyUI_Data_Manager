# -*- coding: utf-8 -*-
"""测试前端文档预览功能"""
import sys
sys.path.insert(0, r"C:\Users\Administrator\.claude\skills\webapp-testing")

from playwright.sync_api import sync_playwright

def test_frontend():
    """测试前端"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        console_logs = []
        page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
        page.on("pageerror", lambda err: console_logs.append(f"[pageerror] {err}"))

        try:
            print("🌐 访问 ComfyUI...")
            page.goto("http://127.0.0.1:8188", timeout=30000)
            page.wait_for_load_state("networkidle", timeout=30000)
            print("✅ 页面加载完成")

            # 查找数据管理器按钮
            print("\n🔍 查找数据管理器...")
            dm_btns = page.locator("button:has-text('数据'), button:has-text('Data'), button:has-text('文件管理器')").all()
            print(f"找到 {len(dm_btns)} 个相关按钮")

            if dm_btns:
                print("点击数据管理器按钮...")
                dm_btns[0].click()
                page.wait_for_timeout(2000)

            # 查找文件列表
            print("\n🔍 查找文件列表...")
            files = page.locator("[class*='file'], [class*='item'], tr, div:has-text('.txt'), div:has-text('.md')").all()
            print(f"找到 {len(files)} 个文件相关元素")

            # 检查扩展 JS 是否加载
            print("\n🔍 检查扩展是否加载...")
            has_extension = page.evaluate("""
                () => {
                    return typeof window.FileManagerState !== 'undefined' ||
                           document.querySelector('[id*="dm-"]') !== null ||
                           document.querySelector('[class*="dm-"]') !== null;
                }
            """)
            print(f"扩展已加载: {has_extension}")

            # 查找预览面板
            print("\n🔍 查找预览面板...")
            preview = page.locator("[id*='preview'], [class*='preview']").first()
            if preview.count() > 0:
                print("✅ 找到预览面板")
                preview.screenshot(path=r"C:\Users\Administrator\Documents\ai\ComfyUI\custom_nodes\ComfyUI_Data_Manager\test_preview_panel.png")
                print("📸 预览面板截图已保存")
            else:
                print("未找到预览面板")

            # 完整截图
            page.screenshot(path=r"C:\Users\Administrator\Documents\ai\ComfyUI\custom_nodes\ComfyUI_Data_Manager\test_full_page.png", full_page=True)
            print("📸 完整页面截图已保存")

            # 打印错误日志
            print("\n📋 控制台日志 (错误/警告):")
            for log in console_logs:
                if 'error' in log.lower() or 'warn' in log.lower() or 'dm-' in log.lower():
                    print(f"  {log}")

            print("\n✅ 测试完成")

        except Exception as e:
            print(f"❌ 错误: {e}")
            import traceback
            traceback.print_exc()
        finally:
            browser.close()

if __name__ == "__main__":
    test_frontend()
