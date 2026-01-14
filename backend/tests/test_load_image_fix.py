# -*- coding: utf-8 -*-
"""测试 load_image 函数修复 - 验证返回 torch.Tensor 格式"""

import sys
import os

# 添加 ComfyUI 路径
comfyui_path = r"C:\Users\Administrator\Documents\ai\ComfyUI"
custom_nodes_path = os.path.join(comfyui_path, "custom_nodes")
data_manager_path = os.path.join(custom_nodes_path, "ComfyUI_Data_Manager")

sys.path.insert(0, comfyui_path)
sys.path.insert(0, custom_nodes_path)
sys.path.insert(0, data_manager_path)

# 需要在 ComfyUI 环境中运行
import torch
import numpy as np
from PIL import Image

# 导入修复后的 load_image 函数
# 直接导入函数以避免模块问题
import importlib.util

spec = importlib.util.spec_from_file_location(
    "nodes_v3", os.path.join(data_manager_path, "core", "nodes_v3.py")
)
nodes_v3 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(nodes_v3)

load_image = nodes_v3.load_image
save_image = nodes_v3.save_image


def test_load_image_returns_tensor():
    """测试 load_image 返回 torch.Tensor 而不是 numpy.ndarray"""
    print("\n" + "=" * 60)
    print("测试 load_image 返回 torch.Tensor")
    print("=" * 60)

    # 创建测试图像
    test_image_path = r"C:\Users\Administrator\Downloads\test_load_image.png"

    # 创建一个简单的测试图像
    img_array = np.random.randint(0, 255, (256, 256, 3), dtype=np.uint8)
    img = Image.fromarray(img_array)
    img.save(test_image_path)
    print(f"✓ 创建测试图像: {test_image_path}")

    # 测试 load_image
    print("\n[测试] 调用 load_image")
    try:
        image, mask = load_image(test_image_path)

        print(f"  图像类型: {type(image)}")
        print(f"  图像形状: {image.shape if hasattr(image, 'shape') else 'N/A'}")
        print(f"  图像 dtype: {image.dtype if hasattr(image, 'dtype') else 'N/A'}")

        # 验证是否是 torch.Tensor
        if isinstance(image, torch.Tensor):
            print("  ✓ 图像是 torch.Tensor")
        else:
            print(f"  ✗ 图像不是 torch.Tensor，而是 {type(image)}")
            return False

        # 验证形状格式
        if len(image.shape) == 4 and image.shape[0] == 1 and image.shape[3] == 3:
            print(f"  ✓ 图像形状正确: [1, H, W, 3] = {image.shape}")
        else:
            print(f"  ✗ 图像形状不正确: {image.shape}")
            return False

        # 验证数据类型和范围
        if image.dtype == torch.float32:
            print(f"  ✓ 图像 dtype 正确: {image.dtype}")
        else:
            print(f"  ✗ 图像 dtype 不正确: {image.dtype}")
            return False

        min_val = image.min().item()
        max_val = image.max().item()
        print(f"  图像值范围: [{min_val:.3f}, {max_val:.3f}]")

        if 0 <= min_val and max_val <= 1.0:
            print(f"  ✓ 图像值范围正确: [0, 1]")
        else:
            print(f"  ✗ 图像值范围不正确")

        # 测试可以调用 .cpu() 方法
        try:
            image.cpu()
            print("  ✓ 可以调用 .cpu() 方法")
        except AttributeError as e:
            print(f"  ✗ 无法调用 .cpu() 方法: {e}")
            return False

        # 测试 mask
        if mask is not None:
            print(f"\n  Mask 类型: {type(mask)}")
            print(f"  Mask 形状: {mask.shape if hasattr(mask, 'shape') else 'N/A'}")
            if isinstance(mask, torch.Tensor):
                print("  ✓ Mask 是 torch.Tensor")
            else:
                print(f"  ✗ Mask 不是 torch.Tensor")

        # 清理测试文件
        os.remove(test_image_path)
        print(f"\n✓ 清理测试文件")

        return True

    except Exception as e:
        print(f"  ✗ 测试失败: {e}")
        import traceback

        traceback.print_exc()
        return False


def test_roundtrip_save_load():
    """测试保存和加载的往返一致性"""
    print("\n" + "=" * 60)
    print("测试保存和加载往返一致性")
    print("=" * 60)

    # 创建原始图像 (torch.Tensor 格式, ComfyUI 标准)
    original = torch.from_numpy(np.random.rand(1, 256, 256, 3).astype(np.float32))

    test_save_path = r"C:\Users\Administrator\Downloads\test_roundtrip.png"

    try:
        # 保存图像
        print("\n[步骤 1] 保存图像")
        # save_image 接受 numpy array, 需要转换
        original_np = original.cpu().numpy()[0]  # [H, W, 3]
        saved_path = save_image(original_np, test_save_path, "png")
        print(f"  ✓ 保存成功: {saved_path}")

        # 加载图像
        print("\n[步骤 2] 加载图像")
        loaded, mask = load_image(saved_path)
        print(f"  ✓ 加载成功")
        print(f"  加载的图像类型: {type(loaded)}")
        print(f"  加载的图像形状: {loaded.shape}")

        # 验证加载的是 torch.Tensor
        if isinstance(loaded, torch.Tensor):
            print("  ✓ 加载的图像是 torch.Tensor")
        else:
            print(f"  ✗ 加载的图像不是 torch.Tensor: {type(loaded)}")
            return False

        # 验证形状一致
        if loaded.shape == original.shape:
            print(f"  ✓ 形状一致: {loaded.shape}")
        else:
            print(f"  ✗ 形状不一致: {loaded.shape} vs {original.shape}")

        # 清理
        os.remove(test_save_path)
        print(f"\n✓ 清理测试文件")

        return True

    except Exception as e:
        print(f"  ✗ 测试失败: {e}")
        import traceback

        traceback.print_exc()
        return False


def main():
    print("\n" + "=" * 60)
    print("load_image 修复验证测试")
    print("=" * 60)

    results = []

    # 测试 1: 验证返回 torch.Tensor
    results.append(("load_image 返回 torch.Tensor", test_load_image_returns_tensor()))

    # 测试 2: 往返一致性
    results.append(("保存和加载往返一致性", test_roundtrip_save_load()))

    # 总结
    print("\n" + "=" * 60)
    print("测试结果总结")
    print("=" * 60)
    for name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{status}: {name}")

    all_passed = all(passed for _, passed in results)
    if all_passed:
        print("\n✓ 所有测试通过!")
        return True
    else:
        print("\n✗ 有测试失败")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
