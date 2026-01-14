# -*- coding: utf-8 -*-
"""utils - 工具函数模块

提供文件操作、路径处理、格式化等通用功能
"""

from .file_ops import save_file, list_files, create_file, create_directory, delete_file
from .path_utils import (
    ensure_directory, join_paths, get_parent_path,
    get_path_type, parse_unc_path, parse_ssh_url,
    is_remote_path, normalize_remote_path, PathType
)
from .formatters import human_readable_size
from .info import get_file_info, get_file_category

# SSH 远程访问（可选依赖）
try:
    from .ssh_fs import (
        is_available as ssh_is_available,
        connect as ssh_connect,
        disconnect as ssh_disconnect,
        get_connected_hosts,
        list_remote_files,
        get_remote_file_info,
        download_remote_file,
        upload_local_file,
        SSHConnectionError,
        SSHAuthError,
        SSHPathError,
    )
    _SSH_AVAILABLE = True
except ImportError:
    _SSH_AVAILABLE = False
    ssh_is_available = lambda: False


__all__ = [
    # 文件操作
    'save_file',
    'list_files',
    'create_file',
    'create_directory',
    'delete_file',
    # 文件信息
    'get_file_info',
    'get_file_category',
    # 路径工具
    'ensure_directory',
    'join_paths',
    'get_parent_path',
    'get_path_type',
    'parse_unc_path',
    'parse_ssh_url',
    'is_remote_path',
    'normalize_remote_path',
    'PathType',
    # 格式化工具
    'human_readable_size',
    # SSH 远程访问
    'ssh_is_available',
    'ssh_connect',
    'ssh_disconnect',
    'get_connected_hosts',
    'list_remote_files',
    'get_remote_file_info',
    'download_remote_file',
    'upload_local_file',
    'SSHConnectionError',
    'SSHAuthError',
    'SSHPathError',
    '_SSH_AVAILABLE',
]
