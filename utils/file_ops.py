# -*- coding: utf-8 -*-
"""utils/file_ops.py - 文件操作模块

提供文件和目录操作的核心功能
"""

import os
import shutil
from pathlib import Path
from typing import Dict, Any, List
from datetime import datetime

from .info import _get_file_info, _matches_pattern


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
