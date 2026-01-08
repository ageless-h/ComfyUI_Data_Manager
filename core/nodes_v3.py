# -*- coding: utf-8 -*-
"""nodes_v3.py - ComfyUI V3 API 节点实现

支持 Node 2.0/Vue.js 架构的节点实现
使用 comfy_api.latest (V3) API
"""

import asyncio
import json
import os
from typing import Dict, Any
from comfy_api.latest import ComfyExtension, io, _io
from typing_extensions import override

from ..utils import save_file, list_files, get_file_info, get_file_category


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
            is_output_node=False,
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
        return io.Schema(
            node_id="InputPathConfig",
            display_name="Data Manager - Input Path",
            category="Data Manager/Config",
            description="配置文件保存的目标目录，支持所有 ComfyUI 数据类型输入（动态端口）",
            inputs=[
                io.String.Input(
                    "target_path",
                    default="./output",
                    multiline=False,
                ),
                io.Combo.Input(
                    "file_type",
                    options=[
                        "string", "image", "mask", "latent", "conditioning",
                        "model", "vae", "clip", "controlnet", "upscale_model",
                        "audio", "video", "sampler", "noise", "3d_model", "other"
                    ],
                    default="image",
                    tooltip="输入文件类型",
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
        file_type: str = "image",
        file_input = None
    ) -> io.NodeOutput:
        """处理动态类型的输入并输出配置的路径信息（JSON 格式）

        Args:
            target_path: 目标保存路径
            file_type: 文件类型选择
            file_input: 动态类型输入（IMAGE、STRING、LATENT、MASK 等）

        Returns:
            JSON 格式的配置信息
        """
        # 处理文件输入
        input_data = None
        if file_input is not None and file_input != "":
            if isinstance(file_input, dict):
                # 处理字典类型（ComfyUI 图像、latent 等）
                input_data = file_input
            elif isinstance(file_input, str):
                # 字符串类型（文件路径）
                input_data = {"path": file_input}
            elif hasattr(file_input, 'shape'):
                # 处理张量类型（numpy array 或 torch tensor）
                try:
                    import torch
                    if isinstance(file_input, torch.Tensor):
                        input_data = {"tensor": file_input.cpu().numpy().tolist(), "dtype": str(file_input.dtype)}
                    else:
                        input_data = {"tensor": file_input.tolist(), "dtype": str(file_input.dtype)}
                except:
                    input_data = {"data": str(file_input)}
            else:
                # 其他类型，尝试转换为字符串
                try:
                    input_data = {"data": str(file_input)}
                except:
                    input_data = {"data": repr(file_input)}

        config = {
            "type": "input",
            "target_path": target_path,
            "file_type": file_type,
            "file_data": input_data,
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
            description="配置文件读取的源目录，支持所有 ComfyUI 数据类型输出（动态端口）",
            inputs=[
                io.String.Input(
                    "source_path",
                    default="./input",
                    multiline=False,
                ),
                io.Combo.Input(
                    "file_type",
                    options=[
                        "string", "image", "mask", "latent", "conditioning",
                        "model", "vae", "clip", "controlnet", "upscale_model",
                        "audio", "video", "sampler", "noise", "3d_model", "other"
                    ],
                    default="image",
                    tooltip="输出文件类型",
                ),
                # 使用 MultiType 实现真正的动态端口，支持所有 ComfyUI 数据类型
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
        file_type: str = "image",
        input = None
    ) -> io.NodeOutput:
        """根据文件路径加载文件并输出（支持动态类型输入）

        Args:
            source_path: 源目录路径
            file_type: 输出文件类型
            input: 动态类型输入（可以是 IMAGE、STRING、LATENT、MASK 等）

        Returns:
            根据配置输出的数据
        """
        # 解析文件路径或数据
        file_path = None
        file_data = None

        if input is not None and input != "":
            if isinstance(input, dict):
                # 处理字典类型配置
                if "path" in input:
                    file_path = input["path"]
                file_data = input
            elif isinstance(input, str):
                # 字符串类型，尝试解析为 JSON
                try:
                    parsed = json.loads(input)
                    if isinstance(parsed, dict):
                        file_path = parsed.get("path")
                        file_data = parsed
                    else:
                        file_path = input
                except:
                    file_path = input
            else:
                # 其他类型，直接使用
                file_data = input

        # 根据 file_type 返回对应格式
        if file_type == "image" and file_path:
            # 加载图像：返回 ComfyUI 图像格式
            try:
                from nodes import LoadImageNode
                loader = LoadImageNode()
                result = loader.load_image(file_path)
                return io.NodeOutput(result[0])  # 返回 IMAGE 类型
            except Exception as e:
                # 加载失败，返回文件路径字符串
                return io.NodeOutput(file_path)
        else:
            # 返回文件路径字符串
            return io.NodeOutput(file_path or "")


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


# V3 API 入口点
async def comfy_entrypoint() -> DataManagerExtension:
    """ComfyUI V3 入口点

    这是 ComfyUI 加载扩展时调用的函数
    """
    return DataManagerExtension()
