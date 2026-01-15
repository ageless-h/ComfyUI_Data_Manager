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
from .path_utils import get_path_type, PathType


def save_file(
    source: Any,
    target_dir: str,
    filename: str = None,
    prefix: str = "",
    add_timestamp: bool = False,
) -> str:
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
            name_without_ext = filename.rsplit(".", 1)[0] if "." in filename else filename
            ext = filename.rsplit(".", 1)[1] if "." in filename else ""
            filename = f"{prefix}{name_without_ext}.{ext}" if ext else f"{prefix}{filename}"

        # 添加时间戳
        if add_timestamp:
            name_without_ext = filename.rsplit(".", 1)[0] if "." in filename else filename
            ext = filename.rsplit(".", 1)[1] if "." in filename else ""
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{name_without_ext}_{timestamp}.{ext}" if ext else f"{filename}_{timestamp}"

        target_path = os.path.join(target_dir, filename)

        # 复制文件
        shutil.copy2(source, target_path)

        return target_path

    return ""


def list_files(
    directory: str, pattern: str = "*.*", recursive: bool = False, include_dirs: bool = True
) -> List[Dict[str, Any]]:
    """列出目录中的文件和子目录

    Args:
        directory: 目录路径
        pattern: 文件匹配模式
        recursive: 是否递归搜索
        include_dirs: 是否包含目录

    Returns:
        文件信息列表
    """
    # 判断路径类型
    path_type = get_path_type(directory)

    # 处理 UNC 路径（Windows 共享文件夹）
    if path_type == PathType.UNC:
        return _list_unc_files(directory, pattern, recursive, include_dirs)

    # 本地路径
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


def _list_unc_files(
    unc_path: str, pattern: str = "*.*", recursive: bool = False, include_dirs: bool = True
) -> List[Dict[str, Any]]:
    r"""列出 UNC 路径（Windows 共享文件夹）中的文件和子目录

    Args:
        unc_path: UNC 路径，如 \\server\share\folder
        pattern: 文件匹配模式
        recursive: 是否递归搜索
        include_dirs: 是否包含目录

    Returns:
        文件信息列表
    """
    items = []

    try:
        # UNC 路径可以直接使用 os.listdir 和 os.path 函数访问
        if not os.path.exists(unc_path):
            return []

        if recursive:
            for root, dirs, filenames in os.walk(unc_path):
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
            for item in os.listdir(unc_path):
                item_path = os.path.join(unc_path, item)
                is_dir = os.path.isdir(item_path)

                # 包含目录
                if include_dirs and is_dir:
                    items.append(_get_file_info(item_path))
                # 包含匹配的文件
                elif not is_dir and _matches_pattern(item, pattern):
                    items.append(_get_file_info(item_path))
    except (PermissionError, OSError, Exception):
        pass

    return items


def create_file(directory: str, filename: str, content: str = "") -> str:
    """创建新文件

    Args:
        directory: 目标目录
        filename: 文件名
        content: 文件内容（默认为空）

    Returns:
        创建的文件完整路径

    Raises:
        FileNotFoundError: 目录不存在
        FileExistsError: 文件已存在
        PermissionError: 无写入权限
    """
    import logging
    logger = logging.getLogger(__name__)

    # 移除路径末尾的分隔符
    directory = directory.rstrip(os.sep).rstrip('/')

    if not os.path.exists(directory):
        raise FileNotFoundError(f"目录不存在: {directory}")

    if not os.path.isdir(directory):
        raise NotADirectoryError(f"路径不是目录: {directory}")

    file_path = os.path.join(directory, filename)

    if os.path.exists(file_path):
        raise FileExistsError(f"文件 '{filename}' 已存在于目录 {directory} 中")

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

    logger.info(f"[DataManager] 文件已创建: {file_path}")
    return file_path


def create_directory(directory: str, dirname: str) -> str:
    """创建新文件夹

    Args:
        directory: 父目录
        dirname: 文件夹名称

    Returns:
        创建的文件夹完整路径

    Raises:
        FileNotFoundError: 父目录不存在
        FileExistsError: 文件夹已存在
        PermissionError: 无创建权限
    """
    import logging
    logger = logging.getLogger(__name__)

    # 移除路径末尾的分隔符
    directory = directory.rstrip(os.sep).rstrip('/')

    if not os.path.exists(directory):
        raise FileNotFoundError(f"父目录不存在: {directory}")

    if not os.path.isdir(directory):
        raise NotADirectoryError(f"路径不是目录: {directory}")

    dir_path = os.path.join(directory, dirname)

    if os.path.exists(dir_path):
        raise FileExistsError(f"文件夹 '{dirname}' 已存在于目录 {directory} 中")

    os.makedirs(dir_path)
    logger.info(f"[DataManager] 文件夹已创建: {dir_path}")
    return dir_path


def delete_file(file_path: str, use_trash: bool = True) -> bool:
    """删除文件或文件夹

    Args:
        file_path: 文件或文件夹路径
        use_trash: 是否移动到回收站（True）还是永久删除（False）

    Returns:
        是否成功删除

    Raises:
        FileNotFoundError: 文件不存在
        PermissionError: 无删除权限
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"文件不存在: {file_path}")

    if use_trash:
        try:
            # 使用 send2trash 模块移动到回收站
            import send2trash

            send2trash.send2trash(file_path)
            return True
        except ImportError:
            # 如果 send2trash 不可用，记录警告并使用永久删除
            import logging

            logger = logging.getLogger(__name__)
            logger.warning("[DataManager] send2trash not available, using permanent delete")
        except Exception as e:
            # send2trash 调用失败，记录错误并使用永久删除
            import logging

            logger = logging.getLogger(__name__)
            logger.warning(f"[DataManager] send2trash failed: {e}, using permanent delete")

    # 永久删除
    if os.path.isdir(file_path):
        shutil.rmtree(file_path)
    else:
        os.remove(file_path)

    return True
