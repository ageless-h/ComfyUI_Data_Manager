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

from comfy_api.latest import ComfyExtension, io, _io
from typing_extensions import override

from ..utils import save_file, list_files, get_file_info, get_file_category


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
        "formats": ["mp4", "webm", "avi", "mov", "mkv", "flv"],
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
    "MODEL": {
        "formats": ["safetensors", "pt"],
        "default": "safetensors",
        "description": "模型格式"
    },
    "VAE": {
        "formats": ["safetensors", "pt"],
        "default": "safetensors",
        "description": "VAE 格式"
    },
    "CLIP": {
        "formats": ["safetensors", "pt"],
        "default": "safetensors",
        "description": "CLIP 格式"
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
                detected_type = "DICT"
                # 检查是否是 LATENT
                if "samples" in file_input:
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
                    directory, filename = parse_target_path(target_path, "STRING", "txt")
                    os.makedirs(directory, exist_ok=True)
                    full_path = os.path.join(directory, filename)
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
                io.String.Output("output", display_name="Output"),
            ],
        )

    @classmethod
    def execute(
        cls,
        source_path: str,
        input = None
    ) -> io.NodeOutput:
        """根据文件路径加载文件并输出"""
        return io.NodeOutput(source_path or (str(input) if input else ""))


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
