# -*- coding: utf-8 -*-
"""测试 DOM 中的 widgets"""

from playwright.sync_api import sync_playwright
import time

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=500)
        page = browser.new_page()

        page.goto('http://127.0.0.1:8188')
        page.wait_for_load_state('networkidle', timeout=30000)
        time.sleep(3)

        # 添加节点
        page.evaluate("""() => {
            const core = window.LiteGraph.createNode('DataManagerCore');
            core.pos = [100, 100];
            window.app.graph.add(core);
        }""")

        time.sleep(4)

        # 检查 DOM 中的 widgets
        dom_check = page.evaluate(r'''() => {
            const node = window.app.graph._nodes.find(n => n.type === 'DataManagerCore');
            if (!node) return { error: 'Node not found' };

            // 尝试多种方式获取节点元素
            const nodeEl = node.nodeElement || node.element || document.querySelector('.comfy-node:last-child');

            if (!nodeEl) return { error: 'Node element not found' };

            const widgets = nodeEl.querySelectorAll('.widget');
            return {
                nodeTitle: nodeEl.querySelector('.title')?.textContent,
                widgetCount: widgets.length,
                widgets: Array.from(widgets).map(w => ({
                    tagName: w.tagName,
                    className: w.className,
                    display: window.getComputedStyle(w).display,
                    innerHTML: w.innerHTML.substring(0, 100)
                }))
            };
        }''')

        print(f'DOM 检查结果: {dom_check}')

        # 截图
        page.screenshot(path=r'C:\Users\Administrator\Documents\ai\ComfyUI\custom_nodes\ComfyUI_Data_Manager\tests\dom_check.png')
        print('已保存截图')

        time.sleep(2)
        browser.close()

if __name__ == "__main__":
    main()
