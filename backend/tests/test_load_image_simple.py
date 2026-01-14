# -*- coding: utf-8 -*-
"""测试 load_image 函数修复 - 独立版本（无相对导入依赖）"""

import sys
import os

# 添加 ComfyUI 路径
comfyui_path = r"C:\Users\Administrator\Documents\ai\ComfyUI"
sys.path.insert(0, comfyui_path)

import torch
import numpy as np
from PIL import Image, ImageOps


def load_image(file_path: str):
    """加载图像文件为 ComfyUI Tensor 格式（复制自修复后的代码）"""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"图像文件不存在: {file_path}")

    img = Image.open(file_path)

    # 处理 EXIF 旋转
    img = ImageOps.exif_transpose(img)

    # 转换为 RGB
    if img.mode == "I":
        img = img.point(lambda i: i * (1 / 255))
    image = img.convert("RGB")

    # 转换为 numpy array，然后转为 torch.Tensor
    # ComfyUI 格式: [1, H, W, 3], float32, 范围 0-1
    image = np.array(image).astype(np.float32) / 255.0
    image = torch.from_numpy(image)[None,]  # [1, H, W, 3]

    # 处理 mask (alpha 通道)
    if "A" in img.getbands():
        mask = np.array(img.getchannel("A")).astype(np.float32) / 255.0
        mask = 1.0 - torch.from_numpy(mask)  # ComfyUI mask 是反向的
    elif img.mode == "P" and "transparency" in img.info:
        mask = np.array(img.convert("RGBA").getchannel("A")).astype(np.float32) / 255.0
        mask = 1.0 - torch.from_numpy(mask)
    else:
        mask = None

    img.close()

    return (image, mask)


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

        # 测试可以调用 .cpu() 方法 - 这是最关键的测试
        try:
            image.cpu()
            print("  ✓ 可以调用 .cpu() 方法")
        except AttributeError as e:
            print(f"  ✗ 无法调用 .cpu() 方法: {e}")
            return False

        # 测试 .numpy() 方法
        try:
            image.numpy()
            print("  ✓ 可以调用 .numpy() 方法")
        except AttributeError as e:
            print(f"  ✗ 无法调用 .numpy() 方法: {e}")
            return False

        # 测试 mask
        if mask is not None:
            print(f"\n  Mask 类型: {type(mask)}")
            print(f"  Mask 形状: {mask.shape if hasattr(mask, 'shape') else 'N/A'}")
            if isinstance(mask, torch.Tensor):
                print("  ✓ Mask 是 torch.Tensor")
            else:
                print(f"  ✗ Mask 不是 torch.Tensor")
        else:
            print("  ✓ Mask 为 None（图像无 alpha 通道）")

        # 清理测试文件
        os.remove(test_image_path)
        print(f"\n✓ 清理测试文件")

        return True

    except Exception as e:
        print(f"  ✗ 测试失败: {e}")
        import traceback

        traceback.print_exc()
        return False


def test_with_actual_image():
    """使用实际的 Downloads 文件夹中的图像进行测试"""
    print("\n" + "=" * 60)
    print("测试使用实际图像文件")
    print("=" * 60)

    # 检查 1.jpg 是否存在
    test_file = r"C:\Users\Administrator\Downloads\1.jpg"
    if not os.path.exists(test_file):
        print(f"  跳过: 测试文件不存在 {test_file}")
        return True

    print(f"  测试文件: {test_file}")

    try:
        image, mask = load_image(test_file)

        print(f"  图像类型: {type(image)}")
        print(f"  图像形状: {image.shape}")
        print(f"  图像 dtype: {image.dtype}")

        if isinstance(image, torch.Tensor):
            print("  ✓ 图像是 torch.Tensor")

            # 测试 .cpu() 方法 - 这是最关键的测试
            try:
                image.cpu()
                print("  ✓ 可以调用 .cpu() 方法")
            except AttributeError as e:
                print(f"  ✗ 无法调用 .cpu() 方法: {e}")
                return False

            return True
        else:
            print(f"  ✗ 图像不是 torch.Tensor")
            return False

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

    # 测试 2: 使用实际图像文件
    results.append(("使用实际图像文件测试", test_with_actual_image()))

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
