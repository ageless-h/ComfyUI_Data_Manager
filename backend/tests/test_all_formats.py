# -*- coding: utf-8 -*-
"""综合测试 - 验证所有格式的 input/output 功能"""

import sys
import os

# 添加 ComfyUI 路径
comfyui_path = r"C:\Users\Administrator\Documents\ai\ComfyUI"
sys.path.insert(0, comfyui_path)

import torch
import numpy as np
from PIL import Image, ImageOps


def load_image(file_path: str):
    """加载图像文件为 ComfyUI Tensor 格式"""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"图像文件不存在: {file_path}")

    img = Image.open(file_path)
    img = ImageOps.exif_transpose(img)

    if img.mode == "I":
        img = img.point(lambda i: i * (1 / 255))
    image = img.convert("RGB")

    image = np.array(image).astype(np.float32) / 255.0
    image = torch.from_numpy(image)[None,]

    if "A" in img.getbands():
        mask = np.array(img.getchannel("A")).astype(np.float32) / 255.0
        mask = 1.0 - torch.from_numpy(mask)
    elif img.mode == "P" and "transparency" in img.info:
        mask = np.array(img.convert("RGBA").getchannel("A")).astype(np.float32) / 255.0
        mask = 1.0 - torch.from_numpy(mask)
    else:
        mask = None

    img.close()

    return (image, mask)


def save_image(tensor: np.ndarray, file_path: str, format: str = "png") -> str:
    """保存 ComfyUI 图像张量到文件"""
    if " - " in format:
        format = format.split(" - ")[-1].lower()
    else:
        format = format.lower()

    path = os.path.dirname(file_path)
    if path:
        os.makedirs(path, exist_ok=True)

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
        img = Image.fromarray(tensor, "L")
    elif tensor.shape[2] == 1:
        img = Image.fromarray(tensor[:, :, 0], "L")
    elif tensor.shape[2] == 3:
        img = Image.fromarray(tensor, "RGB")
    elif tensor.shape[2] == 4:
        img = Image.fromarray(tensor, "RGBA")
    else:
        raise ValueError(f"不支持的通道数: {tensor.shape[2]}")

    # 确保文件扩展名正确
    if not file_path.endswith(f".{format}"):
        file_path = f"{os.path.splitext(file_path)[0]}.{format}"

    # 保存参数
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
    elif pil_format == "PNG":
        save_kwargs["optimize"] = True

    # JPEG 和 BMP 不支持透明通道
    if pil_format in ["JPEG", "JPG", "BMP"] and img.mode == "RGBA":
        background = Image.new("RGB", img.size, (255, 255, 255))
        background.paste(img, mask=img.split()[3])
        img = background

    img.save(file_path, pil_format, **save_kwargs)

    return file_path


def detect_type_from_extension(file_path: str) -> str:
    """根据文件扩展名检测 ComfyUI 数据类型"""
    ext_map = {
        "png": "IMAGE",
        "jpg": "IMAGE",
        "jpeg": "IMAGE",
        "webp": "IMAGE",
        "bmp": "IMAGE",
        "tiff": "IMAGE",
        "tif": "IMAGE",
        "gif": "IMAGE",
        "mp4": "VIDEO",
        "webm": "VIDEO",
        "avi": "VIDEO",
        "mov": "VIDEO",
        "mp3": "AUDIO",
        "wav": "AUDIO",
        "flac": "AUDIO",
        "ogg": "AUDIO",
        "latent": "LATENT",
        "json": "CONDITIONING",
        "txt": "STRING",
    }
    _, ext = os.path.splitext(file_path)
    ext = ext.lstrip(".").lower()
    return ext_map.get(ext, "STRING")


def test_image_formats():
    """测试所有图像格式的加载和保存"""
    print("\n" + "=" * 60)
    print("测试图像格式 (IMAGE)")
    print("=" * 60)

    formats_to_test = ["png", "jpg", "jpeg", "webp", "bmp"]
    test_dir = r"C:\Users\Administrator\Downloads\test_formats"
    os.makedirs(test_dir, exist_ok=True)

    results = []

    for fmt in formats_to_test:
        print(f"\n[测试] {fmt.upper()} 格式")

        try:
            # 1. 创建测试图像
            test_array = np.random.randint(0, 255, (128, 128, 3), dtype=np.uint8)
            test_img = Image.fromarray(test_array)

            # 2. 保存
            save_path = os.path.join(test_dir, f"test.{fmt}")
            test_img.save(save_path)
            print(f"  ✓ 保存测试图像: {save_path}")

            # 3. 使用 load_image 加载
            image, mask = load_image(save_path)

            # 4. 验证返回 torch.Tensor
            if isinstance(image, torch.Tensor):
                print(f"  ✓ load_image 返回 torch.Tensor")
            else:
                print(f"  ✗ load_image 返回 {type(image)}")
                results.append((fmt, False))
                continue

            # 5. 验证可以调用 .cpu() 方法
            try:
                image.cpu()
                print(f"  ✓ 可以调用 .cpu() 方法")
            except AttributeError as e:
                print(f"  ✗ 无法调用 .cpu() 方法: {e}")
                results.append((fmt, False))
                continue

            # 6. 验证形状
            if image.shape[0] == 1 and image.shape[3] == 3:
                print(f"  ✓ 形状正确: {image.shape}")
            else:
                print(f"  ✗ 形状不正确: {image.shape}")
                results.append((fmt, False))
                continue

            # 7. 转回 numpy 并保存（验证往返）
            reload_np = image.cpu().numpy()[0]
            output_path = os.path.join(test_dir, f"test_reload.{fmt}")
            save_image(reload_np, output_path, fmt)
            print(f"  ✓ 往返保存成功: {output_path}")

            results.append((fmt, True))

        except Exception as e:
            print(f"  ✗ 测试失败: {e}")
            import traceback

            traceback.print_exc()
            results.append((fmt, False))

    # 清理
    import shutil

    try:
        shutil.rmtree(test_dir)
        print(f"\n✓ 清理测试目录: {test_dir}")
    except:
        pass

    # 总结
    print("\n[结果总结]")
    for fmt, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"  {status}: {fmt.upper()}")

    return all(passed for _, passed in results)


def test_file_detection():
    """测试文件类型检测"""
    print("\n" + "=" * 60)
    print("测试文件类型检测")
    print("=" * 60)

    test_cases = [
        ("test.png", "IMAGE"),
        ("test.jpg", "IMAGE"),
        ("test.jpeg", "IMAGE"),
        ("test.webp", "IMAGE"),
        ("test.mp4", "VIDEO"),
        ("test.mp3", "AUDIO"),
        ("test.wav", "AUDIO"),
        ("test.latent", "LATENT"),
        ("test.json", "CONDITIONING"),
        ("test.txt", "STRING"),
    ]

    results = []
    for filename, expected_type in test_cases:
        detected = detect_type_from_extension(filename)
        status = detected == expected_type
        results.append((filename, expected_type, detected, status))
        symbol = "✓" if status else "✗"
        print(f"  {symbol} {filename}: {detected} (期望: {expected_type})")

    return all(status for _, _, _, status in results)


def test_actual_image_file():
    """测试使用实际的图像文件"""
    print("\n" + "=" * 60)
    print("测试实际图像文件")
    print("=" * 60)

    test_file = r"C:\Users\Administrator\Downloads\1.jpg"

    if not os.path.exists(test_file):
        print(f"  跳过: 测试文件不存在 {test_file}")
        return True

    print(f"  测试文件: {test_file}")

    try:
        # 检测文件类型
        detected = detect_type_from_extension(test_file)
        print(f"  检测类型: {detected}")

        # 加载图像
        image, mask = load_image(test_file)

        # 验证类型
        if not isinstance(image, torch.Tensor):
            print(f"  ✗ 返回类型不是 torch.Tensor: {type(image)}")
            return False

        # 验证可以调用 .cpu() 方法
        try:
            image.cpu()
        except AttributeError:
            print(f"  ✗ 无法调用 .cpu() 方法")
            return False

        # 验证可以转换为 numpy
        try:
            np_array = image.cpu().numpy()
            print(f"  ✓ 可以转换为 numpy: shape={np_array.shape}")
        except Exception as e:
            print(f"  ✗ 无法转换为 numpy: {e}")
            return False

        print(f"  ✓ 所有测试通过")
        return True

    except Exception as e:
        print(f"  ✗ 测试失败: {e}")
        import traceback

        traceback.print_exc()
        return False


def main():
    print("\n" + "=" * 60)
    print("ComfyUI Data Manager - 综合格式测试")
    print("=" * 60)

    results = []

    # 测试 1: 文件类型检测
    results.append(("文件类型检测", test_file_detection()))

    # 测试 2: 图像格式
    results.append(("图像格式加载/保存", test_image_formats()))

    # 测试 3: 实际文件
    results.append(("实际图像文件", test_actual_image_file()))

    # 总结
    print("\n" + "=" * 60)
    print("最终结果")
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
