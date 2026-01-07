# -*- coding: utf-8 -*-
"""测试前端文档预览功能 v2"""
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

            # 等待扩展加载
            page.wait_for_timeout(3000)

            # 检查扩展 JS 是否加载
            print("\n🔍 检查扩展...")
            has_extension = page.evaluate("""
                () => {
                    return {
                        hasFileManagerState: typeof window.FileManagerState !== 'undefined',
                        hasDmElements: document.querySelector('[id*="dm-"]') !== null,
                        hasDmClass: document.querySelector('[class*="dm-"]') !== null,
                        extensionLoaded: typeof window.app !== 'undefined' && typeof window.app.extensionManager !== 'undefined'
                    };
                }
            """)
            print(f"扩展状态: {has_extension}")

            # 检查 extension.js 是否加载
            scripts = page.evaluate("""
                () => {
                    const scripts = document.querySelectorAll('script');
                    return Array.from(scripts).map(s => s.src).filter(s => s.includes('extension') || s.includes('dm-'));
                }
            """)
            print(f"加载的扩展脚本: {scripts}")

            # 查找 dm- 前缀的元素
            dm_elements = page.evaluate("""
                () => {
                    const byId = document.querySelectorAll('[id*="dm-"]');
                    const byClass = document.querySelectorAll('[class*="dm-"]');
                    return {
                        byId: Array.from(byId).map(e => e.id),
                        byClass: Array.from(byClass).map(e => e.className)
                    };
                }
            """)
            print(f"dm- 元素: {dm_elements}")

            # 完整截图
            page.screenshot(path=r"C:\Users\Administrator\Documents\ai\ComfyUI\custom_nodes\ComfyUI_Data_Manager\test_full_page2.png", full_page=True)
            print("📸 截图已保存")

            # 打印控制台日志
            print("\n📋 控制台日志 (扩展相关):")
            for log in console_logs:
                if 'dm' in log.lower() or 'extension' in log.lower() or 'error' in log.lower():
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
