# -*- coding: utf-8 -*-
"""nodes_v1.py - ComfyUI V1 API 节点实现

支持旧版 ComfyUI (Node 1.0) 的节点实现
使用传统的 NODE_CLASS_MAPPINGS 方式
"""

import json
import os
from typing import Tuple, Dict, Any
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.helpers import save_file, list_files, get_file_info


class DataManagerCore:
    """核心文件管理器节点 - V1 API

    功能：
    - 通过 input 端口接收来自 InputPathConfig 的配置
    - 提供按钮打开文件管理器 UI
    - 通过 output 端口输出文件路径信息
    """

    CATEGORY = "Data Manager"
    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("output",)
    FUNCTION = "process"
    OUTPUT_NODE = False
    COLOR = "#9b59b6"

    @classmethod
    def INPUT_TYPES(cls) -> Dict[str, Any]:
        """定义输入类型 - V1 API"""
        return {
            "required": {},
            "optional": {
                # 接收来自 InputPathConfig 的配置（路径+文件）
                "input": (
                    "STRING",
                    {
                        "forceInput": True,  # 纯连接端口，不显示文本框
                        "tooltip": "来自 InputPathConfig 的配置（路径+文件）",
                    },
                ),
            },
        }

    def process(self, input: str = "") -> Tuple[str]:
        """执行节点逻辑 - V1 API

        Args:
            input: 来自 InputPathConfig 的配置信息（JSON 字符串）

        Returns:
            输出文件路径（JSON 字符串）
        """
        # UI 操作会更新输出
        # 返回文件路径信息（JSON 字符串）
        return (input or "",)


class InputPathConfig:
    """输入路径配置节点 - V1 API

    配置文件保存的目标目录，支持多种文件类型输入
    """

    CATEGORY = "Data Manager/Config"
    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("output",)
    FUNCTION = "process"
    COLOR = "#4a90e2"

    @classmethod
    def INPUT_TYPES(cls) -> Dict[str, Any]:
        return {
            "required": {
                "target_path": ("STRING", {"default": "./output", "tooltip": "文件保存的目标目录"}),
                "file_type": (
                    ["string", "image", "audio", "video", "3d_model"],
                    {"default": "image", "tooltip": "输入文件类型"},
                ),
            },
            "optional": {
                # 可选的文件输入端口（纯连接端口）
                "file_input": (
                    "STRING",
                    {"forceInput": True, "tooltip": "可选的文件输入"},  # 纯连接端口，不显示文本框
                ),
            },
        }

    def process(self, target_path: str, file_type: str = "image", file_input=None) -> Tuple[str]:
        """输出配置的路径信息（JSON 格式）"""
        # 处理文件输入
        input_data = None
        if file_input is not None:
            if isinstance(file_input, dict):
                input_data = file_input
            elif isinstance(file_input, str):
                input_data = {"path": file_input}
            else:
                # 尝试转换为字符串
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
        return (json.dumps(config, ensure_ascii=False),)


class OutputPathConfig:
    """输出路径配置节点 - V1 API

    配置文件读取的源目录，支持多种文件类型输出
    """

    CATEGORY = "Data Manager/Config"
    RETURN_TYPES = ("STRING",)  # 只返回 output
    RETURN_NAMES = ("output",)
    FUNCTION = "process"
    COLOR = "#50c878"

    @classmethod
    def INPUT_TYPES(cls) -> Dict[str, Any]:
        return {
            "required": {
                "source_path": ("STRING", {"default": "./input", "tooltip": "文件读取的源目录"}),
                "file_type": (
                    ["string", "image", "audio", "video", "3d_model"],
                    {"default": "image", "tooltip": "输出文件类型"},
                ),
            },
            "optional": {
                # 来自 Core 节点的连接（纯连接端口）
                "input": (
                    "STRING",
                    {
                        "forceInput": True,  # 纯连接端口，不显示文本框
                        "tooltip": "来自 DataManagerCore 的文件路径",
                    },
                ),
            },
        }

    def process(self, source_path: str, file_type: str = "image", input: str = "") -> Tuple[str]:
        """根据文件路径加载文件并输出

        Args:
            source_path: 源目录
            file_type: 文件类型
            input: 来自 DataManagerCore 的文件路径（JSON 字符串）

        Returns:
            output - 文件数据或文件路径
        """
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
                # 返回图像数据
                return (result[0],)  # 只返回 image
            except Exception as e:
                # 加载失败，返回文件路径字符串
                return (file_path,)
        else:
            # 返回文件路径字符串
            return (file_path,)


class BatchPathLoader:
    """批量路径加载节点 - V1 API

    扫描目录中的文件并返回路径列表，触发 ComfyUI 自动迭代处理

    功能：
    - 使用通配符扫描目录
    - 返回文件路径字符串列表
    - 触发 ComfyUI 自动迭代机制
    - 保持原图大小
    """

    CATEGORY = "Data Manager"
    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("paths",)
    FUNCTION = "load_batch"
    OUTPUT_IS_LIST = (True,)  # 关键：触发 ComfyUI 自动迭代
    INPUT_IS_LIST = False
    COLOR = "#e74c3c"

    @classmethod
    def INPUT_TYPES(cls) -> Dict[str, Any]:
        return {
            "required": {
                "source_path": ("STRING", {"default": "./input", "tooltip": "文件读取的源目录"}),
                "pattern": ("STRING", {"default": "*.*", "tooltip": "glob 通配符模式"}),
            },
            "optional": {},
        }

    def load_batch(self, source_path: str, pattern: str = "*.*") -> Tuple[str]:
        """批量加载文件路径

        Args:
            source_path: 源目录
            pattern: glob 通配符模式

        Returns:
            文件路径字符串元组（ComfyUI 会自动迭代处理每个路径）
        """
        from ..helpers.batch_scanner import scan_files

        print(f"[BatchPathLoader] 扫描目录: {source_path}, pattern: {pattern}")

        # 检查目录是否存在
        if not os.path.exists(source_path):
            print(f"[BatchPathLoader] 目录不存在: {source_path}")
            return ("",)

        if not os.path.isdir(source_path):
            print(f"[BatchPathLoader] 路径不是目录: {source_path}")
            return ("",)

        # 扫描文件
        try:
            rel_paths = scan_files(source_path, pattern, recursive="**" in pattern)
            print(f"[BatchPathLoader] 扫描到 {len(rel_paths)} 个文件")

            # 转换为绝对路径
            abs_paths = [os.path.normpath(os.path.join(source_path, p)) for p in rel_paths]

            if not abs_paths:
                print(f"[BatchPathLoader] 未找到匹配的文件")
                return ("",)

            print(f"[BatchPathLoader] 返回 {len(abs_paths)} 个路径，ComfyUI 将自动迭代处理")
            return tuple(abs_paths)  # 返回元组，OUTPUT_IS_LIST 会触发迭代

        except Exception as e:
            print(f"[BatchPathLoader] 扫描失败: {e}")
            import traceback
            traceback.print_exc()
            return ("",)


# V1 API 节点映射
NODE_CLASS_MAPPINGS = {
    "DataManagerCore": DataManagerCore,
    "InputPathConfig": InputPathConfig,
    "OutputPathConfig": OutputPathConfig,
    "BatchPathLoader": BatchPathLoader,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "DataManagerCore": "Data Manager - Core",
    "InputPathConfig": "Data Manager - Input Path",
    "OutputPathConfig": "Data Manager - Output Path",
    "BatchPathLoader": "Data Manager - Batch Path Loader",
}

# V1 API 前端目录
WEB_DIRECTORY = "./web"
