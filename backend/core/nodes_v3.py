# -*- coding: utf-8 -*-
"""nodes_v3.py - ComfyUI V3 API 节点实现

支持 Node 2.0/Vue.js 架构的节点实现
使用 comfy_api.latest (V3) API
"""

import asyncio
import json
import os
import pickle
import shutil
from pathlib import Path
from typing import Dict, Any, Union, Tuple
from datetime import datetime
import numpy as np

from comfy_api.latest import ComfyExtension, io, InputImpl, Types
from typing_extensions import override
from fractions import Fraction

from ..helpers import save_file, list_files, get_file_info, get_file_category


# ============================================================================
# 图像保存功能
# ============================================================================

def save_image(tensor: np.ndarray, file_path: str, format: str = "png") -> str:
    """保存 ComfyUI 图像张量到文件

    支持格式: PNG, JPG/JPEG, WebP, BMP, TIFF/TIF, GIF
    支持通道: RGB (3通道), RGBA (4通道), 灰度 (1通道)

    Args:
        tensor: ComfyUI 图像张量 (Numpy array, shape: [H, W, C] 或 [B, H, W, C])
        file_path: 目标文件路径
        format: 图像格式 (png, jpg, jpeg, webp, bmp, tiff, tif, gif)

    Returns:
        保存后的完整文件路径
    """
    # 解析格式字符串：如果是 "类型 - 格式" 格式，提取出格式名
    if " - " in format:
        format = format.split(" - ")[-1].lower()
    else:
        format = format.lower()

    try:
        from PIL import Image
    except ImportError:
        raise ImportError("PIL/Pillow 未安装，无法保存图像")

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

    # 转换为 PIL Image，根据通道数选择模式
    if len(tensor.shape) == 2:
        # 灰度图像 [H, W]
        img = Image.fromarray(tensor, 'L')
    elif tensor.shape[2] == 1:
        # 灰度图像 [H, W, 1]
        img = Image.fromarray(tensor[:, :, 0], 'L')
    elif tensor.shape[2] == 2:
        # 灰度 + Alpha [H, W, 2]
        img = Image.fromarray(tensor[:, :, 0], 'L')
    elif tensor.shape[2] == 3:
        # RGB 图像 [H, W, 3]
        img = Image.fromarray(tensor, 'RGB')
    elif tensor.shape[2] == 4:
        # RGBA 图像 [H, W, 4]
        img = Image.fromarray(tensor, 'RGBA')
    else:
        raise ValueError(f"不支持的通道数: {tensor.shape[2]}")

    # 保存图像
    os.makedirs(Path(file_path).parent, exist_ok=True)

    save_kwargs = {}
    # 将格式名转换为 PIL 支持的格式
    pil_format = format.upper()

    # 格式映射和参数配置
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
        # TIFF 可以使用压缩
        save_kwargs["compression"] = "tiff_lzw"
    elif pil_format == "BMP":
        # BMP 无需特殊参数
        pass
    elif pil_format == "GIF":
        # GIF 只支持 256 色，PIL 会自动转换
        pass
    elif pil_format == "PNG":
        # PNG 可以使用压缩
        save_kwargs["optimize"] = True

    # JPEG 和 BMP 不支持透明通道，如果是 RGBA 需要转换为 RGB
    if pil_format in ["JPEG", "JPG", "BMP"] and img.mode == "RGBA":
        # 创建白色背景
        background = Image.new('RGB', img.size, (255, 255, 255))
        background.paste(img, mask=img.split()[3])  # 使用 alpha 通道作为掩码
        img = background

    img.save(file_path, pil_format, **save_kwargs)

    return file_path


def save_latent(latent_data: Dict[str, np.ndarray], file_path: str) -> str:
    """保存 Latent 数据到文件

    Args:
        latent_data: Latent 数据字典，通常包含 "samples" 键
        file_path: 目标文件路径

    Returns:
        保存后的完整文件路径
    """
    # 确保 file_path 有正确的扩展名
    path = Path(file_path)
    if path.suffix.lower() != ".latent":
        file_path = str(path.with_suffix(".latent"))

    # 保存为 pickle 格式
    os.makedirs(Path(file_path).parent, exist_ok=True)

    with open(file_path, 'wb') as f:
        pickle.dump(latent_data, f)

    return file_path


def save_conditioning(cond_data: Any, file_path: str) -> str:
    """保存 Conditioning 数据到文件

    Args:
        cond_data: Conditioning 数据
        file_path: 目标文件路径

    Returns:
        保存后的完整文件路径
    """
    # 确保 file_path 有正确的扩展名
    path = Path(file_path)
    if path.suffix.lower() != ".json":
        file_path = str(path.with_suffix(".json"))

    # 尝试转换为可序列化的格式
    os.makedirs(Path(file_path).parent, exist_ok=True)

    # 如果是列表，尝试序列化每个元素
    serializable_data = []
    if isinstance(cond_data, list):
        for item in cond_data:
            if hasattr(item, '__dict__'):
                serializable_data.append(str(item))
            else:
                serializable_data.append(item)
    else:
        serializable_data = str(cond_data)

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(serializable_data, f, ensure_ascii=False, indent=2)

    return file_path


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
        import torch
        if isinstance(frames, torch.Tensor):
            frames_np = frames.cpu().numpy()
        else:
            frames_np = frames

        # 转换为 uint8
        if frames_np.dtype != np.uint8:
            frames_np = (frames_np * 255).astype(np.uint8)

        # 使用 imageio 保存视频（比 OpenCV 更可靠）
        try:
            import imageio
        except ImportError:
            raise ImportError("imageio 未安装，无法保存视频。请运行: pip install imageio imageio-ffmpeg")

        # 格式对应的编码器配置
        codec_map = {
            "mp4": "libx264",      # H.264，最兼容
            "mov": "libx264",      # MOV 使用 H.264
            "avi": "mpeg4",        # MPEG-4 Part 2，AVI 更兼容
            "mkv": "libx264",      # MKV 使用 H.264
            "webm": "libvpx-vp9", # WebM 使用 VP9
        }

        # 格式支持的 pixelformat (注意：imageio 使用 pixelformat 不是 pixel_format)
        pixelformat_map = {
            "mp4": "yuv420p",      # 最兼容
            "mov": "yuv420p",
            "avi": "yuv420p",
            "mkv": "yuv420p",
            "webm": "yuv420p",
        }

        if format not in codec_map:
            raise ValueError(f"不支持的视频格式: {format}。支持的格式: {list(codec_map.keys())}")

        codec = codec_map[format]
        pixelformat = pixelformat_map[format]

        print(f"[DataManager] Using imageio: format={format}, codec={codec}")

        # 使用 imageio-ffmpeg 的参数
        writer_kwargs = {
            "fps": float(frame_rate),
            "codec": codec,
            "quality": 8,  # 用于 libx264 (0-10, 10是最佳质量)
            "pixelformat": pixelformat,
            "macro_block_size": 8,  # 避免尺寸不是16倍数的问题
        }

        # WebM 格式特殊处理
        if format == "webm":
            writer_kwargs["quality"] = 9  # VP9 质量设置

        writer = imageio.get_writer(file_path, **writer_kwargs)

        # 写入每一帧（imageio 使用 RGB 格式，不需要转换）
        for frame in frames_np:
            writer.append_data(frame)

        writer.close()
        print(f"[DataManager] Video saved successfully: {file_path}")

    return file_path


# ============================================================================
# 音频保存功能
# ============================================================================

def save_audio(data: Any, file_path: str, format: str = "mp3") -> str:
    """保存 ComfyUI 音频数据到文件

    支持格式: MP3, WAV, FLAC, OGG

    Args:
        data: ComfyUI 音频数据，格式为 {"waveform": Tensor, "sample_rate": int}
        file_path: 目标文件路径
        format: 音频格式 (mp3, wav, flac, ogg)

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

    # 提取音频数据
    # ComfyUI Audio 格式: {"waveform": Tensor, "sample_rate": int}
    if isinstance(data, dict):
        if "waveform" in data:
            waveform = data["waveform"]
            sample_rate = data.get("sample_rate", 44100)
        else:
            raise ValueError(f"音频数据缺少 'waveform' 键，包含的键: {list(data.keys())}")
    else:
        raise ValueError(f"不支持的音频数据类型: {type(data)}")

    # 转换为 numpy
    if hasattr(waveform, 'cpu'):  # torch.Tensor
        waveform_np = waveform.cpu().numpy()
    else:
        waveform_np = waveform

    # 转换为 float32 并归一化到 [-1, 1] 范围
    if waveform_np.dtype != np.float32:
        waveform_np = waveform_np.astype(np.float32)

    # 确保波形在 [-1, 1] 范围内
    if np.abs(waveform_np).max() > 1.0:
        waveform_np = waveform_np / np.abs(waveform_np).max()

    # PyAV 保存音频
    try:
        import av
    except ImportError:
        raise ImportError("PyAV (av) 未安装，无法保存音频。请运行: pip install av")

    # 格式对应的编码器配置
    codec_map = {
        "mp3": "libmp3lame",
        "wav": "pcm_s16le",
        "flac": "flac",
        "ogg": "libvorbis",
    }

    if format not in codec_map:
        raise ValueError(f"不支持的音频格式: {format}")

    codec = codec_map[format]

    print(f"[DataManager] Saving audio: format={format}, codec={codec}, sample_rate={sample_rate}")

    # 处理批次维度
    if len(waveform_np.shape) == 3:
        # [B, C, T] -> 取第一个批次
        waveform_np = waveform_np[0]

    # 确保是 [C, T] 格式 (通道数, 样本数)
    if len(waveform_np.shape) != 2:
        raise ValueError(f"不支持的音频形状: {waveform_np.shape}，期望 [C, T] 格式")

    num_channels = waveform_np.shape[0]
    num_samples = waveform_np.shape[1]

    # PyAV 需要交错格式数据: [1, C*T]
    # 将 [C, T] 转换为交错格式 [T*C]
    interleaved_data = waveform_np.T.flatten()  # [T*C]

    # 创建输出容器
    try:
        output_container = av.open(file_path, mode="w")
        stream = output_container.add_stream(codec, rate=sample_rate)
        print(f"[DataManager] Created output container: {file_path}")
    except Exception as e:
        print(f"[DataManager] ERROR: Failed to create output container: {e}")
        raise

    # 设置编码质量
    if format == "mp3":
        stream.codec_context.qscale = 2  # 高质量 (0-9, 越小质量越高)

    # PyAV 需要 layout='mono'，因为数据是交错的
    # stereo 会在编码时自动处理
    layout = "mono" if num_channels == 1 else "stereo"

    # 分帧写入音频
    frame_size = 1024
    frames_written = 0
    for i in range(0, num_samples, frame_size):
        try:
            # PyAV 要求 [1, samples*channels] 格式
            start = i * num_channels
            end = (i + frame_size) * num_channels
            frame_data = interleaved_data[start:end].reshape(1, -1)
            frame = av.AudioFrame.from_ndarray(
                frame_data,
                format="flt",
                layout=layout
            )
            frame.sample_rate = sample_rate
            for packet in stream.encode(frame):
                output_container.mux(packet)
                frames_written += 1
        except Exception as e:
            print(f"[DataManager] ERROR: Failed to encode frame at {i}: {e}")
            raise

    # 写入剩余的帧
    try:
        for packet in stream.encode():
            output_container.mux(packet)
            frames_written += 1
        output_container.close()
        print(f"[DataManager] Audio saved successfully: {file_path}, frames={frames_written}")
    except Exception as e:
        print(f"[DataManager] ERROR: Failed to finalize audio: {e}")
        raise

    return file_path


# ============================================================================
# 文件加载功能（与保存功能对应）
# ============================================================================

def load_image(file_path: str) -> tuple:
    """加载图像文件为 ComfyUI Tensor 格式

    支持格式: PNG, JPG/JPEG, WebP, BMP, TIFF, TIF, GIF
    支持通道: RGB (3通道), RGBA (4通道), 灰度 (1通道)

    Args:
        file_path: 图像文件路径

    Returns:
        (image_tensor, mask_tensor) - ComfyUI 标准图像格式
        - image_tensor: [1, H, W, 3] RGB torch.Tensor (float32, 范围 0-1)
        - mask_tensor: [1, H, W] 或 None

    Raises:
        FileNotFoundError: 文件不存在
        ImportError: PIL/Pillow 未安装
    """
    try:
        import torch
    except ImportError:
        raise ImportError("torch 未安装，无法加载图像")

    try:
        from PIL import Image
    except ImportError:
        raise ImportError("PIL/Pillow 未安装，无法加载图像")

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"图像文件不存在: {file_path}")

    img = Image.open(file_path)

    # 处理 EXIF 旋转
    from PIL import ImageOps
    img = ImageOps.exif_transpose(img)

    # 转换为 RGB
    if img.mode == 'I':
        img = img.point(lambda i: i * (1 / 255))
    image = img.convert("RGB")

    # 转换为 numpy array，然后转为 torch.Tensor
    # ComfyUI 格式: [1, H, W, 3], float32, 范围 0-1
    image = np.array(image).astype(np.float32) / 255.0
    image = torch.from_numpy(image)[None,]  # [1, H, W, 3]

    # 处理 mask (alpha 通道)
    if 'A' in img.getbands():
        mask = np.array(img.getchannel('A')).astype(np.float32) / 255.0
        mask = 1. - torch.from_numpy(mask)  # ComfyUI mask 是反向的
    elif img.mode == 'P' and 'transparency' in img.info:
        mask = np.array(img.convert('RGBA').getchannel('A')).astype(np.float32) / 255.0
        mask = 1. - torch.from_numpy(mask)
    else:
        mask = None

    img.close()

    return (image, mask)


def load_video(file_path: str):
    """加载视频文件为 ComfyUI VideoInput 格式

    支持格式: MP4, WebM, AVI, MOV, MKV（依赖 imageio 支持的格式）

    Args:
        file_path: 视频文件路径

    Returns:
        VideoInput 对象 (InputImpl.VideoFromFile)

    Raises:
        FileNotFoundError: 文件不存在
        ImportError: imageio 未安装
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"视频文件不存在: {file_path}")

    # 使用 ComfyUI 的 VideoFromFile 直接从文件加载
    # 这是最可靠的方式，让 ComfyUI 自己处理视频解码
    return InputImpl.VideoFromFile(file_path)


def load_audio(file_path: str) -> dict:
    """加载音频文件为 ComfyUI AUDIO 格式

    支持格式: MP3, WAV, FLAC, OGG（依赖 soundfile 支持的格式）

    Args:
        file_path: 音频文件路径

    Returns:
        {"waveform": tensor, "sample_rate": int}
        - waveform: [channels, samples] 音频张量 (torch.Tensor)
        - sample_rate: 采样率

    Raises:
        FileNotFoundError: 文件不存在
        ImportError: soundfile 未安装
    """
    try:
        import torch
    except ImportError:
        raise ImportError("torch 未安装，无法加载音频")

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"音频文件不存在: {file_path}")

    # 优先使用 soundfile 直接加载，避免 torchaudio 的依赖问题
    try:
        import soundfile as sf
        data, sample_rate = sf.read(file_path, always_2d=True)
        # soundfile 返回 [samples, channels] 格式，需要转置为 [channels, samples]
        waveform = torch.from_numpy(data.T).float()
    except ImportError:
        raise ImportError("soundfile 未安装，无法加载音频。请运行: pip install soundfile")
    except Exception as e:
        # 如果 soundfile 加载失败，尝试 torchaudio
        try:
            import torchaudio
            waveform, sample_rate = torchaudio.load(file_path)
        except ImportError:
            raise ImportError("torchaudio 未安装，无法加载音频")
        except Exception as e2:
            raise RuntimeError(f"无法加载音频文件: {e}, torchaudio 也失败: {e2}")

    return {
        "waveform": waveform.unsqueeze(0),  # [channels, samples] -> [1, channels, samples] 添加批次维度
        "sample_rate": sample_rate
    }


def load_latent(file_path: str) -> dict:
    """加载 .latent 文件为 ComfyUI LATENT 格式

    Args:
        file_path: .latent 文件路径

    Returns:
        {"samples": tensor} - ComfyUI latent 格式

    Raises:
        FileNotFoundError: 文件不存在
        pickle.PickleError: 文件格式错误
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Latent 文件不存在: {file_path}")

    # 使用 pickle 加载
    with open(file_path, 'rb') as f:
        latent_data = pickle.load(f)

    return latent_data


def load_conditioning(file_path: str) -> list:
    """加载 JSON 格式的 conditioning 数据

    Args:
        file_path: JSON 文件路径

    Returns:
        [[cond_data, ...]] - ComfyUI conditioning 格式

    Raises:
        FileNotFoundError: 文件不存在
        json.JSONDecodeError: JSON 格式错误
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Conditioning 文件不存在: {file_path}")

    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 返回 ComfyUI conditioning 格式
    return [[data]]


def parse_target_path(target_path: str, detected_type: str, format: str) -> Tuple[str, str]:
    """解析目标路径，返回目录和文件名

    Args:
        target_path: 用户输入的目标路径（可能是目录或完整文件路径）
        detected_type: 检测到的数据类型
        format: 文件格式

    Returns:
        (目录, 文件名)
    """
    path = Path(target_path)

    # 如果是完整文件路径（有扩展名）
    if path.suffix:
        directory = str(path.parent)
        filename = path.name
        # 确保扩展名匹配格式
        name_without_ext = path.stem
        if filename.split('.')[-1].lower() != format.lower():
            filename = f"{name_without_ext}.{format}"
    else:
        # 如果是目录路径，生成默认文件名
        directory = str(path)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"output_{timestamp}.{format}"

    return directory, filename


# ============================================================================
# 类型到文件格式的映射配置
# ============================================================================
TYPE_FORMAT_MAP = {
    "IMAGE": {
        "formats": ["png", "jpg", "jpeg", "webp", "bmp", "tiff", "tif", "gif"],
        "default": "png",
        "description": "图像格式"
    },
    "VIDEO": {
        "formats": ["mp4", "webm", "avi", "mov", "mkv"],
        "default": "mp4",
        "description": "视频格式"
    },
    "AUDIO": {
        "formats": ["mp3", "wav", "flac", "ogg"],
        "default": "mp3",
        "description": "音频格式"
    },
    "LATENT": {
        "formats": ["latent"],
        "default": "latent",
        "description": "Latent 数据"
    },
    "MASK": {
        "formats": ["png", "jpg", "jpeg", "webp", "bmp", "tiff", "tif"],
        "default": "png",
        "description": "遮罩格式"
    },
    "CONDITIONING": {
        "formats": ["json"],
        "default": "json",
        "description": "Conditioning 数据"
    },
    "STRING": {
        "formats": ["txt", "json"],
        "default": "txt",
        "description": "文本格式"
    },
}


# ============================================================================
# 扩展名到类型的映射表（用于文件加载）
# ============================================================================

# 文件扩展名到 ComfyUI 数据类型的映射表
EXTENSION_TO_TYPE_MAP = {
    # 图像格式（与 TYPE_FORMAT_MAP["IMAGE"]["formats"] 对应）
    "png": "IMAGE",
    "jpg": "IMAGE",
    "jpeg": "IMAGE",
    "webp": "IMAGE",
    "bmp": "IMAGE",
    "tiff": "IMAGE",
    "tif": "IMAGE",
    "gif": "IMAGE",
    # 视频格式
    "mp4": "VIDEO",
    "webm": "VIDEO",
    "avi": "VIDEO",
    "mov": "VIDEO",
    "mkv": "VIDEO",
    # 音频格式
    "mp3": "AUDIO",
    "wav": "AUDIO",
    "flac": "AUDIO",
    "ogg": "AUDIO",
    # Latent 格式（自定义格式）
    "latent": "LATENT",
    # Conditioning 格式
    "json": "CONDITIONING",
    # 文本格式
    "txt": "STRING",
}


def detect_type_from_extension(file_path: str) -> str:
    """根据文件扩展名检测 ComfyUI 数据类型

    Args:
        file_path: 文件路径

    Returns:
        检测到的类型名称（如 "IMAGE", "VIDEO" 等）
    """
    _, ext = os.path.splitext(file_path)
    ext = ext.lstrip('.').lower()
    return EXTENSION_TO_TYPE_MAP.get(ext, "STRING")


def get_format_for_type(detected_type: str) -> tuple[list[str], str]:
    """获取指定类型支持的格式列表

    Args:
        detected_type: 检测到的类型（如 IMAGE、VIDEO 等）

    Returns:
        (格式列表, 默认格式)
    """
    type_key = detected_type.upper()
    if type_key in TYPE_FORMAT_MAP:
        config = TYPE_FORMAT_MAP[type_key]
        return config["formats"], config["default"]
    # 默认返回 JSON 格式
    return ["json"], "json"


# ============================================================================
# 定义所有支持的 ComfyUI 数据类型
# ============================================================================
# 基础数据类型
BASIC_TYPES = [io.Boolean, io.Int, io.Float, io.String, io.Combo]

# 图像和视觉类型
IMAGE_TYPES = [io.Image, io.Mask, io.WanCameraEmbedding]

# Latent 和 Conditioning
LATENT_TYPES = [io.Latent, io.Conditioning]

# 模型类型
MODEL_TYPES = [
    io.Model,
    io.Vae,
    io.Clip,
    io.ClipVision,
    io.ControlNet,
    io.StyleModel,
    io.Gligen,
    io.UpscaleModel,
    io.LatentUpscaleModel,
    io.LoraModel,
]

# 音频和视频
MEDIA_TYPES = [io.Audio, io.AudioEncoder, io.AudioEncoderOutput, io.Video, io.Webcam]

# 采样相关
SAMPLER_TYPES = [io.Sampler, io.Sigmas, io.Noise, io.Guider]

# 高级和特殊类型
ADVANCED_TYPES = [
    io.ClipVisionOutput,
    io.TimestepsRange,
    io.LatentOperation,
    io.FlowControl,
    io.Accumulation,
    io.Hooks,
    io.HookKeyframes,
    io.LossMap,
    io.Tracks,
]

# 3D 模型类型
MODEL_3D_TYPES = [io.Load3D, io.Load3DAnimation, io.Load3DCamera, io.Voxel, io.Mesh, io.SVG]

# 其他扩展类型
EXTENDED_TYPES = [
    io.Photomaker,
    io.Point,
    io.FaceAnalysis,
    io.BBOX,
    io.SEGS,
]

# 所有支持的类型（合并所有类型列表）
ALL_SUPPORTED_TYPES = (
    BASIC_TYPES +
    IMAGE_TYPES +
    LATENT_TYPES +
    MODEL_TYPES +
    MEDIA_TYPES +
    SAMPLER_TYPES +
    ADVANCED_TYPES +
    MODEL_3D_TYPES +
    EXTENDED_TYPES
)


class DataManagerCore(io.ComfyNode):
    """核心文件管理器节点 - V3 API

    功能：
    - 通过 input 端口接收来自 InputPathConfig 的配置
    - 提供按钮打开文件管理器 UI
    - 通过 output 端口输出文件路径信息
    - 既是起点也是终点（is_output_node=True）
    """

    @classmethod
    def define_schema(cls) -> io.Schema:
        return io.Schema(
            node_id="DataManagerCore",
            display_name="Data Manager - Core",
            category="Data Manager",
            description="文件管理器核心节点 - 使用 UI 管理文件的保存和读取",
            inputs=[
                io.String.Input(
                    "input",
                    force_input=True,  # 纯连接端口，不显示文本框
                    optional=True,
                ),
            ],
            outputs=[
                io.String.Output("output", display_name="Output"),
            ],
            is_output_node=True,  # 设置为 True 使其可以作为终点节点
        )

    @classmethod
    def execute(
        cls,
        input: str = ""
    ) -> io.NodeOutput:
        """执行节点逻辑

        Args:
            input: 来自 InputPathConfig 的配置信息（JSON 字符串）

        Returns:
            输出文件路径（JSON 字符串）
        """
        # UI 操作会更新输出路径
        # 返回文件路径信息（JSON 字符串）
        return io.NodeOutput(input or "")


class InputPathConfig(io.ComfyNode):
    """输入路径配置节点 - 配置文件保存的目标目录，支持所有 ComfyUI 数据类型（动态端口）"""

    @classmethod
    def define_schema(cls) -> io.Schema:
        # 收集所有可能的格式选项，按类型分组显示
        all_formats = []
        for type_name, type_config in TYPE_FORMAT_MAP.items():
            type_desc = type_config["description"]
            for fmt in type_config["formats"]:
                # 格式：类型 - 格式名 (例如: 图像格式 - PNG)
                all_formats.append(f"{type_desc} - {fmt.upper()}")

        return io.Schema(
            node_id="InputPathConfig",
            display_name="Data Manager - Input Path",
            category="Data Manager/Config",
            description="配置文件保存的目标目录，支持所有 ComfyUI 数据类型输入（动态端口，自动识别类型）",
            inputs=[
                io.String.Input(
                    "target_path",
                    default="./output",
                    multiline=False,
                ),
                # 格式选择（按类型分组显示）
                io.Combo.Input(
                    "format",
                    options=all_formats,
                    default="图像格式 - PNG",
                ),
                # 使用 MultiType 实现真正的动态端口，支持所有 ComfyUI 数据类型
                io.MultiType.Input(
                    "file_input",
                    ALL_SUPPORTED_TYPES,
                    optional=True,
                ),
            ],
            outputs=[
                io.String.Output("output", display_name="Output"),
            ],
        )

    @classmethod
    def execute(
        cls,
        target_path: str,
        format: str,
        file_input = None
    ) -> io.NodeOutput:
        """处理动态类型的输入并保存文件

        Args:
            target_path: 目标保存路径（可以是目录或完整文件路径）
            format: 输出文件格式（如 "图像格式 - PNG" 或直接的 "png"）
            file_input: 动态类型输入（自动识别类型：IMAGE、STRING、LATENT、MASK、MODEL、VAE、VIDEO、AUDIO 等）

        Returns:
            JSON 格式的保存结果信息
        """
        # 解析格式字符串：如果是 "类型 - 格式" 格式，提取出格式名
        if " - " in format:
            format = format.split(" - ")[-1].lower()
        else:
            format = format.lower()

        print(f"[DataManager] Saving file: {target_path}, format: {format}")

        detected_type = "unknown"
        saved_path = None
        error_msg = None

        if file_input is None or file_input == "":
            config = {
                "type": "input",
                "target_path": target_path,
                "detected_type": "none",
                "format": format,
                "saved_path": None,
                "status": "no_input"
            }
            return io.NodeOutput(json.dumps(config, ensure_ascii=False))

        try:
            # 处理字典类型（ComfyUI 特殊格式）
            if isinstance(file_input, dict):
                # 检查是否是 AUDIO (必须在最前面)
                if "waveform" in file_input:
                    detected_type = "AUDIO"
                    print(f"[DataManager] Detected AUDIO type")

                    directory, filename = parse_target_path(target_path, detected_type, format)
                    full_path = os.path.join(directory, filename)
                    saved_path = save_audio(file_input, full_path, format)
                    print(f"[DataManager] Saved AUDIO to: {saved_path}")
                # 检查是否是 LATENT
                elif "samples" in file_input:
                    detected_type = "LATENT"
                    print(f"[DataManager] Detected LATENT type")
                    directory, filename = parse_target_path(target_path, detected_type, "latent")
                    full_path = os.path.join(directory, filename)
                    saved_path = save_latent(file_input, full_path)
                    print(f"[DataManager] Saved LATENT to: {saved_path}")
                # 检查是否是 CONDITIONING
                elif "pooled_output" in file_input or isinstance(file_input.get("model"), dict):
                    detected_type = "CONDITIONING"
                    print(f"[DataManager] Detected CONDITIONING type")
                    directory, filename = parse_target_path(target_path, detected_type, "json")
                    full_path = os.path.join(directory, filename)
                    saved_path = save_conditioning(file_input, full_path)
                    print(f"[DataManager] Saved CONDITIONING to: {saved_path}")
                # 检查是否是带 tensor 的图像
                elif "tensor" in file_input:
                    detected_type = "IMAGE"
                    print(f"[DataManager] Detected IMAGE (dict with tensor)")
                    tensor = file_input["tensor"]
                    directory, filename = parse_target_path(target_path, detected_type, format)
                    full_path = os.path.join(directory, filename)
                    saved_path = save_image(tensor, full_path, format)
                    print(f"[DataManager] Saved IMAGE to: {saved_path}")
                else:
                    error_msg = f"未知的字典类型，键: {list(file_input.keys())}"

            # 处理字符串类型
            elif isinstance(file_input, str):
                detected_type = "STRING"
                # 如果是文件路径，复制到目标位置
                if os.path.exists(file_input):
                    directory, filename = parse_target_path(target_path, detected_type, format)
                    os.makedirs(directory, exist_ok=True)
                    full_path = os.path.join(directory, filename)
                    shutil.copy2(file_input, full_path)
                    saved_path = full_path
                    print(f"[DataManager] Copied file to: {saved_path}")
                else:
                    # 保存为文本文件
                    directory, filename = parse_target_path(target_path, "STRING", format)
                    os.makedirs(directory, exist_ok=True)
                    full_path = os.path.join(directory, filename)
                    if format.lower() == "json":
                        # 尝试解析输入为 JSON 对象，格式化保存
                        try:
                            data = json.loads(file_input)
                            with open(full_path, 'w', encoding='utf-8') as f:
                                json.dump(data, f, ensure_ascii=False, indent=2)
                        except json.JSONDecodeError:
                            # 如果不是 JSON，作为普通文本保存
                            with open(full_path, 'w', encoding='utf-8') as f:
                                f.write(file_input)
                    else:
                        with open(full_path, 'w', encoding='utf-8') as f:
                            f.write(file_input)
                    saved_path = full_path
                    print(f"[DataManager] Saved text to: {saved_path}")

            # 处理张量类型
            elif hasattr(file_input, 'shape'):
                import torch

                if isinstance(file_input, torch.Tensor):
                    shape = file_input.shape
                    print(f"[DataManager] Tensor shape: {shape}, dtype: {file_input.dtype}")

                    if len(shape) == 4:
                        # 4D 张量
                        if shape[1] == 3:  # [B, C, H, W]
                            detected_type = "IMAGE"
                            tensor_np = file_input.cpu().numpy()[0].transpose(1, 2, 0)
                        elif shape[3] == 3:  # [B, H, W, C]
                            detected_type = "IMAGE"
                            tensor_np = file_input.cpu().numpy()[0]
                        else:
                            detected_type = "TENSOR"
                            error_msg = f"不支持的 4D 张量形状: {shape}"

                        if detected_type == "IMAGE":
                            directory, filename = parse_target_path(target_path, detected_type, format)
                            full_path = os.path.join(directory, filename)
                            saved_path = save_image(tensor_np, full_path, format)
                            print(f"[DataManager] Saved IMAGE to: {saved_path}")

                    elif len(shape) == 3:
                        # 3D 张量
                        if shape[0] == 1:  # [1, H, W] - MASK
                            detected_type = "MASK"
                            tensor_np = file_input.cpu().numpy()[0]
                            directory, filename = parse_target_path(target_path, detected_type, format)
                            full_path = os.path.join(directory, filename)
                            saved_path = save_image(tensor_np, full_path, format)
                            print(f"[DataManager] Saved MASK to: {saved_path}")
                        elif shape[2] == 3 or shape[2] == 4:  # [H, W, C] - IMAGE
                            detected_type = "IMAGE"
                            tensor_np = file_input.cpu().numpy()
                            directory, filename = parse_target_path(target_path, detected_type, format)
                            full_path = os.path.join(directory, filename)
                            saved_path = save_image(tensor_np, full_path, format)
                            print(f"[DataManager] Saved IMAGE to: {saved_path}")
                        else:
                            detected_type = "TENSOR"
                            error_msg = f"不支持的 3D 张量形状: {shape}"

                    elif len(shape) == 2:  # [H, W] - MASK
                        detected_type = "MASK"
                        tensor_np = file_input.cpu().numpy()
                        directory, filename = parse_target_path(target_path, detected_type, format)
                        full_path = os.path.join(directory, filename)
                        saved_path = save_image(tensor_np, full_path, format)
                        print(f"[DataManager] Saved MASK to: {saved_path}")

                    else:
                        detected_type = "TENSOR"
                        error_msg = f"不支持的张量形状: {shape}"

                elif isinstance(file_input, np.ndarray):
                    # NumPy 数组处理
                    shape = file_input.shape
                    print(f"[DataManager] NumPy shape: {shape}, dtype: {file_input.dtype}")

                    if len(shape) == 4 and shape[1] == 3:  # [B, C, H, W]
                        detected_type = "IMAGE"
                        tensor_np = file_input[0].transpose(1, 2, 0)
                    elif len(shape) == 4 and shape[3] == 3:  # [B, H, W, C]
                        detected_type = "IMAGE"
                        tensor_np = file_input[0]
                    elif len(shape) == 3 and shape[0] == 1:  # [1, H, W] - MASK
                        detected_type = "MASK"
                        tensor_np = file_input[0]
                    elif len(shape) == 3 and (shape[2] == 3 or shape[2] == 4):  # [H, W, C] - IMAGE
                        detected_type = "IMAGE"
                        tensor_np = file_input
                    elif len(shape) == 2:  # [H, W] - MASK
                        detected_type = "MASK"
                        tensor_np = file_input
                    else:
                        detected_type = "TENSOR"
                        error_msg = f"不支持的 NumPy 形状: {shape}"

                    if detected_type in ("IMAGE", "MASK"):
                        directory, filename = parse_target_path(target_path, detected_type, format)
                        full_path = os.path.join(directory, filename)
                        saved_path = save_image(tensor_np, full_path, format)
                        print(f"[DataManager] Saved {detected_type} to: {saved_path}")

            # 处理视频类型 - 使用属性检测而不是 isinstance(io.Video)
            # 因为 io.Video 只是类型标记，实际数据是 VideoInput 或 VideoComponents
            elif hasattr(file_input, 'get_components') or (
                hasattr(file_input, 'images') and
                hasattr(file_input, 'frame_rate')
            ):
                detected_type = "VIDEO"
                print(f"[DataManager] Detected VIDEO type")

                # 如果是 VideoInput，先获取 components
                if hasattr(file_input, 'get_components'):
                    video_data = file_input.get_components()
                    print(f"[DataManager] Got VideoComponents from VideoInput")
                else:
                    video_data = file_input
                    print(f"[DataManager] Using data as VideoComponents directly")

                directory, filename = parse_target_path(target_path, detected_type, format)
                full_path = os.path.join(directory, filename)
                saved_path = save_video(video_data, full_path, format)
                print(f"[DataManager] Saved VIDEO to: {saved_path}")

            # 其他类型，转为字符串保存
            else:
                detected_type = type(file_input).__name__
                directory, filename = parse_target_path(target_path, "DATA", "txt")
                os.makedirs(directory, exist_ok=True)
                full_path = os.path.join(directory, filename)
                with open(full_path, 'w', encoding='utf-8') as f:
                    f.write(str(file_input))
                saved_path = full_path
                print(f"[DataManager] Saved as text to: {saved_path}")

        except Exception as e:
            error_msg = str(e)
            import traceback
            traceback.print_exc()

        # 构建返回结果
        config = {
            "type": "input",
            "target_path": target_path,
            "detected_type": detected_type,
            "format": format,
            "saved_path": saved_path,
            "status": "success" if saved_path else "error",
            "error": error_msg
        }
        return io.NodeOutput(json.dumps(config, ensure_ascii=False))

class OutputPathConfig(io.ComfyNode):
    """输出路径配置节点 - 配置文件读取的源目录，支持所有 ComfyUI 数据类型输出（动态端口）"""

    @classmethod
    def define_schema(cls) -> io.Schema:
        # 创建支持多种类型的 MatchType 模板
        template = io.MatchType.Template(
            template_id="file_data_output",
            allowed_types=[
                io.Image,         # 图像
                io.Video,         # 视频
                io.Audio,         # 音频
                io.Latent,        # Latent
                io.Conditioning,  # Conditioning
                io.String,        # 字符串
                io.Mask,          # 遮罩
            ]
        )

        return io.Schema(
            node_id="OutputPathConfig",
            display_name="Data Manager - Output Path",
            category="Data Manager/Config",
            description="配置文件读取的源目录，支持所有 ComfyUI 数据类型输出（动态端口，自动识别类型）",
            inputs=[
                io.String.Input(
                    "source_path",
                    default="./input",
                    multiline=False,
                ),
                io.MultiType.Input(
                    "input",
                    ALL_SUPPORTED_TYPES,
                    optional=True,
                ),
            ],
            outputs=[
                # 使用 MatchType.Output 实现动态输出端口
                io.MatchType.Output(
                    template=template,
                    id="output",
                    display_name="Output"
                ),
            ],
        )

    @classmethod
    def execute(
        cls,
        source_path: str,
        input = None
    ) -> io.NodeOutput:
        """根据文件路径加载文件并转换为对应的 ComfyUI 数据类型

        Args:
            source_path: 源目录路径（当 input 为空时使用）
            input: 可选的文件路径输入（优先使用）

        Returns:
            对应类型的 ComfyUI 数据（IMAGE/VIDEO/AUDIO/LATENT/CONDITIONING/STRING）
        """
        # 1. 解析文件路径（优先使用 input 端口）
        file_path = None

        if input is not None and input != "":
            # 如果 input 是 JSON 字符串，尝试解析 path 字段
            if isinstance(input, str):
                try:
                    parsed = json.loads(input)
                    if isinstance(parsed, dict) and "path" in parsed:
                        file_path = parsed["path"]
                    else:
                        file_path = input
                except:
                    file_path = input
            else:
                file_path = str(input)

        # 如果没有 input，使用 source_path
        if not file_path:
            file_path = source_path

        # 2. 检查文件是否存在
        if not file_path or not os.path.exists(file_path):
            print(f"[DataManager] 文件不存在: {file_path}")
            # 返回文件路径字符串
            return io.NodeOutput(file_path or "")

        # 3. 根据扩展名检测文件类型
        detected_type = detect_type_from_extension(file_path)
        print(f"[DataManager] 检测到文件类型: {detected_type}, 路径: {file_path}")

        # 4. 根据类型加载文件
        try:
            if detected_type == "IMAGE":
                image, mask = load_image(file_path)
                return io.NodeOutput(image)

            elif detected_type == "VIDEO":
                video = load_video(file_path)
                return io.NodeOutput(video)

            elif detected_type == "AUDIO":
                audio = load_audio(file_path)
                return io.NodeOutput(audio)

            elif detected_type == "LATENT":
                latent = load_latent(file_path)
                return io.NodeOutput(latent)

            elif detected_type == "CONDITIONING":
                conditioning = load_conditioning(file_path)
                return io.NodeOutput(conditioning)

            elif detected_type == "STRING":
                # 读取文本文件内容并返回
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                return io.NodeOutput(content)

            else:
                # 默认返回文件路径字符串
                return io.NodeOutput(file_path)

        except Exception as e:
            print(f"[DataManager] 加载文件失败: {e}")
            import traceback
            traceback.print_exc()
            # 加载失败，对于 STRING 类型尝试读取文本内容
            if detected_type == "STRING" and os.path.exists(file_path):
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    return io.NodeOutput(content)
                except:
                    pass
            # 加载失败，返回文件路径字符串
            return io.NodeOutput(file_path)


class DataManagerExtension(ComfyExtension):
    """Data Manager 扩展注册类 - V3 API"""

    @override
    async def get_node_list(self):
        """返回扩展提供的节点列表"""
        return [
            DataManagerCore,
            InputPathConfig,
            OutputPathConfig,
        ]


async def comfy_entrypoint() -> DataManagerExtension:
    """ComfyUI V3 入口点"""
    return DataManagerExtension()
