# -*- coding: utf-8 -*-
"""测试 core 模块 (nodes_v3, nodes_v1)"""

import os
import sys
import tempfile
import shutil
from pathlib import Path
from unittest.mock import MagicMock, patch
import numpy as np

# 添加项目根目录到路径
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

# 使用完整导入路径
import custom_nodes.ComfyUI_Data_Manager.core.nodes_v3 as nodes_v3


# ============================================================================
# 测试 nodes_v3.py - 图像保存功能
# ============================================================================

def test_save_image():
    """测试 save_image 函数"""
    print("\n" + "="*60)
    print("测试 save_image 函数")
    print("="*60)

    save_image = nodes_v3.save_image

    test_dir = os.path.join(tempfile.gettempdir(), "test_data_manager", "save_image")
    if os.path.exists(test_dir):
        shutil.rmtree(test_dir)
    os.makedirs(test_dir)

    # 创建测试张量 (RGB 图像)
    print("\n[测试 1] save_image (RGB 图像)")
    tensor = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    file_path = os.path.join(test_dir, "test_rgb.png")

    result = save_image(tensor, file_path, "png")
    assert os.path.exists(result), f"图像应该被保存: {result}"
    assert result.endswith(".png"), f"文件扩展名应该是 .png: {result}"
    print(f"  保存路径: {result}")
    print("  ✓ save_image (RGB) 测试通过")

    # 测试 JPEG 格式
    print("\n[测试 2] save_image (JPEG 格式)")
    tensor = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    file_path = os.path.join(test_dir, "test.jpg")

    result = save_image(tensor, file_path, "jpg")
    assert os.path.exists(result), f"图像应该被保存: {result}"
    print(f"  保存路径: {result}")
    print("  ✓ save_image (JPEG) 测试通过")

    # 测试 RGBA 图像
    print("\n[测试 3] save_image (RGBA 图像)")
    tensor = np.random.randint(0, 255, (100, 100, 4), dtype=np.uint8)
    file_path = os.path.join(test_dir, "test_rgba.png")

    result = save_image(tensor, file_path, "png")
    assert os.path.exists(result), f"图像应该被保存: {result}"
    print(f"  保存路径: {result}")
    print("  ✓ save_image (RGBA) 测试通过")

    # 测试 4D 张量 (自动取第一张)
    print("\n[测试 4] save_image (4D 张量)")
    tensor = np.random.randint(0, 255, (2, 100, 100, 3), dtype=np.uint8)
    file_path = os.path.join(test_dir, "test_4d.png")

    result = save_image(tensor, file_path, "png")
    assert os.path.exists(result), f"图像应该被保存: {result}"
    print(f"  保存路径: {result}")
    print("  ✓ save_image (4D 张量) 测试通过")

    # 测试 WebP 格式
    print("\n[测试 5] save_image (WebP 格式)")
    tensor = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    file_path = os.path.join(test_dir, "test.webp")

    result = save_image(tensor, file_path, "webp")
    assert os.path.exists(result), f"图像应该被保存: {result}"
    print(f"  保存路径: {result}")
    print("  ✓ save_image (WebP) 测试通过")

    # 测试格式名称包含 "类型 - 格式"
    print("\n[测试 6] save_image (格式带类型前缀)")
    tensor = np.random.randint(0, 255, (100, 100, 3), dtype=np.uint8)
    file_path = os.path.join(test_dir, "test_prefix.png")

    result = save_image(tensor, file_path, "image - png")
    assert os.path.exists(result), f"图像应该被保存: {result}"
    print(f"  保存路径: {result}")
    print("  ✓ save_image (格式带前缀) 测试通过")

    # 测试 3D 张量 (H, W, 1) - 灰度
    print("\n[测试 8] save_image (3D 单通道张量)")
    tensor = np.random.randint(0, 255, (100, 100, 1), dtype=np.uint8)
    file_path = os.path.join(test_dir, "test_3d_1ch.png")

    result = save_image(tensor, file_path, "png")
    assert os.path.exists(result), f"图像应该被保存: {result}"
    print(f"  保存路径: {result}")
    print("  ✓ save_image (3D 单通道) 测试通过")

    # 测试自动转换 uint8
    print("\n[测试 9] save_image (float32 转 uint8)")
    tensor = np.random.rand(100, 100, 3).astype(np.float32)
    file_path = os.path.join(test_dir, "test_float.png")

    result = save_image(tensor, file_path, "png")
    assert os.path.exists(result), f"图像应该被保存: {result}"
    print(f"  保存路径: {result}")
    print("  ✓ save_image (float32 转 uint8) 测试通过")

    # 测试不支持的格式
    print("\n[测试 10] save_image (不支持的通道数)")
    try:
        tensor = np.random.randint(0, 255, (100, 100, 5), dtype=np.uint8)
        file_path = os.path.join(test_dir, "test_invalid.png")
        save_image(tensor, file_path, "png")
        assert False, "应该抛出 ValueError"
    except ValueError as e:
        assert "不支持的通道数" in str(e)
        print(f"  错误信息: {e}")
        print("  ✓ save_image (不支持的通道数) 测试通过")

    # 清理
    shutil.rmtree(test_dir)

    print("\n✓ save_image 函数测试全部通过")
    return True


# ============================================================================
# 测试 parse_target_path
# ============================================================================

def test_parse_target_path():
    """测试 parse_target_path 函数"""
    print("\n" + "="*60)
    print("测试 parse_target_path 函数")
    print("="*60)

    parse_target_path = nodes_v3.parse_target_path

    test_dir = os.path.join(tempfile.gettempdir(), "test_data_manager", "parse_target")
    if os.path.exists(test_dir):
        shutil.rmtree(test_dir)
    os.makedirs(test_dir)

    # 创建测试文件
    test_file = os.path.join(test_dir, "test.txt")
    with open(test_file, 'w', encoding='utf-8') as f:
        f.write("测试内容")

    # 测试普通路径
    print("\n[测试 1] parse_target_path (普通路径)")
    directory, filename = parse_target_path(test_file, "IMAGE", "png")
    # 函数会修改扩展名为指定的格式
    assert filename == "test.png", f"文件名应该是 test.png（格式转换）: {filename}"
    print(f"  目录: {directory}")
    print(f"  文件名: {filename}")
    print("  ✓ parse_target_path (普通路径) 测试通过")

    # 测试相对路径带扩展名
    print("\n[测试 2] parse_target_path (相对路径带扩展名)")
    base_dir, filename = parse_target_path("output.png", "IMAGE", "png")
    assert filename == "output.png", f"文件名应该是 output.png: {filename}"
    print(f"  文件名: {filename}")
    print("  ✓ parse_target_path (相对路径带扩展名) 测试通过")

    # 测试相对路径不带扩展名 (使用提供的格式)
    print("\n[测试 3] parse_target_path (相对路径不带扩展名)")
    directory, filename = parse_target_path("output", "IMAGE", "png")
    # 函数会添加时间戳和扩展名
    assert filename.endswith(".png"), f"应该以 .png 结尾: {filename}"
    print(f"  文件名: {filename}")
    print("  ✓ parse_target_path (相对路径不带扩展名) 测试通过")

    # 测试视频格式
    print("\n[测试 4] parse_target_path (视频格式)")
    base_dir, filename = parse_target_path("video.mp4", "VIDEO", "mp4")
    assert filename == "video.mp4", f"文件名应该是 video.mp4: {filename}"
    print(f"  文件名: {filename}")
    print("  ✓ parse_target_path (视频格式) 测试通过")

    # 测试音频格式
    print("\n[测试 5] parse_target_path (音频格式)")
    base_dir, filename = parse_target_path("audio.mp3", "AUDIO", "mp3")
    assert filename == "audio.mp3", f"文件名应该是 audio.mp3: {filename}"
    print(f"  文件名: {filename}")
    print("  ✓ parse_target_path (音频格式) 测试通过")

    # 清理
    shutil.rmtree(test_dir)

    print("\n✓ parse_target_path 函数测试全部通过")
    return True


# ============================================================================
# 测试 save_latent
# ============================================================================

def test_save_latent():
    """测试 save_latent 函数"""
    print("\n" + "="*60)
    print("测试 save_latent 函数")
    print("="*60)

    save_latent = nodes_v3.save_latent

    test_dir = os.path.join(tempfile.gettempdir(), "test_data_manager", "save_latent")
    if os.path.exists(test_dir):
        shutil.rmtree(test_dir)
    os.makedirs(test_dir)

    # 创建测试 latent 数据
    print("\n[测试 1] save_latent (正常数据)")
    latent_data = {
        "model": np.random.rand(4, 64, 64).astype(np.float32),
        "diffusion_model": np.random.rand(4, 64, 64).astype(np.float32),
        "first_stage_model": np.random.rand(3, 64, 64).astype(np.float32),
    }
    file_path = os.path.join(test_dir, "test.safetensors")

    result = save_latent(latent_data, file_path)
    assert os.path.exists(result), f"文件应该被保存: {result}"
    print(f"  保存路径: {result}")
    print("  ✓ save_latent 测试通过")

    # 清理
    shutil.rmtree(test_dir)

    print("\n✓ save_latent 函数测试全部通过")
    return True


# ============================================================================
# 测试 save_conditioning
# ============================================================================

def test_save_conditioning():
    """测试 save_conditioning 函数"""
    print("\n" + "="*60)
    print("测试 save_conditioning 函数")
    print("="*60)

    save_conditioning = nodes_v3.save_conditioning

    test_dir = os.path.join(tempfile.gettempdir(), "test_data_manager", "save_cond")
    if os.path.exists(test_dir):
        shutil.rmtree(test_dir)
    os.makedirs(test_dir)

    # 创建测试 conditioning 数据
    print("\n[测试 1] save_conditioning (正常数据)")
    cond_data = {
        "cond": np.random.rand(77, 768).astype(np.float32),
        "pooled_cond": np.random.rand(768).astype(np.float32),
    }
    file_path = os.path.join(test_dir, "test_cond.pth")

    result = save_conditioning(cond_data, file_path)
    assert os.path.exists(result), f"文件应该被保存: {result}"
    print(f"  保存路径: {result}")
    print("  ✓ save_conditioning 测试通过")

    # 清理
    shutil.rmtree(test_dir)

    print("\n✓ save_conditioning 函数测试全部通过")
    return True


# ============================================================================
# 主函数
# ============================================================================

def main():
    print("\n" + "="*60)
    print("Core 模块测试")
    print("="*60)

    results = []

    results.append(("save_image", test_save_image()))
    results.append(("parse_target_path", test_parse_target_path()))
    results.append(("save_latent", test_save_latent()))
    results.append(("save_conditioning", test_save_conditioning()))

    print("\n" + "="*60)
    print("测试结果总结")
    print("="*60)

    all_passed = True
    for name, result in results:
        status = "✓ 通过" if result else "✗ 失败"
        if not result:
            all_passed = False
        print(f"  {name}: {status}")

    print("\n" + "="*60)
    if all_passed:
        print("✓ 所有 Core 模块测试通过")
    else:
        print("✗ 部分测试失败")
    print("="*60)

    return all_passed


if __name__ == "__main__":
    import sys
    success = main()
    sys.exit(0 if success else 1)
