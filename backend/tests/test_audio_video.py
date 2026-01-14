# -*- coding: utf-8 -*-
"""测试音频、视频、文本格式的加载功能"""

import sys
import os

# 添加 ComfyUI 路径
comfyui_path = r"C:\Users\Administrator\Documents\ai\ComfyUI"
sys.path.insert(0, comfyui_path)

import torch
import numpy as np


def load_audio(file_path: str) -> dict:
    """加载音频文件为 ComfyUI AUDIO 格式"""
    try:
        import torch
    except ImportError:
        raise ImportError("torch 未安装，无法加载音频")

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"音频文件不存在: {file_path}")

    # 优先使用 soundfile 直接加载
    try:
        import soundfile as sf

        data, sample_rate = sf.read(file_path, always_2d=True)
        waveform = torch.from_numpy(data.T).float()
    except ImportError:
        raise ImportError("soundfile 未安装，无法加载音频。请运行: pip install soundfile")
    except Exception as e:
        try:
            import torchaudio

            waveform, sample_rate = torchaudio.load(file_path)
        except ImportError:
            raise ImportError("torchaudio 未安装，无法加载音频")
        except Exception as e2:
            raise RuntimeError(f"无法加载音频文件: {e}, torchaudio 也失败: {e2}")

    return {
        "waveform": waveform.unsqueeze(
            0
        ),  # [channels, samples] -> [1, channels, samples] 添加批次维度
        "sample_rate": sample_rate,
    }


def load_video(file_path: str):
    """加载视频文件为 ComfyUI VideoInput 格式"""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"视频文件不存在: {file_path}")

    try:
        from comfy_api.latest import InputImpl

        return InputImpl.VideoFromFile(file_path)
    except ImportError:
        raise ImportError("comfy_api 未安装，无法加载视频")


def load_conditioning(file_path: str) -> list:
    """加载 JSON 格式的 conditioning 数据"""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Conditioning 文件不存在: {file_path}")

    import json

    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    return [[data]]


def load_text(file_path: str) -> str:
    """加载文本文件"""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"文本文件不存在: {file_path}")

    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()


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
        "mkv": "VIDEO",
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


def test_audio_loading():
    """测试音频加载"""
    print("\n" + "=" * 60)
    print("测试音频加载 (AUDIO)")
    print("=" * 60)

    # 查找 Downloads 文件夹中的音频文件
    downloads_dir = r"C:\Users\Administrator\Downloads"
    audio_extensions = [".mp3", ".wav", ".flac", ".ogg"]

    test_files = []
    for f in os.listdir(downloads_dir):
        if any(f.lower().endswith(ext) for ext in audio_extensions):
            test_files.append(os.path.join(downloads_dir, f))

    if not test_files:
        print("  跳过: Downloads 文件夹中没有音频文件")
        return True

    results = []
    for audio_file in test_files:
        print(f"\n[测试] {os.path.basename(audio_file)}")
        detected_type = detect_type_from_extension(audio_file)
        print(f"  检测类型: {detected_type}")

        if detected_type != "AUDIO":
            print(f"  ✗ 检测类型不正确，期望 AUDIO")
            results.append((os.path.basename(audio_file), False))
            continue

        try:
            audio = load_audio(audio_file)

            # 验证返回格式
            if not isinstance(audio, dict):
                print(f"  ✗ 返回类型不是 dict: {type(audio)}")
                results.append((os.path.basename(audio_file), False))
                continue

            if "waveform" not in audio or "sample_rate" not in audio:
                print(f"  ✗ 缺少必需的键: {list(audio.keys())}")
                results.append((os.path.basename(audio_file), False))
                continue

            waveform = audio["waveform"]
            sample_rate = audio["sample_rate"]

            # 验证 waveform 是 torch.Tensor
            if not isinstance(waveform, torch.Tensor):
                print(f"  ✗ waveform 不是 torch.Tensor: {type(waveform)}")
                results.append((os.path.basename(audio_file), False))
                continue

            # 验证形状 [batch, channels, samples]
            if len(waveform.shape) != 3:
                print(f"  ✗ waveform 形状不正确: {waveform.shape}，期望 [batch, channels, samples]")
                results.append((os.path.basename(audio_file), False))
                continue

            # 验证批次维度为 1
            if waveform.shape[0] != 1:
                print(f"  ⚠ waveform 批次维度不是 1: {waveform.shape[0]}")

            print(
                f"  ✓ waveform 形状: {waveform.shape} (batch={waveform.shape[0]}, channels={waveform.shape[1]}, samples={waveform.shape[2]})"
            )
            print(f"  ✓ sample_rate: {sample_rate} Hz")

            # 验证可以调用 movedim (这是 ComfyUI 音频预览需要的关键操作)
            try:
                waveform[0].movedim(0, 1)  # [channels, samples] -> [samples, channels]
                print(f"  ✓ 可以调用 movedim(0, 1) 方法")
            except Exception as e:
                print(f"  ✗ 无法调用 movedim: {e}")
                results.append((os.path.basename(audio_file), False))
                continue

            print(f"  ✓ 音频加载成功")

            results.append((os.path.basename(audio_file), True))

        except Exception as e:
            print(f"  ✗ 加载失败: {e}")
            import traceback

            traceback.print_exc()
            results.append((os.path.basename(audio_file), False))

    # 总结
    print("\n[结果总结]")
    for name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"  {status}: {name}")

    return all(passed for _, passed in results)


def test_video_loading():
    """测试视频加载"""
    print("\n" + "=" * 60)
    print("测试视频加载 (VIDEO)")
    print("=" * 60)

    # 查找 Downloads 文件夹中的视频文件
    downloads_dir = r"C:\Users\Administrator\Downloads"
    video_extensions = [".mp4", ".webm", ".avi", ".mov", ".mkv"]

    test_files = []
    for f in os.listdir(downloads_dir):
        if any(f.lower().endswith(ext) for ext in video_extensions):
            test_files.append(os.path.join(downloads_dir, f))

    if not test_files:
        print("  跳过: Downloads 文件夹中没有视频文件")
        return True

    results = []
    for video_file in test_files:
        print(f"\n[测试] {os.path.basename(video_file)}")
        detected_type = detect_type_from_extension(video_file)
        print(f"  检测类型: {detected_type}")

        if detected_type != "VIDEO":
            print(f"  ✗ 检测类型不正确，期望 VIDEO")
            results.append((os.path.basename(video_file), False))
            continue

        try:
            video = load_video(video_file)
            print(f"  ✓ 视频加载成功: {type(video)}")
            results.append((os.path.basename(video_file), True))

        except Exception as e:
            print(f"  ✗ 加载失败: {e}")
            import traceback

            traceback.print_exc()
            results.append((os.path.basename(video_file), False))

    # 总结
    print("\n[结果总结]")
    for name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"  {status}: {name}")

    return all(passed for _, passed in results)


def test_text_loading():
    """测试文本/conditioning 加载"""
    print("\n" + "=" * 60)
    print("测试文本/Conditioning 加载")
    print("=" * 60)

    # 创建测试文件
    test_dir = r"C:\Users\Administrator\Downloads\test_formats"
    os.makedirs(test_dir, exist_ok=True)

    results = []

    # 测试 JSON
    print("\n[测试] JSON 文件")
    json_file = os.path.join(test_dir, "test.json")
    try:
        import json

        test_data = {"prompt": "a beautiful landscape", "steps": 20}
        with open(json_file, "w", encoding="utf-8") as f:
            json.dump(test_data, f, ensure_ascii=False, indent=2)

        detected = detect_type_from_extension(json_file)
        print(f"  检测类型: {detected}")

        if detected == "CONDITIONING":
            cond = load_conditioning(json_file)
            print(f"  ✓ Conditioning 加载成功: {type(cond)}")
            results.append(("JSON", True))
        else:
            print(f"  ✗ 检测类型不正确，期望 CONDITIONING")
            results.append(("JSON", False))

    except Exception as e:
        print(f"  ✗ 测试失败: {e}")
        results.append(("JSON", False))

    # 测试 TXT
    print("\n[测试] TXT 文件")
    txt_file = os.path.join(test_dir, "test.txt")
    try:
        with open(txt_file, "w", encoding="utf-8") as f:
            f.write("Hello, ComfyUI Data Manager!")

        detected = detect_type_from_extension(txt_file)
        print(f"  检测类型: {detected}")

        text = load_text(txt_file)
        print(f"  ✓ 文本加载成功: {text[:50]}...")
        results.append(("TXT", True))

    except Exception as e:
        print(f"  ✗ 测试失败: {e}")
        results.append(("TXT", False))

    # 清理
    import shutil

    try:
        shutil.rmtree(test_dir)
        print(f"\n✓ 清理测试目录")
    except:
        pass

    # 总结
    print("\n[结果总结]")
    for name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"  {status}: {name}")

    return all(passed for _, passed in results)


def main():
    print("\n" + "=" * 60)
    print("音频、视频、文本格式测试")
    print("=" * 60)

    results = []

    # 测试音频
    results.append(("音频加载", test_audio_loading()))

    # 测试视频
    results.append(("视频加载", test_video_loading()))

    # 测试文本
    results.append(("文本/Conditioning 加载", test_text_loading()))

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
