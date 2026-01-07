# -*- coding: utf-8 -*-
"""简单测试 - 检查扩展是否正确加载"""
import sys
sys.path.insert(0, r"C:\Users\Administrator\.claude\skills\webapp-testing")

from playwright.sync_api import sync_playwright

def test_simple():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)  # 使用可见模式
        page = browser.new_page()

        try:
            print("访问 ComfyUI...")
            page.goto("http://127.0.0.1:8188", timeout=30000)
            page.wait_for_load_state("networkidle", timeout=30000)
            print("页面加载完成")

            # 截图
            page.screenshot(path="C:/Users/Administrator/Documents/ai/ComfyUI/custom_nodes/ComfyUI_Data_Manager/test_screenshot1.png")
            print("截图已保存")

            # 检查扩展
            result = page.evaluate("""
                () => {
                    return {
                        FileManagerState: typeof window.FileManagerState,
                        openFileManager: typeof window.openFileManager,
                        documentIds: Array.from(document.querySelectorAll('[id]')).map(e => e.id).filter(id => id.includes('dm')).slice(0, 5),
                        documentClasses: Array.from(document.querySelectorAll('[class]')).map(e => e.className).filter(c => c.includes('dm')).slice(0, 5)
                    };
                }
            """)
            print("扩展状态:", result)

            input("\n请在工作区添加 DataManagerCore 节点并截图后按 Enter...")
            page.screenshot(path="C:/Users/Administrator/Documents/ai/ComfyUI/custom_nodes/ComfyUI_Data_Manager/test_screenshot2.png")
            print("截图已保存")

            print("测试完成")

        except Exception as e:
            print(f"错误: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    test_simple()
