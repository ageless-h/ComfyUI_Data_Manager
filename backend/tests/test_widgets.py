# -*- coding: utf-8 -*-
"""测试 widgets 隐藏和 combo 显示"""

from playwright.sync_api import sync_playwright
import time

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=500)
        page = browser.new_page()

        page.goto('http://127.0.0.1:8188')
        page.wait_for_load_state('networkidle', timeout=30000)
        time.sleep(3)

        # 添加三个节点
        page.evaluate("""() => {
            window.LiteGraph.createNode('DataManagerCore').pos = [50, 100];
            window.LiteGraph.createNode('InputPathConfig').pos = [400, 100];
            window.LiteGraph.createNode('OutputPathConfig').pos = [400, 300];
            window.app.graph._nodes.forEach(n => window.app.graph.add(n));
        }""")

        time.sleep(4)

        # 检查 widgets 状态
        widgets = page.evaluate("""() => {
            const nodes = window.app.graph._nodes;
            const result = [];

            nodes.forEach(node => {
                if (['DataManagerCore', 'InputPathConfig', 'OutputPathConfig'].includes(node.type)) {
                    const nodeWidgets = (node.widgets || []).map(w => ({
                        name: w.name,
                        type: w.type,
                        hasElement: !!w.element,
                        display: w.element ? window.getComputedStyle(w.element).display : 'N/A',
                        options: w.options?.values || w.options || []
                    }));

                    result.push({
                        type: node.type,
                        title: node.title,
                        widgets: nodeWidgets
                    });
                }
            });

            return result;
        }""")

        print('\n=== Widgets 状态 ===')
        all_correct = True
        for node in widgets:
            print(f'\n{node["title"]} ({node["type"]}):')
            for w in node['widgets']:
                hidden = w['display'] == 'none'
                is_combo = len(w.get('options', [])) > 0
                print(f'  - {w["name"]} (type={w["type"]}) hidden={hidden} combo={is_combo} display={w["display"]}')
                if w.get('options'):
                    print(f'    选项: {w["options"]}')

                # 检查是否符合预期
                if w['name'] == 'input' and node['type'] in ['DataManagerCore', 'OutputPathConfig']:
                    if not hidden:
                        print(f'    ERROR: input widget 应该被隐藏!')
                        all_correct = False
                if w['name'] == 'file_input' and node['type'] == 'InputPathConfig':
                    if not hidden:
                        print(f'    ERROR: file_input widget 应该被隐藏!')
                        all_correct = False
                if w['name'] == 'file_type':
                    if not is_combo:
                        print(f'    ERROR: file_type 应该是 combo (下拉框)!')
                        all_correct = False

        # 检查控制台日志
        logs = page.evaluate("""() => {
            const logs = [];
            const originalLog = console.log;
            console.log = (...args) => {
                logs.push(args.join(' '));
                originalLog.apply(console, args);
            };
            return logs;
        }""")

        page.screenshot(path=r'C:\Users\Administrator\Documents\ai\ComfyUI\custom_nodes\ComfyUI_Data_Manager\tests\widgets_check.png')
        print('\n已保存截图 widgets_check.png')

        time.sleep(2)
        browser.close()

        return all_correct

if __name__ == "__main__":
    success = main()
    print(f'\n=== 结果: {"所有测试通过" if success else "存在失败项"} ===')
    exit(0 if success else 1)
