# -*- coding: utf-8 -*-
"""shared.py - 共享的文件操作逻辑

此模块包含 V1 和 V3 API 都使用的共享函数
"""

import os
import json
import shutil
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime


def save_file(source: Any, target_dir: str, filename: str = None, prefix: str = "", add_timestamp: bool = False) -> str:
    """保存文件到目标目录

    Args:
        source: 源文件路径或文件对象
        target_dir: 目标目录
        filename: 文件名（可选）
        prefix: 文件名前缀
        add_timestamp: 是否添加时间戳

    Returns:
        保存后的完整文件路径
    """
    os.makedirs(target_dir, exist_ok=True)

    # 获取源文件信息
    if isinstance(source, str):
        source_path = Path(source)
        if not source_path.exists():
            raise FileNotFoundError(f"源文件不存在: {source}")

        base_name = source_path.stem
        ext = source_path.suffix

        if filename is None:
            filename = base_name

        # 添加前缀
        if prefix:
            name_without_ext = filename.rsplit('.', 1)[0] if '.' in filename else filename
            ext = filename.rsplit('.', 1)[1] if '.' in filename else ''
            filename = f"{prefix}{name_without_ext}.{ext}" if ext else f"{prefix}{filename}"

        # 添加时间戳
        if add_timestamp:
            name_without_ext = filename.rsplit('.', 1)[0] if '.' in filename else filename
            ext = filename.rsplit('.', 1)[1] if '.' in filename else ''
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{name_without_ext}_{timestamp}.{ext}" if ext else f"{filename}_{timestamp}"

        target_path = os.path.join(target_dir, filename)

        # 复制文件
        shutil.copy2(source, target_path)

        return target_path

    return ""


def list_files(directory: str, pattern: str = "*.*", recursive: bool = False, include_dirs: bool = True) -> List[Dict[str, Any]]:
    """列出目录中的文件和子目录

    Args:
        directory: 目录路径
        pattern: 文件匹配模式
        recursive: 是否递归搜索
        include_dirs: 是否包含目录

    Returns:
        文件信息列表
    """
    if not os.path.exists(directory):
        return []

    items = []

    try:
        if recursive:
            for root, dirs, filenames in os.walk(directory):
                # 添加目录
                if include_dirs:
                    for dirname in dirs:
                        dir_path = os.path.join(root, dirname)
                        items.append(_get_file_info(dir_path))
                # 添加文件
                for filename in filenames:
                    file_path = os.path.join(root, filename)
                    if _matches_pattern(filename, pattern):
                        items.append(_get_file_info(file_path))
        else:
            for item in os.listdir(directory):
                item_path = os.path.join(directory, item)
                is_dir = os.path.isdir(item_path)

                # 包含目录
                if include_dirs and is_dir:
                    items.append(_get_file_info(item_path))
                # 包含匹配的文件
                elif not is_dir and _matches_pattern(item, pattern):
                    items.append(_get_file_info(item_path))
    except (PermissionError, OSError):
        pass

    return items


def get_file_info(file_path: str) -> Dict[str, Any]:
    """获取文件详细信息

    Args:
        file_path: 文件路径

    Returns:
        文件信息字典
    """
    return _get_file_info(file_path)


def _get_file_info(file_path: str) -> Dict[str, Any]:
    """内部函数：获取文件信息"""
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
        "size_human": _human_readable_size(stat.st_size),
        "extension": path.suffix.lower(),
        "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
        "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
        "is_dir": path.is_dir(),
        "exists": True,
    }


def _matches_pattern(filename: str, pattern: str) -> bool:
    """检查文件名是否匹配模式"""
    import fnmatch
    return fnmatch.fnmatch(filename, pattern)


def _human_readable_size(size_bytes: int) -> str:
    """将字节数转换为可读格式"""
    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f} PB"


def get_file_category(file_path: str) -> str:
    """获取文件类别

    Returns:
        文件类别: image, video, audio, document, code, archive, unknown
    """
    ext = Path(file_path).suffix.lower()

    categories = {
        "image": [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg", ".ico"],
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


def ensure_directory(directory: str) -> bool:
    """确保目录存在，如果不存在则创建"""
    try:
        os.makedirs(directory, exist_ok=True)
        return True
    except Exception as e:
        print(f"[DataManager] Failed to create directory: {e}")
        return False


def join_paths(*paths: str) -> str:
    """连接多个路径组件"""
    result = os.path.join(*paths)
    return os.path.normpath(result)


def get_parent_path(path: str) -> str:
    """获取父路径"""
    parent = os.path.dirname(path)
    return parent if parent else "."
