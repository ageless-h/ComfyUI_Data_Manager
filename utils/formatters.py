# -*- coding: utf-8 -*-
"""utils/formatters.py - 格式化工具模块

提供数据格式化的工具函数
"""


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
