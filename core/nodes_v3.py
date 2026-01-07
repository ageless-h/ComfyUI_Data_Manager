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
    """输入路径配置节点 - 配置文件保存的目标目录，支持多种文件类型输入"""

    @classmethod
    def define_schema(cls) -> io.Schema:
        return io.Schema(
            node_id="InputPathConfig",
            display_name="Data Manager - Input Path",
            category="Data Manager/Config",
            description="配置文件保存的目标目录，支持多种文件类型输入",
            inputs=[
                io.String.Input(
                    "target_path",
                    default="./output",
                    multiline=False,
                ),
                io.Combo.Input(
                    "file_type",
                    options=["string", "image", "audio", "video", "3d_model"],
                    default="image",
                    tooltip="输入文件类型",
                ),
                io.String.Input(
                    "file_input",
                    force_input=True,  # 纯连接端口，不显示文本框
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
        """输出配置的路径信息（JSON 格式）"""
        # 处理文件输入
        input_data = None
        if file_input is not None and file_input != "":
            if isinstance(file_input, dict):
                input_data = file_input
            elif isinstance(file_input, str):
                input_data = {"path": file_input}
            else:
                try:
                    input_data = str(file_input)
                except:
                    pass

        config = {
            "type": "input",
            "target_path": target_path,
            "file_type": file_type,
            "file_data": input_data,
        }
        return io.NodeOutput(json.dumps(config, ensure_ascii=False))


class OutputPathConfig(io.ComfyNode):
    """输出路径配置节点 - 配置文件读取的源目录，支持多种文件类型输出"""

    @classmethod
    def define_schema(cls) -> io.Schema:
        return io.Schema(
            node_id="OutputPathConfig",
            display_name="Data Manager - Output Path",
            category="Data Manager/Config",
            description="配置文件读取的源目录，支持多种文件类型输出",
            inputs=[
                io.String.Input(
                    "source_path",
                    default="./input",
                    multiline=False,
                ),
                io.Combo.Input(
                    "file_type",
                    options=["string", "image", "audio", "video", "3d_model"],
                    default="image",
                    tooltip="输出文件类型",
                ),
                io.String.Input(
                    "input",
                    force_input=True,  # 纯连接端口，不显示文本框
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
        input: str = ""
    ) -> io.NodeOutput:
        """根据文件路径加载文件并输出"""
        # 解析文件路径
        file_path = input
        try:
            parsed = json.loads(input)
            if isinstance(parsed, dict) and "path" in parsed:
                file_path = parsed["path"]
        except:
            pass

        # 根据 file_type 返回对应格式
        if file_type == "image" and file_path:
            # 加载图像：返回 ComfyUI 图像格式
            try:
                from nodes import LoadImageNode
                loader = LoadImageNode()
                result = loader.load_image(file_path)
                # 只返回图像数据
                return io.NodeOutput(result[0])
            except Exception as e:
                # 加载失败，返回文件路径字符串
                return io.NodeOutput(file_path)
        else:
            # 返回文件路径字符串
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


# V3 API 入口点
async def comfy_entrypoint() -> DataManagerExtension:
    """ComfyUI V3 入口点

    这是 ComfyUI 加载扩展时调用的函数
    """
    return DataManagerExtension()
