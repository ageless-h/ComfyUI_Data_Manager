# -*- coding: utf-8 -*-
"""utils/info.py - 文件信息获取模块

提供文件和信息获取的工具函数
"""

import os
from pathlib import Path
from typing import Dict, Any
from datetime import datetime

from .formatters import human_readable_size


def get_file_info(file_path: str) -> Dict[str, Any]:
    """获取文件详细信息（公共接口）

    Args:
        file_path: 文件路径

    Returns:
        文件信息字典
    """
    return _get_file_info(file_path)


def _get_file_info(file_path: str) -> Dict[str, Any]:
    """内部函数：获取文件信息

    Args:
        file_path: 文件路径

    Returns:
        文件信息字典，包含：
        - name: 文件名
        - path: 绝对路径
        - size: 文件大小（字节）
        - size_human: 可读的文件大小
        - extension: 文件扩展名
        - modified: 修改时间（ISO格式）
        - created: 创建时间（ISO格式）
        - is_dir: 是否为目录
        - exists: 文件是否存在
    """
    path = Path(file_path)

    if not path.exists():
        return {
            "name": os.path.basename(file_path),
            "path": file_path,
            "exists": False,
            "is_dir": False,
        }

    stat = path.stat()

    return {
        "name": path.name,
        "path": str(path.absolute()),
        "size": stat.st_size,
        "size_human": human_readable_size(stat.st_size),
        "extension": path.suffix.lower(),
        "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
        "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
        "is_dir": path.is_dir(),
        "exists": True,
    }


def _matches_pattern(filename: str, pattern: str) -> bool:
    """检查文件名是否匹配模式

    Args:
        filename: 文件名
        pattern: 匹配模式（支持通配符）

    Returns:
        是否匹配
    """
    import fnmatch

    return fnmatch.fnmatch(filename, pattern)


def get_file_category(file_path: str) -> str:
    """获取文件类别

    Args:
        file_path: 文件路径

    Returns:
        文件类别: image, video, audio, document, code, archive, unknown
    """
    ext = Path(file_path).suffix.lower()

    categories = {
        "image": [
            ".jpg",
            ".jpeg",
            ".png",
            ".gif",
            ".bmp",
            ".webp",
            ".svg",
            ".ico",
            ".tiff",
            ".tif",
            ".avif",
            ".heic",
            ".heif",
            ".tga",
            ".psd",
        ],
        "video": [".mp4", ".avi", ".mov", ".mkv", ".webm", ".flv"],
        "audio": [".mp3", ".wav", ".flac", ".aac", ".ogg", ".wma", ".m4a"],
        "document": [".pdf", ".doc", ".docx", ".txt", ".rtf", ".md"],
        "code": [".py", ".js", ".html", ".css", ".json", ".xml", ".yaml", ".yml"],
        "archive": [".zip", ".rar", ".7z", ".tar", ".gz"],
    }

    for category, extensions in categories.items():
        if ext in extensions:
            return category

    return "unknown"
