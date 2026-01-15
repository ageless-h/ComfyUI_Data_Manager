# -*- coding: utf-8 -*-
"""生成批量处理测试用的 100 张测试图像

创建 100 张 512x512 PNG 图像，每张图像包含可识别的编号
"""

import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# 测试图像目录
TEST_IMAGE_DIR = "backend/tests/fixtures/batch_test_images"
IMAGE_COUNT = 100
IMAGE_SIZE = (512, 512)


def create_test_image(index: int, output_dir: str) -> str:
    """创建单张测试图像

    Args:
        index: 图像编号 (1-100)
        output_dir: 输出目录

    Returns:
        保存的文件路径
    """
    # 创建 RGB 图像
    img = Image.new("RGB", IMAGE_SIZE, color=(240, 240, 240))
    draw = ImageDraw.Draw(img)

    # 使用不同颜色区分编号（渐变色）
    hue = (index * 3.6) % 360  # 0-360 度色相
    color = _hsv_to_rgb(hue, 0.7, 0.9)

    # 绘制彩色背景框
    margin = 50
    draw.rectangle(
        [margin, margin, IMAGE_SIZE[0] - margin, IMAGE_SIZE[1] - margin],
        fill=color,
        outline=(0, 0, 0),
        width=3
    )

    # 绘制编号文本
    text = f"#{index:03d}"
    text_color = (255, 255, 255)

    # 尝试使用系统字体，否则使用默认字体
    try:
        font = ImageFont.truetype("arial.ttf", 120)
    except:
        font = ImageFont.load_default()

    # 获取文本边界框
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    # 居中绘制文本
    text_x = (IMAGE_SIZE[0] - text_width) // 2
    text_y = (IMAGE_SIZE[1] - text_height) // 2

    # 绘制阴影
    draw.text((text_x + 3, text_y + 3), text, fill=(0, 0, 0), font=font)
    # 绘制文本
    draw.text((text_x, text_y), text, fill=text_color, font=font)

    # 保存图像
    filename = f"test_image_{index:03d}.png"
    filepath = os.path.join(output_dir, filename)
    img.save(filepath, "PNG")

    return filepath


def _hsv_to_rgb(h: float, s: float, v: float) -> tuple:
    """HSV 转 RGB

    Args:
        h: 色相 (0-360)
        s: 饱和度 (0-1)
        v: 明度 (0-1)

    Returns:
        (R, G, B) 元组，每个值 0-255
    """
    import colorsys
    r, g, b = colorsys.hsv_to_rgb(h / 360.0, s, v)
    return (int(r * 255), int(g * 255), int(b * 255))


def main():
    """生成所有测试图像"""
    print("\n" + "=" * 60)
    print("批量处理测试图像生成器")
    print("=" * 60)

    # 确保输出目录存在
    os.makedirs(TEST_IMAGE_DIR, exist_ok=True)

    # 清空现有文件
    existing_files = [f for f in os.listdir(TEST_IMAGE_DIR) if f.endswith(".png")]
    if existing_files:
        print(f"\n清理现有文件: {len(existing_files)} 个")
        for f in existing_files:
            os.remove(os.path.join(TEST_IMAGE_DIR, f))

    # 生成测试图像
    print(f"\n生成 {IMAGE_COUNT} 张测试图像...")
    print(f"目录: {TEST_IMAGE_DIR}")
    print(f"尺寸: {IMAGE_SIZE[0]}x{IMAGE_SIZE[1]}")

    for i in range(1, IMAGE_COUNT + 1):
        filepath = create_test_image(i, TEST_IMAGE_DIR)
        if i % 10 == 0:
            print(f"  进度: {i}/{IMAGE_COUNT}")

    # 验证
    generated_files = [f for f in os.listdir(TEST_IMAGE_DIR) if f.endswith(".png")]
    generated_files.sort()

    print(f"\n完成! 共生成 {len(generated_files)} 张图像")
    print(f"\n前 5 个文件:")
    for f in generated_files[:5]:
        filepath = os.path.join(TEST_IMAGE_DIR, f)
        size = os.path.getsize(filepath)
        print(f"  - {f} ({size} 字节)")

    print(f"\n后 5 个文件:")
    for f in generated_files[-5:]:
        filepath = os.path.join(TEST_IMAGE_DIR, f)
        size = os.path.getsize(filepath)
        print(f"  - {f} ({size} 字节)")

    print("\n" + "=" * 60)
    return True


if __name__ == "__main__":
    import sys
    success = main()
    sys.exit(0 if success else 1)
