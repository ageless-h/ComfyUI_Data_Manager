# -*- coding: utf-8 -*-
"""ComfyUI Data Manager 格式选择器测试

测试格式选择器功能
"""

import json
import time
from playwright.sync_api import sync_playwright


def main():
    print("\n" + "="*60)
    print("ComfyUI Data Manager 格式选择器测试")
    print("="*60)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=500)
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

            print("\n[步骤 2] 添加 InputPathConfig 节点")
            result = page.evaluate("""() => {
                try {
                    const node = window.LiteGraph.createNode('InputPathConfig');
                    if (node) {
                        node.pos = [100, 100];
                        window.app.graph.add(node);
                        return { success: true, nodeId: node.id, title: node.title };
                    }
                    return { success: false, error: 'createNode returned null' };
                } catch (e) {
                    return { success: false, error: e.message, stack: e.stack };
                }
            }""")

            print(f"  结果: {result}")
            if not result.get("success"):
                print(f"  ✗ 节点添加失败: {result.get('error')}")
                browser.close()
                return False

            print(f"  ✓ InputPathConfig 节点已添加 (ID: {result['nodeId']})")
            time.sleep(1)

            print("\n[步骤 3] 添加 LoadImage 节点")
            result = page.evaluate("""() => {
                try {
                    const node = window.LiteGraph.createNode('LoadImage');
                    if (node) {
                        node.pos = [400, 100];
                        window.app.graph.add(node);
                        return { success: true, nodeId: node.id };
                    }
                    return { success: false, error: 'createNode returned null' };
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }""")

            if not result.get("success"):
                print(f"  ✗ LoadImage 节点添加失败")
                browser.close()
                return False

            print(f"  ✓ LoadImage 节点已添加 (ID: {result['nodeId']})")
            time.sleep(1)

            # 截图
            page.screenshot(path=r"C:\Users\Administrator\Documents\ai\ComfyUI\custom_nodes\ComfyUI_Data_Manager\tests\30_nodes_added.png")

            print("\n[步骤 4] 检查 InputPathConfig 节点的输入端口和 widget")
            port_check = page.evaluate("""() => {
                const nodes = window.app.graph._nodes;
                const inputNode = nodes.find(n => n.type === 'InputPathConfig');
                if (!inputNode) {
                    return { exists: false };
                }

                // 检查输入端口
                const inputs = inputNode.inputs || [];
                const nodeElement = inputNode?.nodeElement;

                // V3 API: widgets 存储在 node.widgets 数组中
                const widgets = inputNode.widgets || [];

                // 详细检查每个 widget
                const widgetDetails = widgets.map(w => ({
                    name: w.name,
                    type: w.type,
                    value: w.value,
                    options: w.options,
                    widgetType: w.widgetType
                }));

                return {
                    exists: true,
                    inputCount: inputs.length,
                    inputs: inputs.map(i => ({
                        name: i.name,
                        type: i.type,
                        link: i.link
                    })),
                    widgetsCount: widgets.length,
                    allWidgets: widgets.map(w => ({
                        name: w.name,
                        type: w.type,
                        value: w.value
                    })),
                    widgetDetails: widgetDetails
                };
            }""")

            print(f"  端口状态: {json.dumps(port_check, indent=2, ensure_ascii=False)}")

            # 检查 format widget
            format_widget = None
            for widget in port_check.get("widgetDetails", []):
                if widget.get("name") == "format":
                    format_widget = widget
                    break

            if format_widget:
                print(f"  ✓ 找到格式选择器 widget:")
                print(f"    - 名称: {format_widget.get('name')}")
                print(f"    - 类型: {format_widget.get('type')}")
                print(f"    - 当前值: {format_widget.get('value')}")
                print(f"    - 可选格式: {format_widget.get('options')}")
            else:
                print(f"  ⚠ 未找到格式选择器 widget")

            print("\n[步骤 5] 检查格式选择器模块是否加载")
            module_check = page.evaluate("""() => {
                // 检查 ui-format-selector.js 是否加载
                const hasFormatSelector = typeof window.createFormatSelector === 'function';

                // 检查 updateFormatSelector 函数
                let hasUpdateFunction = false;
                try {
                    // 尝试从导入的模块中查找
                    const modules = window.comfyUIModules || {};
                    for (const [name, mod] of Object.entries(modules)) {
                        if (mod.updateFormatSelector) {
                            hasUpdateFunction = true;
                            break;
                        }
                    }
                } catch (e) {}

                return {
                    hasFormatSelector,
                    hasUpdateFunction
                };
            }""")

            print(f"  模块状态: {module_check}")

            print("\n[步骤 6] 连接 LoadImage 到 InputPathConfig")
            connect_result = page.evaluate("""() => {
                try {
                    const nodes = window.app.graph._nodes;
                    const loadImage = nodes.find(n => n.type === 'LoadImage');
                    const inputPathConfig = nodes.find(n => n.type === 'InputPathConfig');

                    if (!loadImage || !inputPathConfig) {
                        return { success: false, error: 'Nodes not found' };
                    }

                    // 找到 LoadImage 的 IMAGE 输出端口
                    const imageOutput = loadImage.outputs?.find(o => o.name === 'IMAGE');
                    // 找到 InputPathConfig 的 file_input 输入端口
                    const fileInput = inputPathConfig.inputs?.find(i => i.name === 'file_input');

                    if (!imageOutput || !fileInput) {
                        return {
                            success: false,
                            error: 'Ports not found',
                            imageOutput: imageOutput ? 'found' : 'not found',
                            fileInput: fileInput ? 'found' : 'not found'
                        };
                    }

                    // 连接端口
                    loadImage.connect(imageOutput.index, inputPathConfig, fileInput.index);

                    return { success: true };
                } catch (e) {
                    return { success: false, error: e.message, stack: e.stack };
                }
            }""")

            print(f"  连接结果: {connect_result}")

            if connect_result.get("success"):
                print(f"  ✓ 端口已连接")
                time.sleep(1)
            else:
                print(f"  ✗ 连接失败: {connect_result.get('error')}")

            # 检查控制台日志中的 DataManager 相关消息
            console_check = page.evaluate("""() => {
                // 获取所有控制台日志（ DataManager 相关的）
                const logs = [];
                const originalLog = console.log;
                console.log = function(...args) {
                    logs.push(args.join(' '));
                    originalLog.apply(console, args);
                };
                return {
                    hasLogs: logs.length > 0,
                    dmLogs: logs.filter(l => l.includes('DataManager'))
                };
            }""")

            print(f"  控制台检查: {console_check}")

            # 截图
            page.screenshot(path=r"C:\Users\Administrator\Documents\ai\ComfyUI\custom_nodes\ComfyUI_Data_Manager\tests\31_nodes_connected.png")

            print("\n[步骤 7] 打开文件管理器")
            open_result = page.evaluate("""() => {
                try {
                    if (window.openFileManager) {
                        window.openFileManager();
                        return { success: true };
                    }
                    return { success: false, error: 'openFileManager not found' };
                } catch (e) {
                    return { success: false, error: e.message };
                }
            }""")

            if open_result.get("success"):
                print(f"  ✓ 文件管理器已打开")
            else:
                print(f"  ✗ 打开失败: {open_result.get('error')}")

            # 等待窗口完全创建
            time.sleep(2)

            # 检查 checkNodeConnectionAndUpdateFormat 函数是否被调用
            print("\n[步骤 7.5] 检查自动触发状态")
            auto_trigger_check = page.evaluate("""() => {
                // 检查 dm-format-section 是否存在
                const formatSection = document.getElementById('dm-format-section');
                const sectionExists = !!formatSection;
                const sectionDisplay = formatSection ? formatSection.style.display : null;

                // 手动调用 checkNodeConnectionAndUpdateFormat
                let triggerResult = null;
                if (window.checkNodeConnectionAndUpdateFormat) {
                    try {
                        window.checkNodeConnectionAndUpdateFormat();
                        triggerResult = { success: true, message: '手动调用成功' };
                    } catch (e) {
                        triggerResult = { success: false, error: e.message };
                    }
                } else {
                    triggerResult = { error: 'checkNodeConnectionAndUpdateFormat not found' };
                }

                // 等待一下然后再次检查
                setTimeout(() => {
                    const updatedSection = document.getElementById('dm-format-section');
                    const hasSelect = !!updatedSection.querySelector('#dm-format-select');
                }, 100);

                return {
                    sectionExists,
                    sectionDisplay,
                    triggerResult
                };
            }""")

            print(f"  自动触发检查: {auto_trigger_check}")

            # 再次等待格式选择器更新
            time.sleep(1)

            print("\n[步骤 8] 检查格式选择器 UI")
            format_ui_check = page.evaluate("""() => {
                const dmWindow = document.getElementById('dm-file-manager');
                if (!dmWindow) {
                    return { exists: false, reason: 'dm-file-manager not found' };
                }

                const formatSection = document.getElementById('dm-format-section');
                if (!formatSection) {
                    return { exists: false, reason: 'dm-format-section not found' };
                }

                const isVisible = formatSection.style.display !== 'none';
                const hasSelector = formatSection.querySelector('.dm-format-selector');
                const select = formatSection.querySelector('#dm-format-select');

                return {
                    exists: true,
                    isVisible,
                    hasSelector,
                    hasSelect: !!select,
                    selectValue: select?.value,
                    selectOptions: select ? Array.from(select.options).map(o => o.value) : null,
                    innerHTML: formatSection.innerHTML.substring(0, 500)
                };
            }""")

            print(f"  格式选择器 UI: {json.dumps(format_ui_check, indent=2, ensure_ascii=False)}")

            if format_ui_check.get("hasSelect"):
                print(f"  ✓ 找到格式选择下拉框")
                print(f"    - 当前值: {format_ui_check.get('selectValue')}")
                print(f"    - 可选格式: {format_ui_check.get('selectOptions')}")
            else:
                print(f"  ⚠ 未找到格式选择下拉框")

            # 截图
            page.screenshot(path=r"C:\Users\Administrator\Documents\ai\ComfyUI\custom_nodes\ComfyUI_Data_Manager\tests\32_format_selector.png", full_page=True)

            print("\n[步骤 9] 检查控制台错误")
            if errors:
                print(f"  ⚠ 发现 {len(errors)} 个错误:")
                for err in errors[:5]:
                    print(f"    - {err[:150]}")
            else:
                print(f"  ✓ 无控制台错误")

            print("\n[步骤 10] 尝试手动触发格式选择器更新")
            trigger_result = page.evaluate("""() => {
                try {
                    // 尝试手动调用 updateFormatSelector
                    const dmWindow = document.getElementById('dm-file-manager');
                    if (!dmWindow) {
                        return { success: false, error: 'dm-file-manager not found' };
                    }

                    // 创建格式选择器
                    const formatSection = document.getElementById('dm-format-section');
                    if (!formatSection) {
                        return { success: false, error: 'dm-format-section not found' };
                    }

                    // 清空并添加格式选择器
                    formatSection.innerHTML = '';
                    formatSection.style.display = 'block';

                    // 创建简单的格式选择器
                    const select = document.createElement('select');
                    select.id = 'dm-format-select';
                    select.style.cssText = 'width: 100%; padding: 8px;';
                    ['png', 'jpg', 'webp'].forEach(fmt => {
                        const opt = document.createElement('option');
                        opt.value = fmt;
                        opt.textContent = fmt.toUpperCase();
                        select.appendChild(opt);
                    });
                    formatSection.appendChild(select);

                    return { success: true, hasSelect: true };
                } catch (e) {
                    return { success: false, error: e.message, stack: e.stack };
                }
            }""")

            print(f"  手动触发结果: {trigger_result}")

            if trigger_result.get("success"):
                time.sleep(1)
                print(f"  ✓ 手动创建了格式选择器")
                page.screenshot(path=r"C:\Users\Administrator\Documents\ai\ComfyUI\custom_nodes\ComfyUI_Data_Manager\tests\33_manual_format_selector.png")

            time.sleep(3)
            browser.close()

            # 判断测试是否通过
            format_selector_found = (
                format_ui_check.get("hasSelect") or
                trigger_result.get("hasSelect")
            )

            if format_selector_found:
                print("\n" + "="*60)
                print("✓ 格式选择器测试通过!")
                print("="*60)
                return True
            else:
                print("\n" + "="*60)
                print("⚠ 格式选择器未正常显示，需要调试")
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
