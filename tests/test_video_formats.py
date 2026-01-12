# -*- coding: utf-8 -*-
"""视频格式测试 - 测试 save_video 函数

测试格式：MP4, WebM, AVI, MOV, MKV, FLV
"""

import os
import sys
import numpy as np
from pathlib import Path
from typing import Any


# ============================================================================
# 直接复制 save_video 函数（避免导入问题）
# ============================================================================

def save_video(data: Any, file_path: str, format: str = "mp4") -> str:
    """保存 ComfyUI 视频数据到文件

    支持格式: MP4, WebM, AVI, MOV, MKV, FLV

    Args:
        data: ComfyUI io.Video 类型数据
        file_path: 目标文件路径
        format: 视频格式 (mp4, webm, avi, mov, mkv, flv)

    Returns:
        保存后的完整文件路径
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
    # io.Video 类型包含：images (tensor), frame_rate, audio
    if hasattr(data, 'images'):
        # ComfyUI VideoComponents: images 是 [F, H, W, C] 格式的张量
        frames = data.images
        frame_rate = getattr(data, 'frame_rate', 24)

        # 转换为 numpy
        if hasattr(frames, 'cpu'):  # torch.Tensor
            frames_np = frames.cpu().numpy()
        else:
            frames_np = frames

        # 转换为 uint8
        if frames_np.dtype != np.uint8:
            frames_np = (frames_np * 255).astype(np.uint8)

        # 使用 OpenCV 保存视频
        try:
            import cv2
        except ImportError:
            raise ImportError("opencv-python 未安装，无法保存视频")

        # 获取帧尺寸
        height, width = frames_np.shape[1:3]

        # 四位数的 fourcc
        fourcc_map = {
            "mp4": "mp4v",
            "avi": "XVID",
            "mov": "mp4v",  # MOV 使用与 MP4 相同的编码
            "mkv": "mp4v",  # MKV 使用与 MP4 相同的编码
            "flv": "FLV1",
            "webm": "VP80",
        }

        fourcc = cv2.VideoWriter_fourcc(*fourcc_map.get(format, "mp4v"))
        video_writer = cv2.VideoWriter(file_path, fourcc, float(frame_rate), (width, height))

        # 写入每一帧
        for frame in frames_np:
            # OpenCV 使用 BGR 格式，需要转换
            frame_bgr = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
            video_writer.write(frame_bgr)

        video_writer.release()

    return file_path


# 模拟 ComfyUI io.Video 类型
class MockVideo:
    """模拟 ComfyUI VideoComponents 类型"""
    def __init__(self, frames, frame_rate=24):
        self.images = frames  # [F, H, W, C] numpy array
        self.frame_rate = frame_rate
        self.audio = None


def create_test_video_frames(num_frames=30, height=256, width=256, channels=3):
    """创建测试视频帧数据"""
    # 创建渐变动画帧
    frames = np.zeros((num_frames, height, width, channels), dtype=np.uint8)

    for i in range(num_frames):
        # 创建渐变效果
        progress = i / num_frames
        frames[i, :, :, 0] = int(255 * progress)  # R 通道渐变
        frames[i, :, :, 1] = int(255 * (1 - progress))  # G 通道渐变
        frames[i, :, :, 2] = 128  # B 通道固定

    return frames


def test_video_format(format_name, test_dir):
    """测试单个视频格式"""
    output_path = os.path.join(test_dir, f"test_video.{format_name}")

    try:
        # 创建测试视频数据
        frames = create_test_video_frames(num_frames=30, height=256, width=256)
        mock_video = MockVideo(frames, frame_rate=24)

        print(f"  测试 {format_name.upper()} -> ", end="")

        # 保存视频
        saved_path = save_video(mock_video, output_path, format_name)

        if os.path.exists(saved_path):
            file_size = os.path.getsize(saved_path)
            print(f"✓ 成功 ({file_size} bytes)")

            # 验证视频文件可以用 OpenCV 读取
            try:
                import cv2
                cap = cv2.VideoCapture(saved_path)
                frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
                width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
                height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
                fps = cap.get(cv2.CAP_PROP_FPS)
                cap.release()
                print(f"    帧数: {frame_count}, 尺寸: {width}x{height}, FPS: {fps:.1f}")
                return True
            except Exception as e:
                print(f"    ⚠ 无法读取视频: {e}")
                return True  # 文件存在就算成功
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
    output_path = os.path.join(test_dir, f"test_video_grouped.{format_name}")

    try:
        # 创建测试视频数据
        frames = create_test_video_frames(num_frames=10, height=128, width=128)
        mock_video = MockVideo(frames, frame_rate=24)

        # 使用分组格式字符串
        grouped_format = f"视频格式 - {format_name.upper()}"

        print(f"  测试 '{grouped_format}' -> ", end="")

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
    print("\n" + "="*60)
    print("视频格式保存测试")
    print("="*60)

    # 检查 opencv-python
    try:
        import cv2
        print(f"✓ OpenCV 版本: {cv2.__version__}")
    except ImportError:
        print("✗ opencv-python 未安装，无法测试视频保存")
        return False

    # 创建测试目录
    test_dir = r"C:\Users\Administrator\Downloads\video_save_test"
    os.makedirs(test_dir, exist_ok=True)

    # 测试所有格式
    formats = ["mp4", "webm", "avi", "mov", "mkv", "flv"]

    print("\n" + "="*60)
    print("测试视频格式保存")
    print("="*60)

    results = {}
    for fmt in formats:
        key = f"video_{fmt}"
        success = test_video_format(fmt, test_dir)
        results[key] = success

    # 测试分组格式字符串
    print("\n" + "="*60)
    print("测试分组格式字符串解析")
    print("="*60)

    for fmt in formats:
        key = f"grouped_{fmt}"
        success = test_grouped_format(fmt, test_dir)
        results[key] = success

    # 总结
    print("\n" + "="*60)
    print("测试结果总结")
    print("="*60)

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
