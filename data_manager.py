# -*- coding: utf-8 -*-
"""data_manager.py - ComfyUI Data Manager 核心模块

节点架构：
1. InputPathConfig - 配置输入路径节点
2. OutputPathConfig - 配置输出路径节点
3. DataManagerCore - 核心文件管理器节点（动态端口 + UI操作）
"""

import os
import json
import shutil
from pathlib import Path
from typing import Tuple, Dict, Any, List, Optional
from datetime import datetime


class InputPathConfig:
    """输入路径配置节点 - 配置文件来源路径"""

    CATEGORY = "Data Manager/Config"
    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("input_path",)
    FUNCTION = "get_path"
    COLOR = "#4a90e2"

    @classmethod
    def INPUT_TYPES(cls) -> Dict[str, Any]:
        return {
            "required": {
                "path_type": (["directory", "single_file", "wildcard"], {
                    "default": "directory",
                    "tooltip": "路径类型：目录、单个文件、通配符模式"
                }),
                "path": ("STRING", {
                    "default": "./input",
                    "multiline": False,
                    "tooltip": "输入路径"
                }),
            },
            "optional": {
                "filter_pattern": ("STRING", {
                    "default": "*.*",
                    "tooltip": "文件过滤模式 (如: *.png, *.jpg)"
                }),
                "recursive": ("BOOLEAN", {
                    "default": False,
                    "tooltip": "递归搜索子目录"
                }),
            },
        }

    def get_path(
        self,
        path_type: str,
        path: str,
        filter_pattern: str = "*.*",
        recursive: bool = False,
    ) -> Tuple[str]:
        """返回配置的输入路径信息（JSON格式）"""
        config = {
            "type": "input",
            "path_type": path_type,
            "path": os.path.abspath(path) if path else "",
            "filter": filter_pattern,
            "recursive": recursive,
        }
        return (json.dumps(config, ensure_ascii=False),)


class OutputPathConfig:
    """输出路径配置节点 - 配置文件保存路径"""

    CATEGORY = "Data Manager/Config"
    RETURN_TYPES = ("STRING",)
    RETURN_NAMES = ("output_path",)
    FUNCTION = "get_path"
    COLOR = "#50c878"

    @classmethod
    def INPUT_TYPES(cls) -> Dict[str, Any]:
        return {
            "required": {
                "output_type": (["directory", "auto_name", "custom_name"], {
                    "default": "directory",
                    "tooltip": "输出类型：目录、自动命名、自定义名称"
                }),
                "path": ("STRING", {
                    "default": "./output",
                    "multiline": False,
                    "tooltip": "输出路径"
                }),
            },
            "optional": {
                "file_prefix": ("STRING", {
                    "default": "",
                    "tooltip": "文件名前缀"
                }),
                "add_timestamp": ("BOOLEAN", {
                    "default": False,
                    "tooltip": "添加时间戳"
                }),
                "overwrite": ("BOOLEAN", {
                    "default": False,
                    "tooltip": "覆盖已存在文件"
                }),
                "create_dir": ("BOOLEAN", {
                    "default": True,
                    "tooltip": "自动创建目录"
                }),
            },
        }

    def get_path(
        self,
        output_type: str,
        path: str,
        file_prefix: str = "",
        add_timestamp: bool = False,
        overwrite: bool = False,
        create_dir: bool = True,
    ) -> Tuple[str]:
        """返回配置的输出路径信息（JSON格式）"""
        config = {
            "type": "output",
            "output_type": output_type,
            "path": os.path.abspath(path) if path else "",
            "prefix": file_prefix,
            "timestamp": add_timestamp,
            "overwrite": overwrite,
            "create_dir": create_dir,
        }
        return (json.dumps(config, ensure_ascii=False),)


class DataManagerCore:
    """核心文件管理器节点 - 动态端口 + UI操作

    功能：
    - 动态数量的输入/输出端口
    - 只有一个 "打开界面" 开关
    - 所有文件操作在 UI 中完成
    """

    CATEGORY = "Data Manager"
    RETURN_TYPES = ()
    FUNCTION = "process"
    OUTPUT_NODE = True
    COLOR = "#9b59b6"

    @classmethod
    def INPUT_TYPES(cls) -> Dict[str, Any]:
        """定义输入类型 - 包含动态可选端口"""
        return {
            "required": {
                "open_ui": ("BOOLEAN", {
                    "default": False,
                    "tooltip": "打开文件管理器 UI 界面"
                }),
            },
            "optional": {
                **{f"input_path_{i}": ("STRING", {"default": ""}) for i in range(1, 21)}
            },
        }

    def process(self, open_ui: bool = False, **kwargs) -> Tuple:
        """处理文件管理（主要在UI中完成）"""
        # 收集所有连接的输入输出配置
        inputs = []
        outputs = []

        for key, value in kwargs.items():
            if key.startswith("input_path_") and value:
                inputs.append(value)
            elif key.startswith("output_path_") and value:
                outputs.append(value)

        # 实际操作在 UI 中完成
        # 这里只是传递配置信息
        result = {
            "ui_opened": open_ui,
            "input_configs": inputs,
            "output_configs": outputs,
            "timestamp": datetime.now().isoformat(),
        }

        # 将结果存储到全局变量供 UI 访问
        if hasattr(self, 'set_last_result'):
            self.set_last_result(result)

        return ()


# 节点映射
NODE_CLASS_MAPPINGS = {
    "InputPathConfig": InputPathConfig,
    "OutputPathConfig": OutputPathConfig,
    "DataManagerCore": DataManagerCore,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "InputPathConfig": "Data Manager - Input Path Config",
    "OutputPathConfig": "Data Manager - Output Path Config",
    "DataManagerCore": "Data Manager - Core",
}
