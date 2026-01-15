# -*- coding: utf-8 -*-
"""后端直接测试 - 测试 InputPathConfig 节点

直接测试节点代码，不通过 ComfyUI UI
"""

import sys
import os
import json
import numpy as np
from PIL import Image

# 添加 ComfyUI 路径
comfyui_path = r"C:\Users\Administrator\Documents\ai\ComfyUI"
custom_nodes_path = os.path.join(comfyui_path, "custom_nodes")
data_manager_path = os.path.join(custom_nodes_path, "ComfyUI_Data_Manager")

sys.path.insert(0, comfyui_path)
sys.path.insert(0, custom_nodes_path)
sys.path.insert(0, data_manager_path)

# 导入 comfy_api
try:
    from comfy_api.latest import io, ComfyExtension

    print("✓ comfy_api 已导入")
except ImportError as e:
    print(f"✗ comfy_api 导入失败: {e}")
    print("将尝试模拟 io 模块...")


def create_test_image():
    """创建测试图像张量"""
    # 创建一个简单的测试图像 (512x512 RGB)
    img_array = np.random.randint(0, 255, (512, 512, 3), dtype=np.uint8)
    return img_array


def test_parse_target_path():
    """测试路径解析函数"""
    print("\n" + "=" * 60)
    print("测试 parse_target_path 函数")
    print("=" * 60)

    from backend.core.nodes_v3 import parse_target_path

    # 测试完整文件路径
    print("\n[测试 1] 完整文件路径")
    target_path = r"C:\Users\Administrator\Downloads\test_output.png"
    directory, filename = parse_target_path(target_path, "IMAGE", "png")
    print(f"  输入: {target_path}")
    print(f"  目录: {directory}")
    print(f"  文件名: {filename}")

    # 测试目录路径
    print("\n[测试 2] 目录路径")
    target_path = r"C:\Users\Administrator\Downloads"
    directory, filename = parse_target_path(target_path, "IMAGE", "jpg")
    print(f"  输入: {target_path}")
    print(f"  目录: {directory}")
    print(f"  文件名: {filename}")

    # 测试路径扩展名不匹配
    print("\n[测试 3] 扩展名不匹配")
    target_path = r"C:\Users\Administrator\Downloads\test.jpg"
    directory, filename = parse_target_path(target_path, "IMAGE", "png")
    print(f"  输入: {target_path}")
    print(f"  目录: {directory}")
    print(f"  文件名: {filename}")

    print("\n✓ parse_target_path 测试通过")


def test_save_image():
    """测试图像保存函数"""
    print("\n" + "=" * 60)
    print("测试 save_image 函数")
    print("=" * 60)

    from backend.core.nodes_v3 import save_image

    # 创建测试图像张量
    test_tensor = create_test_image()
    print(f"\n创建测试张量: shape={test_tensor.shape}, dtype={test_tensor.dtype}")

    # 测试保存 PNG
    print("\n[测试 1] 保存为 PNG")
    output_path = r"C:\Users\Administrator\Downloads\test_backend_save.png"
    try:
        saved_path = save_image(test_tensor, output_path, "png")
        print(f"  ✓ 保存成功: {saved_path}")

        # 验证文件存在
        if os.path.exists(saved_path):
            file_size = os.path.getsize(saved_path)
            print(f"  文件大小: {file_size} 字节")

            # 验证可以读取
            img = Image.open(saved_path)
            print(f"  图像尺寸: {img.size}")
            print(f"  图像模式: {img.mode}")
        else:
            print(f"  ✗ 文件不存在: {saved_path}")
    except Exception as e:
        print(f"  ✗ 保存失败: {e}")
        import traceback

        traceback.print_exc()

    # 测试保存 JPG
    print("\n[测试 2] 保存为 JPG")
    output_path = r"C:\Users\Administrator\Downloads\test_backend_save.jpg"
    try:
        saved_path = save_image(test_tensor, output_path, "jpg")
        print(f"  ✓ 保存成功: {saved_path}")

        if os.path.exists(saved_path):
            file_size = os.path.getsize(saved_path)
            print(f"  文件大小: {file_size} 字节")
        else:
            print(f"  ✗ 文件不存在: {saved_path}")
    except Exception as e:
        print(f"  ✗ 保存失败: {e}")
        import traceback

        traceback.print_exc()

    # 测试保存 WebP
    print("\n[测试 3] 保存为 WebP")
    output_path = r"C:\Users\Administrator\Downloads\test_backend_save.webp"
    try:
        saved_path = save_image(test_tensor, output_path, "webp")
        print(f"  ✓ 保存成功: {saved_path}")

        if os.path.exists(saved_path):
            file_size = os.path.getsize(saved_path)
            print(f"  文件大小: {file_size} 字节")
        else:
            print(f"  ✗ 文件不存在: {saved_path}")
    except Exception as e:
        print(f"  ✗ 保存失败: {e}")
        import traceback

        traceback.print_exc()

    print("\n✓ save_image 测试完成")


def test_input_path_config_execute():
    """测试 InputPathConfig.execute 方法"""
    print("\n" + "=" * 60)
    print("测试 InputPathConfig.execute 方法")
    print("=" * 60)

    from backend.core.nodes_v3 import InputPathConfig

    # 创建测试图像张量 (模拟 ComfyUI 图像格式)
    # ComfyUI 图像通常是 [H, W, C] 或 [B, H, W, C] 格式
    test_tensor = create_test_image()
    print(f"\n创建测试张量: shape={test_tensor.shape}, dtype={test_tensor.dtype}")

    # 测试 1: numpy array 输入
    print("\n[测试 1] numpy array 输入")
    result = InputPathConfig.execute(
        cls=InputPathConfig,
        target_path=r"C:\Users\Administrator\Downloads\test_execute_output.png",
        format="png",
        file_input=test_tensor,
    )

    print(f"  返回结果类型: {type(result)}")
    # result 是 io.NodeOutput 对象，需要获取值
    if hasattr(result, "value"):
        result_value = result.value
    else:
        result_value = result

    print(f"  返回值: {result_value}")

    # 解析 JSON 结果
    try:
        result_dict = json.loads(result_value)
        print(f"  状态: {result_dict.get('status')}")
        print(f"  检测类型: {result_dict.get('detected_type')}")
        print(f"  保存路径: {result_dict.get('saved_path')}")
        print(f"  错误信息: {result_dict.get('error')}")

        saved_path = result_dict.get("saved_path")
        if saved_path and os.path.exists(saved_path):
            file_size = os.path.getsize(saved_path)
            print(f"  ✓ 文件已保存，大小: {file_size} 字节")
        else:
            print(f"  ✗ 文件未保存")
    except Exception as e:
        print(f"  ✗ 解析结果失败: {e}")
        print(f"  原始结果: {result_value}")

    # 测试 2: None 输入
    print("\n[测试 2] None 输入")
    result = InputPathConfig.execute(
        cls=InputPathConfig,
        target_path=r"C:\Users\Administrator\Downloads\test_execute_output2.png",
        format="png",
        file_input=None,
    )

    if hasattr(result, "value"):
        result_value = result.value
    else:
        result_value = result

    print(f"  返回值: {result_value}")

    try:
        result_dict = json.loads(result_value)
        print(f"  状态: {result_dict.get('status')}")
        print(f"  检测类型: {result_dict.get('detected_type')}")
    except Exception as e:
        print(f"  ✗ 解析结果失败: {e}")

    print("\n✓ InputPathConfig.execute 测试完成")


def test_dict_input():
    """测试字典类型输入（ComfyUI 图像格式）"""
    print("\n" + "=" * 60)
    print("测试字典类型输入（ComfyUI 图像格式）")
    print("=" * 60)

    from backend.core.nodes_v3 import InputPathConfig

    # 模拟 ComfyUI 的图像格式
    # LoadImage 节点输出: {tensor: numpy_array, ...}
    test_tensor = create_test_image()

    # 测试 1: 带有 tensor 字段的字典
    print("\n[测试 1] 带有 tensor 字段的字典")
    image_dict = {"tensor": test_tensor, "some_other_field": "test"}

    result = InputPathConfig.execute(
        cls=InputPathConfig,
        target_path=r"C:\Users\Administrator\Downloads\test_dict_output.png",
        format="png",
        file_input=image_dict,
    )

    if hasattr(result, "value"):
        result_value = result.value
    else:
        result_value = result

    print(f"  返回值: {result_value[:200] if len(result_value) > 200 else result_value}")

    try:
        result_dict = json.loads(result_value)
        print(f"  状态: {result_dict.get('status')}")
        print(f"  检测类型: {result_dict.get('detected_type')}")
        print(f"  保存路径: {result_dict.get('saved_path')}")
        print(f"  错误信息: {result_dict.get('error')}")

        saved_path = result_dict.get("saved_path")
        if saved_path and os.path.exists(saved_path):
            file_size = os.path.getsize(saved_path)
            print(f"  ✓ 文件已保存，大小: {file_size} 字节")
        else:
            print(f"  ✗ 文件未保存")
    except Exception as e:
        print(f"  ✗ 解析结果失败: {e}")

    print("\n✓ 字典类型输入测试完成")


def main():
    print("\n" + "=" * 60)
    print("ComfyUI Data Manager 后端测试")
    print("=" * 60)

    try:
        # 测试路径解析
        test_parse_target_path()

        # 测试图像保存
        test_save_image()

        # 测试 execute 方法
        test_input_path_config_execute()

        # 测试字典输入
        test_dict_input()

        print("\n" + "=" * 60)
        print("✓ 所有测试完成")
        print("=" * 60)

        # 检查保存的文件
        print("\n检查保存的文件:")
        test_dir = r"C:\Users\Administrator\Downloads"
        for f in [
            "test_backend_save.png",
            "test_backend_save.jpg",
            "test_backend_save.webp",
            "test_execute_output.png",
        ]:
            path = os.path.join(test_dir, f)
            if os.path.exists(path):
                print(f"  ✓ {f} ({os.path.getsize(path)} 字节)")
            else:
                print(f"  ✗ {f} 不存在")

    except Exception as e:
        print(f"\n✗ 测试失败: {e}")
        import traceback

        traceback.print_exc()
        return False

    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
