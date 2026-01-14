# -*- coding: utf-8 -*-
"""测试端口隐藏功能"""

from playwright.sync_api import sync_playwright
import time


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=500)
        page = browser.new_page()

        page.goto("http://127.0.0.1:8188")
        page.wait_for_load_state("networkidle", timeout=30000)
        time.sleep(2)

        # 添加三个节点
        page.evaluate(
            """() => {
            const core = window.LiteGraph.createNode('DataManagerCore');
            core.pos = [100, 100];
            window.app.graph.add(core);

            const inputCfg = window.LiteGraph.createNode('InputPathConfig');
            inputCfg.pos = [400, 100];
            window.app.graph.add(inputCfg);

            const outputCfg = window.LiteGraph.createNode('OutputPathConfig');
            outputCfg.pos = [400, 300];
            window.app.graph.add(outputCfg);
        }"""
        )

        time.sleep(3)

        # 检查节点的 DOM 结构
        check = page.evaluate(
            """() => {
            const nodes = window.app.graph._nodes;
            const results = [];

            nodes.forEach(node => {
                if (['DataManagerCore', 'InputPathConfig', 'OutputPathConfig'].includes(node.type)) {
                    const el = node?.nodeElement || node?.element;

                    // 检查所有 input/textarea 元素
                    const inputs = el ? Array.from(el.querySelectorAll('input, textarea')).map(i => ({
                        tag: i.tagName,
                        type: i.type,
                        display: window.getComputedStyle(i).display,
                        visibility: window.getComputedStyle(i).visibility
                    })) : [];

                    results.push({
                        type: node.type,
                        title: node.title,
                        hasElement: !!el,
                        inputCount: inputs.length,
                        inputs: inputs
                    });
                }
            });

            return results;
        }"""
        )

        print("\n=== 节点端口检查 ===")
        all_hidden = True
        for r in check:
            print(f'\n节点: {r["title"]} ({r["type"]})')
            print(f'  - 有 DOM 元素: {r["hasElement"]}')
            print(f'  - input/textarea 数量: {r["inputCount"]}')

            for inp in r.get("inputs", []):
                is_hidden = inp["display"] == "none" or inp["visibility"] == "hidden"
                print(
                    f'    - {inp["tag"]} (type={inp["type"]}): display={inp["display"]}, visibility={inp["visibility"]}, 隐藏={is_hidden}'
                )
                if not is_hidden:
                    all_hidden = False

        print(f'\n=== 结果: {"所有端口已隐藏" if all_hidden else "存在未隐藏的端口"} ===')

        # 截图
        page.screenshot(
            path=r"C:\Users\Administrator\Documents\ai\ComfyUI\custom_nodes\ComfyUI_Data_Manager\tests\nodes_final.png"
        )

        time.sleep(2)
        browser.close()

        return all_hidden


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
