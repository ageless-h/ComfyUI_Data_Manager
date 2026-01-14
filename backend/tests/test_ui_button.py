# -*- coding: utf-8 -*-
"""ComfyUI Data Manager UI 按钮测试

测试新的按钮实现
"""

import time
from playwright.sync_api import sync_playwright


def main():
    print("\n" + "="*60)
    print("ComfyUI Data Manager UI 按钮测试")
    print("="*60)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=300)
        page = browser.new_page()

        # 收集控制台日志
        console_logs = []
        errors = []

        def on_console(msg):
            console_logs.append({
                "type": msg.type,
                "text": msg.text
            })
            if msg.type == "error":
                errors.append(msg.text)

        page.on("console", on_console)

        try:
            print("\n[步骤 1] 导航到 ComfyUI")
            page.goto("http://127.0.0.1:8188")
            page.wait_for_load_state("networkidle", timeout=30000)
            time.sleep(2)

            # 检查 DataManager 扩展加载
            dm_logs = [log for log in console_logs if "DataManager" in log["text"]]
            if dm_logs:
                print(f"  ✓ 扩展日志:")
                for log in dm_logs[:3]:
                    print(f"    [{log['type']}] {log['text']}")

            print("\n[步骤 2] 添加 DataManagerCore 节点")
            result = page.evaluate("""() => {
                try {
                    const node = window.LiteGraph.createNode('DataManagerCore');
                    if (node) {
                        node.pos = [100, 100];
                        window.app.graph.add(node);
                        return { success: true, nodeId: node.id, title: node.title };
                    }
                    return { success: false, error: 'createNode returned null' };
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }""")

            print(f"  结果: {result}")
            if not result.get("success"):
                print(f"  ✗ 节点添加失败")
                browser.close()
                return False

            time.sleep(1)
            print(f"  ✓ 节点已添加 (ID: {result['nodeId']})")

            # 截图
            page.screenshot(path=r"C:\Users\Administrator\Documents\ai\ComfyUI\custom_nodes\ComfyUI_Data_Manager\tests\20_node_with_button.png")

            print("\n[步骤 3] 检查节点上的按钮")
            button_check = page.evaluate("""() => {
                const nodes = window.app.graph._nodes;
                const dmNode = nodes.find(n => n.type === 'DataManagerCore');
                if (!dmNode) {
                    return { exists: false };
                }

                // 查找按钮元素
                const nodeElement = dmNode?.nodeElement;
                if (!nodeElement) {
                    return { exists: true, hasElement: false };
                }

                const buttons = nodeElement.querySelectorAll('button');
                return {
                    exists: true,
                    hasElement: true,
                    buttonCount: buttons.length,
                    buttonHTMLs: Array.from(buttons).map(b => ({
                        text: b.textContent?.trim(),
                        class: b.className
                    }))
                };
            }""")

            print(f"  按钮状态: {button_check}")

            if button_check.get("buttonCount", 0) > 0:
                print(f"  ✓ 找到 {button_check['buttonCount']} 个按钮")
                for btn in button_check.get("buttonHTMLs", []):
                    print(f"    - '{btn.get('text')}' (class: {btn.get('class')})")
            else:
                print(f"  ✗ 未找到按钮")

            print("\n[步骤 4] 通过全局接口打开文件管理器")
            open_result = page.evaluate("""() => {
                try {
                    if (window.DataManager && window.DataManager.open) {
                        window.DataManager.open();
                        return { success: true };
                    }
                    return { success: false, error: 'window.DataManager.open not found' };
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }""")

            print(f"  打开结果: {open_result}")

            time.sleep(2)

            print("\n[步骤 5] 检查文件管理器窗口")
            window_check = page.evaluate("""() => {
                const dmWindow = document.getElementById('dm-file-manager');
                if (!dmWindow) {
                    return { exists: false };
                }

                // 检查文件列表
                const fileItems = dmWindow.querySelectorAll('.dm-file-item');
                const pathInput = document.getElementById('dm-path-input');

                return {
                    exists: true,
                    visible: dmWindow.offsetParent !== null,
                    fileCount: fileItems.length,
                    currentPath: pathInput ? pathInput.value : null
                };
            }""")

            print(f"  窗口状态: {window_check}")

            if window_check.get("exists"):
                print(f"  ✓ 文件管理器窗口已打开")
                print(f"  - 可见: {window_check.get('visible')}")
                print(f"  - 文件数量: {window_check.get('fileCount')}")
                print(f"  - 当前路径: {window_check.get('currentPath')}")

                # 截图文件管理器
                page.screenshot(path=r"C:\Users\Administrator\Documents\ai\ComfyUI\custom_nodes\ComfyUI_Data_Manager\tests\21_file_manager_open.png", full_page=True)

                # 检查是否包含真实文件
                if window_check.get("fileCount", 0) > 0:
                    print(f"\n  ✓ 文件管理器显示文件内容!")
                else:
                    print(f"\n  ⚠ 文件管理器未显示文件")

            else:
                print(f"  ✗ 文件管理器窗口未打开")

            print("\n[步骤 6] 检查控制台错误")
            if errors:
                print(f"  ⚠ 发现 {len(errors)} 个错误:")
                for err in errors[:3]:
                    print(f"    - {err[:100]}")
            else:
                print(f"  ✓ 无控制台错误")

            time.sleep(2)
            browser.close()

            # 判断测试是否通过
            if window_check.get("exists") and window_check.get("fileCount", 0) > 0:
                print("\n" + "="*60)
                print("✓ UI 测试通过!")
                print("="*60)
                return True
            else:
                print("\n" + "="*60)
                print("⚠ UI 测试未完全通过")
                print("="*60)
                return False

        except Exception as e:
            print(f"\n✗ UI 测试失败: {e}")
            browser.close()
            return False


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
