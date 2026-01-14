# -*- coding: utf-8 -*-
"""后端简单测试 - 直接测试保存功能

不依赖 ComfyUI，直接测试图像保存逻辑
"""

import os
import json
import numpy as np
from PIL import Image
from pathlib import Path
from datetime import datetime
import shutil

# ============================================================================
# 复制核心函数（直接从 nodes_v3.py）
# ============================================================================

def save_image(tensor: np.ndarray, file_path: str, format: str = "png") -> str:
    """保存 ComfyUI 图像张量到文件"""
    # 确保 file_path 有正确的扩展名
    path = Path(file_path)
    if path.suffix.lower() != f".{format}":
        file_path = str(path.with_suffix(f".{format}"))

    # 处理张量形状
    if len(tensor.shape) == 4:
        tensor = tensor[0]
    elif len(tensor.shape) == 3:
        pass
    else:
        raise ValueError(f"不支持的张量形状: {tensor.shape}")

    # 转换为 uint8
    if tensor.dtype != np.uint8:
        tensor = (tensor * 255).astype(np.uint8)

    # 转换为 PIL Image
    img = Image.fromarray(tensor, 'RGB')

    # 保存图像
    os.makedirs(Path(file_path).parent, exist_ok=True)

    save_kwargs = {}
    if format == "jpg" or format == "jpeg":
        save_kwargs["quality"] = 95
    elif format == "webp":
        save_kwargs["quality"] = 95
        save_kwargs["method"] = 6

    img.save(file_path, format.upper(), **save_kwargs)

    return file_path


def parse_target_path(target_path: str, detected_type: str, format: str) -> tuple:
    """解析目标路径"""
    path = Path(target_path)

    if path.suffix:
        directory = str(path.parent)
        filename = path.name
        name_without_ext = path.stem
        if filename.split('.')[-1].lower() != format.lower():
            filename = f"{name_without_ext}.{format}"
    else:
        directory = str(path)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"output_{timestamp}.{format}"

    return directory, filename


# ============================================================================
# 测试函数
# ============================================================================

def test_save_image():
    """测试图像保存"""
    print("\n" + "="*60)
    print("测试图像保存功能")
    print("="*60)

    # 创建测试图像
    img_array = np.random.randint(0, 255, (512, 512, 3), dtype=np.uint8)
    print(f"\n创建测试图像: shape={img_array.shape}, dtype={img_array.dtype}")

    # 测试 1: PNG
    print("\n[测试 1] 保存 PNG")
    output_path = r"C:\Users\Administrator\Downloads\test_save.png"
    try:
        saved_path = save_image(img_array, output_path, "png")
        print(f"  ✓ 保存成功: {saved_path}")
        if os.path.exists(saved_path):
            size = os.path.getsize(saved_path)
            print(f"  文件大小: {size} 字节")
        return True
    except Exception as e:
        print(f"  ✗ 失败: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_process_image_input():
    """测试完整的图像处理流程"""
    print("\n" + "="*60)
    print("测试完整图像处理流程")
    print("="*60)

    # 创建测试图像 (模拟 ComfyUI 输出的 numpy array)
    img_array = np.random.randint(0, 255, (512, 512, 3), dtype=np.uint8)

    # 用户设置的目标路径
    target_path = r"C:\Users\Administrator\Downloads\my_output.png"
    output_format = "png"

    print(f"\n输入:")
    print(f"  图像 shape: {img_array.shape}")
    print(f"  目标路径: {target_path}")
    print(f"  格式: {output_format}")

    # 解析路径
    print(f"\n步骤 1: 解析路径")
    directory, filename = parse_target_path(target_path, "IMAGE", output_format)
    print(f"  目录: {directory}")
    print(f"  文件名: {filename}")

    # 组合完整路径
    full_path = os.path.join(directory, filename)
    print(f"  完整路径: {full_path}")

    # 保存图像
    print(f"\n步骤 2: 保存图像")
    try:
        saved_path = save_image(img_array, full_path, output_format)
        print(f"  ✓ 保存成功: {saved_path}")

        if os.path.exists(saved_path):
            size = os.path.getsize(saved_path)
            print(f"  文件大小: {size} 字节")

            # 验证图像
            img = Image.open(saved_path)
            print(f"  图像尺寸: {img.size}")
            print(f"  图像模式: {img.mode}")
            return True
        else:
            print(f"  ✗ 文件不存在")
            return False
    except Exception as e:
        print(f"  ✗ 失败: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_comfyui_image_format():
    """测试 ComfyUI 图像格式的处理"""
    print("\n" + "="*60)
    print("测试 ComfyUI 图像格式")
    print("="*60)

    # ComfyUI 图像可能是各种形状
    test_cases = [
        ("HWC 格式", (512, 512, 3)),
        ("BCHW 格式", (1, 3, 512, 512)),
        ("BCHW 格式 (batch=2)", (2, 3, 512, 512)),
    ]

    for name, shape in test_cases:
        print(f"\n[测试] {name}: {shape}")
        img_array = np.random.randint(0, 255, shape, dtype=np.uint8)

        output_path = rf"C:\Users\Administrator\Downloads\test_{name.replace(' ', '_')}.png"

        try:
            saved_path = save_image(img_array, output_path, "png")
            if os.path.exists(saved_path):
                print(f"  ✓ 成功: {saved_path}")
            else:
                print(f"  ✗ 文件未创建")
        except Exception as e:
            print(f"  ✗ 失败: {e}")


def main():
    print("\n" + "="*60)
    print("ComfyUI Data Manager 后端简单测试")
    print("="*60)

    results = []

    # 测试 1: 基本保存
    results.append(("基本保存", test_save_image()))

    # 测试 2: 完整流程
    results.append(("完整流程", test_process_image_input()))

    # 测试 3: ComfyUI 格式
    test_comfyui_image_format()
    results.append(("ComfyUI格式", True))

    # 总结
    print("\n" + "="*60)
    print("测试结果总结")
    print("="*60)

    for name, result in results:
        status = "✓ 通过" if result else "✗ 失败"
        print(f"  {name}: {status}")

    # 检查生成的文件
    print("\n生成的文件:")
    test_dir = r"C:\Users\Administrator\Downloads"
    for f in ["test_save.png", "my_output.png"]:
        path = os.path.join(test_dir, f)
        if os.path.exists(path):
            print(f"  ✓ {f} ({os.path.getsize(path)} 字节)")
        else:
            print(f"  ✗ {f} 不存在")

    all_passed = all(r for _, r in results)

    print("\n" + "="*60)
    if all_passed:
        print("✓ 所有测试通过")
    else:
        print("⚠ 部分测试失败")
    print("="*60)

    return all_passed


if __name__ == "__main__":
    import sys
    success = main()
    sys.exit(0 if success else 1)
