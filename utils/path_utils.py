# -*- coding: utf-8 -*-
"""utils/path_utils.py - 路径工具模块

提供路径处理的工具函数
"""

import os
from enum import Enum
from typing import Optional, Tuple
from urllib.parse import urlparse


class PathType(Enum):
    """路径类型枚举"""
    LOCAL = "local"
    UNC = "unc"  # Windows 共享路径，如 \\server\share
    SSH = "ssh"  # SSH 远程路径，如 ssh://user@host/path
    UNKNOWN = "unknown"


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


def get_path_type(path: str) -> PathType:
    """判断路径类型

    Args:
        path: 文件路径

    Returns:
        路径类型枚举值
    """
    # 检查 UNC 路径（Windows 共享）
    if path.startswith("\\\\") or path.startswith("//"):
        return PathType.UNC

    # 检查 SSH URL
    if path.startswith("ssh://"):
        return PathType.SSH

    # 检查是否是本地路径
    if os.path.isabs(path):
        return PathType.LOCAL

    return PathType.LOCAL


def parse_unc_path(path: str) -> Optional[Tuple[str, str, str]]:
    """解析 UNC 路径

    Args:
        path: UNC 路径，如 \\server\share\folder\file

    Returns:
        (server, share, subpath) 元组，解析失败返回 None
    """
    if not path.startswith("\\\\") and not path.startswith("//"):
        return None

    # 去掉开头的 \\
    path = path[2:]

    parts = path.split("\\")
    if len(parts) < 2:
        return None

    server = parts[0]
    share = parts[1]
    subpath = "\\".join(parts[2:]) if len(parts) > 2 else ""

    return (server, share, subpath)


def parse_ssh_url(url: str) -> Optional[Tuple[str, int, str, str]]:
    """解析 SSH URL

    Args:
        url: SSH URL，如 ssh://user@host:22/path

    Returns:
        (username, port, host, path) 元组，解析失败返回 None
    """
    if not url.startswith("ssh://"):
        return None

    # 去掉 ssh://
    url = url[6:]

    # 解析用户名和主机
    if "@" in url:
        username, host_part = url.rsplit("@", 1)
    else:
        username = ""
        host_part = url

    # 解析端口和路径
    if ":" in host_part:
        host, port_str = host_part.split(":", 1)
        if "/" in port_str:
            port_str, path = port_str.split("/", 1)
            path = "/" + path
        else:
            port = int(port_str)
            path = ""
    else:
        host = host_part
        port = 22
        path = ""

    return (username, port, host, path)


def is_remote_path(path: str) -> bool:
    """判断是否是远程路径

    Args:
        path: 文件路径

    Returns:
        是否是远程路径
    """
    path_type = get_path_type(path)
    return path_type in (PathType.UNC, PathType.SSH)


def normalize_remote_path(path: str) -> str:
    """规范化远程路径

    Args:
        path: 远程路径

    Returns:
        规范化后的路径
    """
    path_type = get_path_type(path)

    if path_type == PathType.SSH:
        # 确保路径以 / 开头
        if not path.startswith("/"):
            return "/" + path
    elif path_type == PathType.UNC:
        # 规范化 UNC 路径
        path = path.replace("/", "\\")
        if not path.startswith("\\\\"):
            path = "\\\\" + path

    return path
