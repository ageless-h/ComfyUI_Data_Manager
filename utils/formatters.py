# -*- coding: utf-8 -*-
"""utils/formatters.py - 格式化工具模块

提供数据格式化的工具函数
"""


def parse_format_string(format_str: str) -> str:
    """解析格式字符串，提取实际格式名

    处理两种格式：
    1. 简单格式："png", "jpg" 等 -> 直接返回
    2. 分组格式："图像格式 - PNG" -> 提取 "png"

    Args:
        format_str: 格式字符串（可能包含分组前缀）

    Returns:
        小写的格式名称（如 "png", "jpg"）
    """
    if " - " in format_str:
        return format_str.split(" - ")[-1].lower()
    return format_str.lower()


def human_readable_size(size_bytes: int) -> str:
    """将字节数转换为可读格式

    Args:
        size_bytes: 字节数

    Returns:
        可读的文件大小字符串（如 "1.5 MB"）
    """
    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f} PB"
