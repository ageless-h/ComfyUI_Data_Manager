# -*- coding: utf-8 -*-
"""utils/path_utils.py - 路径工具模块

提供路径处理的工具函数
"""

import os


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
