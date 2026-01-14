# -*- coding: utf-8 -*-
"""ComfyUI Data Manager 文件保存测试

测试 InputPathConfig 节点的文件保存功能
"""

import json
import time
import os
from playwright.sync_api import sync_playwright


def main():
    print("\n" + "="*60)
    print("ComfyUI Data Manager 文件保存测试")
    print("="*60)

    # 测试路径设置
    test_output_path = r"C:\Users\Administrator\Downloads\test_output.png"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=500)
        page = browser.new_page()

        # 收集控制台日志
        errors = []

        def on_console(msg):
            if msg.type == "error":
                errors.append(msg.text)

        page.on("console", on_console)

        try:
            print("\n[步骤 1] 导航到 ComfyUI")
            page.goto("http://127.0.0.1:8188")
            page.wait_for_load_state("networkidle", timeout=30000)
            time.sleep(2)

            print("\n[步骤 2] 添加 LoadImage 和 InputPathConfig 节点")
            result = page.evaluate("""() => {
                try {
                    // 添加 LoadImage
                    const loadImage = window.LiteGraph.createNode('LoadImage');
                    loadImage.pos = [100, 100];
                    window.app.graph.add(loadImage);

                    // 添加 InputPathConfig
                    const inputPathConfig = window.LiteGraph.createNode('InputPathConfig');
                    inputPathConfig.pos = [400, 100];
                    window.app.graph.add(inputPathConfig);

                    // 连接节点
                    const imageOutput = loadImage.outputs?.find(o => o.name === 'IMAGE');
                    const fileInput = inputPathConfig.inputs?.find(i => i.name === 'file_input');
                    if (imageOutput && fileInput) {
                        loadImage.connect(imageOutput.index, inputPathConfig, fileInput.index);
                    }

                    return {
                        success: true,
                        loadImageId: loadImage.id,
                        inputPathConfigId: inputPathConfig.id
                    };
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }""")

            if not result.get("success"):
                print(f"  ✗ 节点添加失败: {result.get('error')}")
                browser.close()
                return False

            print(f"  ✓ 节点已添加并连接")

            print("\n[步骤 3] 设置 LoadImage 的图像")
            set_image_result = page.evaluate("""() => {
                try {
                    const nodes = window.app.graph._nodes;
                    const loadImage = nodes.find(n => n.type === 'LoadImage');
                    const imageWidget = loadImage.widgets?.find(w => w.name === 'image');

                    if (!imageWidget) {
                        return { success: false, error: 'image widget not found' };
                    }

                    // 获取可用图像
                    const options = imageWidget.options?.values || [];

                    if (options.length > 0) {
                        // 选择第一个图像
                        imageWidget.value = options[0];
                        if (imageWidget.callback) {
                            imageWidget.callback(options[0]);
                        }
                        return {
                            success: true,
                            selectedImage: options[0],
                            totalImages: options.length
                        };
                    } else {
                        return { success: false, error: 'No images available', options };
                    }
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }""")

            print(f"  设置结果: {json.dumps(set_image_result, indent=2, ensure_ascii=False)}")

            if not set_image_result.get("success"):
                print(f"  ✗ 无法设置图像: {set_image_result.get('error')}")
                browser.close()
                return False

            print(f"  ✓ 已选择图像: {set_image_result.get('selectedImage')}")

            print("\n[步骤 4] 设置 InputPathConfig 的 target_path")
            set_path_result = page.evaluate(f"""() => {{
                try {{
                    const nodes = window.app.graph._nodes;
                    const inputPathConfig = nodes.find(n => n.type === 'InputPathConfig');
                    const targetPathWidget = inputPathConfig.widgets?.find(w => w.name === 'target_path');

                    if (targetPathWidget) {{
                        targetPathWidget.value = '{test_output_path}';
                        return {{ success: true, path: '{test_output_path}' }};
                    }} else {{
                        return {{ success: false, error: 'target_path widget not found' }};
                    }}
                }} catch (e) {{
                    return {{ success: false, error: e.message }};
                }}
            }}""")

            if set_path_result.get("success"):
                print(f"  ✓ target_path 已设置为: {test_output_path}")
            else:
                print(f"  ✗ 路径设置失败: {set_path_result.get('error')}")

            # 截图
            page.screenshot(path=r"C:\\Users\\Administrator\\Documents\\ai\\ComfyUI\\custom_nodes\\ComfyUI_Data_Manager\\tests\\40_before_execute.png")

            print("\n[步骤 5] 执行工作流")
            execute_result = page.evaluate("""() => {
                try {
                    window.app.queuePrompt(0, 1);
                    return { success: true };
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }""")

            if execute_result.get("success"):
                print(f"  ✓ 工作流已开始执行")
            else:
                print(f"  ✗ 执行失败: {execute_result.get('error')}")

            # 等待执行完成
            print("\n[步骤 6] 等待执行完成（10秒）")
            time.sleep(10)

            # 截图
            page.screenshot(path=r"C:\\Users\\Administrator\\Documents\\ai\\ComfyUI\\custom_nodes\\ComfyUI_Data_Manager\\tests\\41_after_execute.png")

            print("\n[步骤 7] 检查文件是否已保存")
            if os.path.exists(test_output_path):
                file_size = os.path.getsize(test_output_path)
                print(f"  ✓ 文件已保存: {test_output_path}")
                print(f"    文件大小: {file_size} 字节")
            else:
                print(f"  ✗ 文件未保存: {test_output_path}")

            # 检查控制台错误
            if errors:
                print(f"\n[步骤 8] 控制台错误:")
                for err in errors[:5]:
                    print(f"    - {err[:200]}")

            time.sleep(2)
            browser.close()

            # 判断测试是否通过
            if os.path.exists(test_output_path):
                print("\n" + "="*60)
                print("✓ 文件保存测试通过!")
                print("="*60)
                return True
            else:
                print("\n" + "="*60)
                print("⚠ 文件未保存")
                print("="*60)
                return False

        except Exception as e:
            print(f"\n✗ 测试失败: {e}")
            import traceback
            traceback.print_exc()
            browser.close()
            return False


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
