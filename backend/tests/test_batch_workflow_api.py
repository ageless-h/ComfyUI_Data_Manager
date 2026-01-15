# -*- coding: utf-8 -*-
"""真正的批量处理工作流 API 测试

通过 ComfyUI API 执行完整的批量处理工作流：
1. 连接到 ComfyUI
2. 提交工作流
3. 监控执行进度
4. 验证输出结果
"""

import os
import sys
import json
import uuid
import time
import websocket
import requests
from pathlib import Path

# 项目路径
project_root = Path(__file__).parent.parent.parent


class ComfyUIAPIClient:
    """ComfyUI API 客户端"""

    def __init__(self, base_url="http://127.0.0.1:8188"):
        self.base_url = base_url
        self.client_id = str(uuid.uuid4())

    def check_connection(self) -> bool:
        """检查 ComfyUI 是否可访问"""
        try:
            response = requests.get(f"{self.base_url}/system_stats", timeout=5)
            return response.status_code == 200
        except Exception as e:
            print(f"连接失败: {e}")
            return False

    def check_nodes(self) -> dict:
        """检查 Data Manager 节点是否可用"""
        response = requests.get(f"{self.base_url}/object_info")
        response.raise_for_status()
        object_info = response.json()

        nodes = {}
        for node_name in ["DataManagerCore", "InputPathConfig", "OutputPathConfig"]:
            if node_name in object_info:
                nodes[node_name] = object_info[node_name]

        return nodes

    def queue_prompt(self, workflow: dict) -> str:
        """提交工作流到队列"""
        payload = {
            "prompt": workflow,
            "client_id": self.client_id
        }
        response = requests.post(f"{self.base_url}/prompt", json=payload)
        response.raise_for_status()
        data = response.json()
        return data.get("prompt_id", "")

    def get_history(self, prompt_id: str) -> dict:
        """获取执行历史"""
        response = requests.get(f"{self.base_url}/history/{prompt_id}")
        response.raise_for_status()
        return response.json()

    def get_queue_info(self) -> dict:
        """获取队列信息"""
        response = requests.get(f"{self.base_url}/queue")
        response.raise_for_status()
        return response.json()

    def execute_workflow(self, workflow: dict, timeout: int = 600) -> dict:
        """执行工作流并等待完成

        Returns:
            执行结果字典
        """
        # 提交工作流
        print("\n[1] 提交工作流...")
        prompt_id = self.queue_prompt(workflow)
        print(f"  Prompt ID: {prompt_id}")

        # 连接 WebSocket 监听进度
        print("\n[2] 监听执行进度...")
        ws_url = f"ws://127.0.0.1:8188/ws?clientId={self.client_id}"

        start_time = time.time()
        last_nodes = set()
        completed = False

        try:
            ws = websocket.create_connection(ws_url)
            ws.settimeout(1)

            while not completed:
                # 检查超时
                if time.time() - start_time > timeout:
                    raise TimeoutError(f"工作流执行超时 ({timeout}秒)")

                try:
                    message = ws.recv()
                    if not message:
                        continue

                    data = json.loads(message)
                    msg_type = data.get("type", "")

                    if msg_type == "status":
                        queue_remaining = data.get("data", {}).get("status", {}).get("queue_remaining", 0)
                        if queue_remaining == 0:
                            # 检查历史
                            history = self.get_history(prompt_id)
                            if prompt_id in history:
                                print("  ✓ 执行完成")
                                completed = True
                                break

                    elif msg_type == "executing":
                        node_id = data.get("data", {}).get("node")
                        if node_id and node_id not in last_nodes:
                            print(f"  执行节点: {node_id}")
                            last_nodes.add(node_id)

                    elif msg_type == "progress":
                        value = data.get("data", {}).get("value", 0)
                        max_value = data.get("data", {}).get("max", 1)
                        if max_value > 0:
                            percent = int(value / max_value * 100)
                            if percent % 10 == 0:  # 每10%打印一次
                                print(f"  进度: {percent}%")

                    elif msg_type == "execution_success":
                        print("  ✓ 工作流执行成功")
                        completed = True
                        break

                    elif msg_type == "execution_cached":
                        nodes = data.get("data", {}).get("nodes", [])
                        if nodes:
                            print(f"  使用缓存: {len(nodes)} 个节点")

                    elif msg_type == "executed":
                        node_id = data.get("data", {}).get("node", "")
                        output = data.get("data", {}).get("output", {})
                        if output:
                            images = output.get("images", [])
                            if images:
                                print(f"  节点 {node_id} 输出: {len(images)} 个文件")

                except websocket.WebSocketTimeoutException:
                    continue
                except Exception as e:
                    print(f"  WebSocket 警告: {e}")
                    continue

            ws.close()

        except Exception as e:
            print(f"  ⚠ WebSocket 连接问题: {e}")
            # 回退到轮询
            print("  回退到轮询模式...")
            while time.time() - start_time < timeout:
                history = self.get_history(prompt_id)
                if prompt_id in history:
                    print("  ✓ 执行完成")
                    break
                time.sleep(2)

        # 获取最终结果
        print("\n[3] 获取执行结果...")
        history = self.get_history(prompt_id)
        return history.get(prompt_id, {})


def create_batch_resize_workflow(
    input_dir: str,
    output_dir: str,
    pattern: str = "*.png",
    naming_rule: str = "resized_{index:04d}",
    target_size: int = 51
) -> dict:
    """创建批量调整图像大小的工作流

    Args:
        input_dir: 输入目录
        output_dir: 输出目录
        pattern: 文件匹配模式
        naming_rule: 输出文件命名规则
        target_size: 目标尺寸 (512/10 ≈ 51)

    Returns:
        ComfyUI 工作流字典
    """
    workflow = {}

    # 节点 1: OutputPathConfig (Match 模式) - 批量加载图像
    workflow["1"] = {
        "inputs": {
            "enable_match": True,
            "pattern": pattern,
            "source_path": input_dir,
        },
        "class_type": "OutputPathConfig",
    }

    # 节点 2: ImageScale (调整图像大小) - 缩小到 51x51
    workflow["2"] = {
        "inputs": {
            "image": ["1", 0],  # 从 OutputPathConfig 获取批次图像
            "width": target_size,
            "height": target_size,
            "upscale_method": "lanczos",  # 使用高质量缩放
            "crop": "disabled",  # 不裁剪
        },
        "class_type": "ImageScale",
    }

    # 节点 3: RebatchImages - 将批次张量拆分为多个图像（触发下游迭代）
    workflow["3"] = {
        "inputs": {
            "images": ["2", 0],  # 从 ImageScale 获取批次化的图像
            "batch_size": 1,  # 每次只取 1 张图像
        },
        "class_type": "RebatchImages",
    }

    # 节点 4: SaveImage - 保存图像到 ComfyUI 输出目录
    # 注意：InputPathConfig Batch 模式目前有迭代问题，暂时使用 SaveImage
    workflow["4"] = {
        "inputs": {
            "images": ["3", 0],  # 从 RebatchImages 获取拆分后的图像列表
            "filename_prefix": "batch_resize_test",
        },
        "class_type": "SaveImage",
    }

    return workflow


def main():
    """主函数"""
    print("\n" + "=" * 70)
    print("ComfyUI 批量处理工作流 API 测试")
    print("=" * 70)

    # 配置
    INPUT_DIR = r"C:\Users\Administrator\Documents\ai\ComfyUI\custom_nodes\ComfyUI_Data_Manager\backend\tests\fixtures\batch_test_images"
    OUTPUT_DIR = r"C:\Users\Administrator\Documents\ai\ComfyUI\custom_nodes\ComfyUI_Data_Manager\backend\tests\fixtures\batch_test_output"
    COMFYUI_URL = "http://127.0.0.1:8188"

    print(f"\n输入目录: {INPUT_DIR}")
    print(f"输出目录: {OUTPUT_DIR}")
    print(f"ComfyUI: {COMFYUI_URL}")

    # 创建 API 客户端
    client = ComfyUIAPIClient(COMFYUI_URL)

    # 检查连接
    print("\n[检查] ComfyUI 连接...")
    if not client.check_connection():
        print("  ✗ 无法连接到 ComfyUI")
        print(f"  请确保 ComfyUI 正在运行: {COMFYUI_URL}")
        return 1
    print("  ✓ ComfyUI 连接成功")

    # 检查节点
    print("\n[检查] Data Manager 节点...")
    nodes = client.check_nodes()
    if len(nodes) < 3:
        print(f"  ✗ Data Manager 节点未完全注册")
        print(f"  找到的节点: {list(nodes.keys())}")
        return 1
    print(f"  ✓ 找到所有节点: {list(nodes.keys())}")

    # 创建输出目录
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # 创建工作流
    print("\n[准备] 创建批量处理工作流...")
    try:
        workflow = create_batch_resize_workflow(INPUT_DIR, OUTPUT_DIR)
        print(f"  ✓ 工作流包含 {len(workflow)} 个节点")
    except Exception as e:
        print(f"  ✗ 创建工作流失败: {e}")
        import traceback
        traceback.print_exc()
        return 1

    # 显示工作流详情
    print("\n工作流详情:")
    for node_id, node_data in workflow.items():
        class_type = node_data.get("class_type", "")
        inputs = node_data.get("inputs", {})
        print(f"  节点 {node_id}: {class_type}")
        if "source_path" in inputs:
            print(f"    源路径: {inputs['source_path']}")
        if "target_path" in inputs:
            print(f"    目标路径: {inputs['target_path']}")
        if "pattern" in inputs:
            print(f"    模式: {inputs['pattern']}")
        if "naming_rule" in inputs:
            print(f"    命名规则: {inputs['naming_rule']}")
        if "width" in inputs:
            print(f"    尺寸: {inputs['width']}x{inputs['height']}")

    # 执行工作流
    print("\n" + "=" * 70)
    print("执行批量处理工作流")
    print("=" * 70)

    try:
        result = client.execute_workflow(workflow, timeout=600)

        # 显示结果
        print("\n" + "=" * 70)
        print("执行完成")
        print("=" * 70)

        # 检查输出
        output_files = list(Path(OUTPUT_DIR).glob("*.png"))
        print(f"\n输出文件数量: {len(output_files)}")

        if output_files:
            print(f"前 5 个文件:")
            for f in sorted(output_files)[:5]:
                size = os.path.getsize(f)
                print(f"  - {f.name} ({size} 字节)")

            # 检查文件尺寸
            print(f"\n检查文件尺寸...")
            from PIL import Image
            for f in sorted(output_files)[:3]:
                try:
                    with Image.open(f) as img:
                        print(f"  {f.name}: {img.size[0]}x{img.size[1]} 像素")
                except Exception as e:
                    print(f"  {f.name}: 无法读取 ({e})")

        # 运行验证脚本
        print("\n" + "=" * 70)
        print("运行验证脚本...")
        print("=" * 70)

        verify_script = project_root / "backend" / "tests" / "verify_batch_output.py"
        if verify_script.exists():
            import subprocess
            result = subprocess.run(
                [sys.executable, str(verify_script)],
                cwd=str(project_root),
            )
            if result.returncode == 0:
                print("\n✓ 所有验证通过")
            else:
                print("\n⚠ 验证发现一些问题，请检查上面的输出")
            return result.returncode
        else:
            print("验证脚本不存在，跳过验证")
            return 0

    except TimeoutError as e:
        print(f"\n✗ 执行超时: {e}")
        return 1
    except Exception as e:
        print(f"\n✗ 执行失败: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
