# -*- coding: utf-8 -*-
"""视频保存后端测试 - 独立测试 save_video 函数

测试格式：MP4, AVI, MKV, MOV, WebM
"""

import os
import sys
import numpy as np
from pathlib import Path
from fractions import Fraction
from typing import Any, Optional

# 添加项目路径
project_path = Path(__file__).parent.parent
sys.path.insert(0, str(project_path))


# ============================================================================
# 模拟 VideoComponents 类型
# ============================================================================


class MockVideoComponents:
    """模拟 ComfyUI VideoComponents 类型"""

    def __init__(self, images, frame_rate=24, audio=None, metadata=None):
        self.images = images  # numpy array [F, H, W, C]
        self.frame_rate = frame_rate if isinstance(frame_rate, Fraction) else Fraction(frame_rate)
        self.audio = audio
        self.metadata = metadata


# ============================================================================
# 直接复制 save_video 函数
# ============================================================================


def save_video(data: Any, file_path: str, format: str = "mp4") -> str:
    """保存 ComfyUI 视频数据到文件

    支持格式: MP4, AVI, MKV, MOV, WebM
    """
    # 解析格式字符串
    if " - " in format:
        format = format.split(" - ")[-1].lower()
    else:
        format = format.lower()

    # 确保 file_path 有正确的扩展名
    path = Path(file_path)
    if path.suffix.lower() != f".{format}":
        file_path = str(path.with_suffix(f".{format}"))

    # 创建目录
    os.makedirs(Path(file_path).parent, exist_ok=True)

    # 提取视频数据
    if hasattr(data, "images"):
        frames = data.images
        frame_rate = getattr(data, "frame_rate", 24)

        # 转换为 numpy
        if hasattr(frames, "cpu"):
            frames_np = frames.cpu().numpy()
        else:
            frames_np = frames

        # 转换为 uint8
        if frames_np.dtype != np.uint8:
            frames_np = (frames_np * 255).astype(np.uint8)

        # 使用 imageio 保存视频
        try:
            import imageio
        except ImportError:
            raise ImportError(
                "imageio 未安装，无法保存视频。请运行: pip install imageio imageio-ffmpeg"
            )

        # 格式对应的编码器配置
        codec_map = {
            "mp4": "libx264",
            "mov": "libx264",
            "avi": "mpeg4",  # MPEG-4 Part 2，AVI 更兼容
            "mkv": "libx264",
            "webm": "libvpx-vp9",
        }

        pixelformat_map = {
            "mp4": "yuv420p",
            "mov": "yuv420p",
            "avi": "yuv420p",
            "mkv": "yuv420p",
            "webm": "yuv420p",
        }

        if format not in codec_map:
            raise ValueError(f"不支持的视频格式: {format}")

        codec = codec_map[format]
        pixelformat = pixelformat_map[format]

        print(f"  Using imageio: format={format}, codec={codec}, pixelformat={pixelformat}")

        writer_kwargs = {
            "fps": float(frame_rate),
            "codec": codec,
            "quality": 8,
            "pixelformat": pixelformat,
            "macro_block_size": 8,
        }

        if format == "webm":
            writer_kwargs["quality"] = 9

        writer = imageio.get_writer(file_path, **writer_kwargs)

        for frame in frames_np:
            writer.append_data(frame)

        writer.close()

    return file_path


# ============================================================================
# 测试函数
# ============================================================================


def create_test_video(num_frames=30, height=256, width=256, channels=3):
    """创建测试视频数据"""
    frames = np.zeros((num_frames, height, width, channels), dtype=np.uint8)

    for i in range(num_frames):
        progress = i / num_frames
        frames[i, :, :, 0] = int(255 * progress)  # R 渐变
        frames[i, :, :, 1] = int(255 * (1 - progress))  # G 渐变
        frames[i, :, :, 2] = 128  # B 固定

    return frames


def test_video_format(format_name, test_dir):
    """测试单个视频格式"""
    output_path = os.path.join(test_dir, f"test_{format_name}.{format_name}")

    try:
        # 创建测试视频数据
        frames = create_test_video(num_frames=30, height=256, width=256)
        mock_video = MockVideoComponents(frames, frame_rate=24)

        print(f"测试 {format_name.upper()} -> ", end="")

        # 保存视频
        saved_path = save_video(mock_video, output_path, format_name)

        if os.path.exists(saved_path):
            file_size = os.path.getsize(saved_path)

            # 验证可以用 imageio 读取（不加载所有帧到内存）
            import imageio

            reader = imageio.get_reader(saved_path)
            meta_data = reader.get_meta_data()
            reader.close()

            print(f"✓ 成功 ({file_size} bytes, {meta_data.get('fps', 0)} FPS)")
            return True
        else:
            print(f"✗ 文件未创建")
            return False

    except Exception as e:
        print(f"✗ 失败: {e}")
        import traceback

        traceback.print_exc()
        return False


def test_grouped_format(format_name, test_dir):
    """测试分组格式字符串解析"""
    output_path = os.path.join(test_dir, f"test_grouped_{format_name}.{format_name}")

    try:
        frames = create_test_video(num_frames=10, height=128, width=128)
        mock_video = MockVideoComponents(frames, frame_rate=24)

        grouped_format = f"视频格式 - {format_name.upper()}"

        print(f"测试 '{grouped_format}' -> ", end="")

        saved_path = save_video(mock_video, output_path, grouped_format)

        if os.path.exists(saved_path):
            file_size = os.path.getsize(saved_path)
            print(f"✓ 成功 ({file_size} bytes)")
            return True
        else:
            print(f"✗ 文件未创建")
            return False

    except Exception as e:
        print(f"✗ 失败: {e}")
        return False


def main():
    print("\n" + "=" * 60)
    print("视频保存后端测试")
    print("=" * 60)

    # 检查 imageio
    try:
        import imageio

        print(f"✓ imageio 版本: {imageio.__version__}")
    except ImportError:
        print("✗ imageio 未安装")
        return False

    # 创建测试目录
    test_dir = r"C:\Users\Administrator\Downloads\video_save_backend_test"
    os.makedirs(test_dir, exist_ok=True)

    # 测试所有格式
    formats = ["mp4", "avi", "mkv", "mov", "webm"]

    print("\n" + "=" * 60)
    print("测试视频格式保存")
    print("=" * 60)

    results = {}
    for fmt in formats:
        key = f"video_{fmt}"
        success = test_video_format(fmt, test_dir)
        results[key] = success

    # 测试分组格式字符串
    print("\n" + "=" * 60)
    print("测试分组格式字符串解析")
    print("=" * 60)

    for fmt in formats:
        key = f"grouped_{fmt}"
        success = test_grouped_format(fmt, test_dir)
        results[key] = success

    # 总结
    print("\n" + "=" * 60)
    print("测试结果总结")
    print("=" * 60)

    total = len(results)
    passed = sum(1 for v in results.values() if v)
    failed = total - passed

    print(f"总计: {total}")
    print(f"通过: {passed}")
    print(f"失败: {failed}")

    if failed > 0:
        print("\n失败的测试:")
        for key, success in results.items():
            if not success:
                print(f"  - {key}")

    print(f"\n测试文件保存在: {test_dir}")

    return failed == 0


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
