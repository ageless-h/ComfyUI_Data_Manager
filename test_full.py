# -*- coding: utf-8 -*-
"""完整测试前端文档预览功能"""
import sys
sys.path.insert(0, r"C:\Users\Administrator\.claude\skills\webapp-testing")

from playwright.sync_api import sync_playwright

def test_full():
    """完整测试"""
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
            page.wait_for_timeout(2000)

            # 查找添加节点按钮
            print("\n🔍 查找添加节点按钮...")
            add_btn = page.locator("button:has-text('Add Node'), [title*='Add'], [aria-label*='Add']").first
            if add_btn.count() > 0:
                print("点击添加节点按钮...")
                add_btn.click()
                page.wait_for_timeout(1000)

                # 搜索 DataManagerCore
                print("搜索 DataManagerCore...")
                search_box = page.locator("input[placeholder*='Search'], input[placeholder*='search']").first
                if search_box.count() > 0:
                    search_box.fill("DataManagerCore")
                    page.wait_for_timeout(1000)

                    # 查找搜索结果中的节点
                    node_items = page.locator("[class*='node'], [class*='item']:has-text('DataManagerCore')").all()
                    print(f"找到 {len(node_items)} 个相关节点")

            # 查找文件管理器按钮
            print("\n🔍 查找文件管理器按钮...")
            open_btn = page.locator("button:has-text('文件管理器'), button:has-text('打开文件管理器')").first
            if open_btn.count() > 0:
                print("点击打开文件管理器...")
                open_btn.click()
                page.wait_for_timeout(2000)

                # 检查是否打开
                has_file_manager = page.evaluate("""
                    () => {
                        return {
                            hasPathInput: document.querySelector('#dm-path-input') !== null,
                            hasFileList: document.querySelector('[class*="file-list"]') !== null,
                            hasPreview: document.querySelector('[id*="preview"]') !== null
                        };
                    }
                """)
                print(f"文件管理器状态: {has_file_manager}")

                # 截图
                page.screenshot(path=r"C:\Users\Administrator\Documents\ai\ComfyUI\custom_nodes\ComfyUI_Data_Manager\test_filemanager.png", full_page=True)
                print("📸 文件管理器截图已保存")

            # 检查 dm- 元素
            print("\n🔍 检查 dm- 元素...")
            dm_elements = page.evaluate("""
                () => {
                    const byId = document.querySelectorAll('[id*="dm-"]');
                    const byClass = document.querySelectorAll('[class*="dm-"]');
                    return {
                        byId: Array.from(byId).map(e => e.id),
                        byClass: Array.from(byClass).map(e => e.className.substring(0, 50))
                    };
                }
            """)
            print(f"dm- 元素: {dm_elements}")

            # 完整截图
            page.screenshot(path=r"C:\Users\Administrator\Documents\ai\ComfyUI\custom_nodes\ComfyUI_Data_Manager\test_full_final.png", full_page=True)
            print("📸 完整截图已保存")

            # 打印控制台日志
            print("\n📋 控制台日志 (扩展相关):")
            for log in console_logs:
                if 'dm' in log.lower() or 'extension' in log.lower() or 'file' in log.lower():
                    print(f"  {log}")

            print("\n✅ 测试完成")

        except Exception as e:
            print(f"❌ 错误: {e}")
            import traceback
            traceback.print_exc()
        finally:
            browser.close()

if __name__ == "__main__":
    test_full()
