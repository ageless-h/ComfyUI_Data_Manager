# -*- coding: utf-8 -*-
"""调试脚本 - 检查节点加载状态"""

import json
import time
from playwright.sync_api import sync_playwright


def main():
    print("\n" + "="*60)
    print("节点加载状态调试")
    print("="*60)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=500)
        page = browser.new_page()

        try:
            print("\n[步骤 1] 导航到 ComfyUI")
            page.goto("http://127.0.0.1:8188")
            page.wait_for_load_state("networkidle", timeout=30000)
            time.sleep(2)

            print("\n[步骤 2] 检查 InputPathConfig 节点是否可用")
            check_result = page.evaluate("""() => {
                try {
                    // 检查节点类型是否注册
                    const hasInputPathConfig = typeof window.LiteGraph !== 'undefined' &&
                                               window.LiteGraph.registered_node_types &&
                                               'InputPathConfig' in window.LiteGraph.registered_node_types;

                    // 尝试创建节点
                    let node = null;
                    let createError = null;

                    try {
                        node = window.LiteGraph.createNode('InputPathConfig');
                    } catch (e) {
                        createError = e.message;
                    }

                    if (node) {
                        // 检查节点的 inputs 和 widgets
                        return {
                            success: true,
                            hasInputPathConfig,
                            nodeCreated: true,
                            inputs: node.inputs?.map(i => ({ name: i.name, type: i.type })),
                            widgets: node.widgets?.map(w => ({ name: w.name, type: w.type, value: w.value })),
                            outputs: node.outputs?.map(o => ({ name: o.name, type: o.type }))
                        };
                    } else {
                        return {
                            success: false,
                            hasInputPathConfig,
                            nodeCreated: false,
                            createError: createError
                        };
                    }
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }""")

            print(f"  检查结果: {json.dumps(check_result, indent=2, ensure_ascii=False)}")

            print("\n[步骤 3] 检查控制台错误")
            console_errors = page.evaluate("""() => {
                // 收集所有控制台错误
                const errors = [];

                // 检查 DataManager 相关的日志
                const hasDataManagerLogs = window.dataManagerLogs || [];

                return {
                    hasDataManagerLogs: hasDataManagerLogs.length > 0,
                    logs: hasDataManagerLogs.slice(-10)
                };
            }""")

            print(f"  DataManager 日志: {json.dumps(console_errors, indent=2, ensure_ascii=False)}")

            print("\n[步骤 4] 添加测试节点并执行")
            execute_test = page.evaluate("""() => {
                try {
                    // 创建 LoadImage
                    const loadImage = window.LiteGraph.createNode('LoadImage');
                    loadImage.pos = [100, 100];
                    window.app.graph.add(loadImage);

                    // 设置图像（选择第一个可用图像）
                    const imageWidget = loadImage.widgets?.find(w => w.name === 'image');
                    let selectedImage = null;
                    if (imageWidget && imageWidget.options?.values?.length > 0) {
                        selectedImage = imageWidget.options.values[0];
                        imageWidget.value = selectedImage;
                        if (imageWidget.callback) {
                            imageWidget.callback(selectedImage);
                        }
                    }

                    // 创建 InputPathConfig
                    const inputPathConfig = window.LiteGraph.createNode('InputPathConfig');
                    inputPathConfig.pos = [400, 100];
                    window.app.graph.add(inputPathConfig);

                    // 设置 target_path
                    const targetPathWidget = inputPathConfig.widgets?.find(w => w.name === 'target_path');
                    if (targetPathWidget) {
                        targetPathWidget.value = 'C:\\\\Users\\\\Administrator\\\\Downloads\\\\test_debug.png';
                    }

                    // 连接节点
                    const imageOutput = loadImage.outputs?.find(o => o.name === 'IMAGE');
                    const fileInput = inputPathConfig.inputs?.find(i => i.name === 'file_input');
                    if (imageOutput && fileInput) {
                        loadImage.connect(imageOutput.index, inputPathConfig, fileInput.index);
                    }

                    return {
                        success: true,
                        selectedImage,
                        targetPath: targetPathWidget?.value
                    };
                } catch (e) {
                    return { success: false, error: e.message, stack: e.stack };
                }
            }""")

            print(f"  执行测试: {json.dumps(execute_test, indent=2, ensure_ascii=False)}")

            # 截图
            page.screenshot(path=r"C:\\Users\\Administrator\\Documents\\ai\\ComfyUI\\custom_nodes\\ComfyUI_Data_Manager\\tests\\debug_nodes.png")

            print("\n[步骤 5] 执行工作流")
            page.evaluate("""() => {
                window.app.queuePrompt(0, 1);
            }""")

            print("  等待执行完成（10秒）...")
            time.sleep(10)

            # 截图
            page.screenshot(path=r"C:\\Users\\Administrator\\Documents\\ai\\ComfyUI\\custom_nodes\\ComfyUI_Data_Manager\\tests\\debug_after_execute.png")

            time.sleep(2)
            browser.close()

        except Exception as e:
            print(f"\n✗ 调试失败: {e}")
            import traceback
            traceback.print_exc()
            browser.close()


if __name__ == "__main__":
    main()
