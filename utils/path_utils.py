# -*- coding: utf-8 -*-
"""utils/path_utils.py - 路径工具模块

提供路径处理的工具函数
"""

import os


def normalize_comfyui_path(path: str) -> str:
    """将相对路径转换为相对于 ComfyUI 根目录的绝对路径

    如果路径已经是绝对路径，则直接返回。
    如果是相对路径，则将其转换为相对于 ComfyUI 安装目录的绝对路径。

    Args:
        path: 文件或目录路径

    Returns:
        规范化后的绝对路径
    """
    if os.path.isabs(path):
        return path

    # 导入 folder_paths 获取 ComfyUI 根目录
    try:
        import folder_paths
        comfy_root = os.path.dirname(folder_paths.__file__)
        return os.path.abspath(os.path.join(comfy_root, path))
    except ImportError:
        # 如果无法导入 folder_paths，返回当前工作目录的绝对路径
        return os.path.abspath(path)


def ensure_directory(directory: str) -> bool:
    """确保目录存在，如果不存在则创建

    Args:
        directory: 目录路径

    Returns:
        是否成功创建或目录已存在
    """
    try:
        os.makedirs(directory, exist_ok=True)
        return True
    except Exception as e:
        print(f"[DataManager] Failed to create directory: {e}")
        return False


def join_paths(*paths: str) -> str:
    """连接多个路径组件

    Args:
        *paths: 路径组件

    Returns:
        规范化后的连接路径
    """
    result = os.path.join(*paths)
    return os.path.normpath(result)


def get_parent_path(path: str) -> str:
    """获取父路径

    Args:
        path: 文件或目录路径

    Returns:
        父路径，如果没有父路径则返回 "."
    """
    parent = os.path.dirname(path)
    return parent if parent else "."
