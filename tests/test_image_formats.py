# -*- coding: utf-8 -*-
"""图像保存完整测试 - 独立版本

测试格式：PNG, JPG, JPEG, WebP, BMP, TIFF, TIF, GIF
测试通道：RGB (3通道), RGBA (4通道), 灰度 (1通道)
"""

import os
import numpy as np
from PIL import Image
from pathlib import Path

# 直接复制 save_image 函数
def save_image(tensor: np.ndarray, file_path: str, format: str = "png") -> str:
    """保存 ComfyUI 图像张量到文件"""
    # 解析格式字符串
    if " - " in format:
        format = format.split(" - ")[-1].lower()
    else:
        format = format.lower()

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
    if len(tensor.shape) == 2:
        img = Image.fromarray(tensor, 'L')
    elif tensor.shape[2] == 1:
        img = Image.fromarray(tensor[:, :, 0], 'L')
    elif tensor.shape[2] == 2:
        img = Image.fromarray(tensor[:, :, 0], 'L')
    elif tensor.shape[2] == 3:
        img = Image.fromarray(tensor, 'RGB')
    elif tensor.shape[2] == 4:
        img = Image.fromarray(tensor, 'RGBA')
    else:
        raise ValueError(f"不支持的通道数: {tensor.shape[2]}")

    # 保存图像
    os.makedirs(Path(file_path).parent, exist_ok=True)

    save_kwargs = {}
    pil_format = format.upper()

    if pil_format == "JPG":
        pil_format = "JPEG"
        save_kwargs["quality"] = 95
    elif pil_format == "JPEG":
        save_kwargs["quality"] = 95
    elif pil_format == "WEBP":
        save_kwargs["quality"] = 95
        save_kwargs["method"] = 6
    elif pil_format == "TIF":
        pil_format = "TIFF"
    elif pil_format == "TIFF":
        save_kwargs["compression"] = "tiff_lzw"
    elif pil_format == "BMP":
        pass
    elif pil_format == "GIF":
        pass
    elif pil_format == "PNG":
        save_kwargs["optimize"] = True

    # JPEG 和 BMP 不支持透明通道
    if pil_format in ["JPEG", "JPG", "BMP"] and img.mode == "RGBA":
        background = Image.new('RGB', img.size, (255, 255, 255))
        background.paste(img, mask=img.split()[3])
        img = background

    img.save(file_path, pil_format, **save_kwargs)
    return file_path


def create_test_tensor(shape, dtype=np.uint8):
    """创建测试张量"""
    if len(shape) == 3:
        if shape[2] == 1:
            return np.ones(shape, dtype=dtype) * 128
        elif shape[2] == 3:
            tensor = np.zeros(shape, dtype=dtype)
            tensor[:, :, 0] = 255  # R
            tensor[:, :, 1] = 128  # G
            tensor[:, :, 2] = 0    # B
            return tensor
        elif shape[2] == 4:
            tensor = np.zeros(shape, dtype=dtype)
            tensor[:, :, 0] = 255  # R
            tensor[:, :, 1] = 128  # G
            tensor[:, :, 2] = 0    # B
            tensor[:, :, 3] = 200  # A
            return tensor
    return np.random.randint(0, 255, shape, dtype=dtype)

def test_format(format_name, tensor_shape, test_dir):
    """测试单个格式"""
    output_path = os.path.join(test_dir, f"test_{tensor_shape[2]}ch_{format_name}.{format_name}")

    try:
        tensor = create_test_tensor(tensor_shape)
        print(f"  测试 {format_name.upper()} | {tensor_shape} -> ", end="")

        saved_path = save_image(tensor, output_path, format_name)

        if os.path.exists(saved_path):
            img = Image.open(saved_path)
            file_size = os.path.getsize(saved_path)
            print(f"✓ 成功 ({img.mode}, {file_size} bytes)")
            return True
        else:
            print(f"✗ 文件未创建")
            return False
    except Exception as e:
        print(f"✗ 失败: {e}")
        return False

def main():
    print("\n" + "="*60)
    print("图像保存完整测试")
    print("="*60)

    test_dir = r"C:\Users\Administrator\Downloads\image_save_test"
    os.makedirs(test_dir, exist_ok=True)

    formats = ["png", "jpg", "jpeg", "webp", "bmp", "tiff", "tif", "gif"]
    shapes = [
        (128, 128, 1),  # 灰度
        (128, 128, 3),  # RGB
        (128, 128, 4),  # RGBA
    ]

    results = {}

    for shape in shapes:
        channel_type = f"{shape[2]}通道"
        print(f"\n{'='*60}")
        print(f"测试 {channel_type} 图像 (shape: {shape})")
        print(f"{'='*60}")

        for fmt in formats:
            key = f"{shape[2]}ch_{fmt}"
            success = test_format(fmt, shape, test_dir)
            results[key] = success

    # 测试分组格式字符串
    print(f"\n{'='*60}")
    print("测试分组格式字符串解析")
    print(f"{'='*60}")

    tensor = create_test_tensor((128, 128, 3))
    for fmt in formats:
        grouped_format = f"图像格式 - {fmt.upper()}"
        output_path = os.path.join(test_dir, f"test_grouped_{fmt}.{fmt}")
        try:
            print(f"  测试 '{grouped_format}' -> ", end="")
            saved_path = save_image(tensor, output_path, grouped_format)
            if os.path.exists(saved_path):
                print(f"✓ 成功")
            else:
                print(f"✗ 文件未创建")
        except Exception as e:
            print(f"✗ 失败: {e}")

    # 总结
    print(f"\n{'='*60}")
    print("测试结果总结")
    print(f"{'='*60}")

    total = len(results)
    passed = sum(1 for v in results.values() if v)
    failed = total - passed

    print(f"总计: {total}")
    print(f"通过: {passed}")
    print(f"失败: {failed}")

    if failed > 0:
        print(f"\n失败的测试:")
        for key, success in results.items():
            if not success:
                print(f"  - {key}")

    print(f"\n测试文件保存在: {test_dir}")

    return failed == 0

if __name__ == "__main__":
    import sys
    success = main()
    sys.exit(0 if success else 1)
