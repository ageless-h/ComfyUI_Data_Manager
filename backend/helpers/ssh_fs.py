# -*- coding: utf-8 -*-
"""utils/ssh_fs.py - SSH/SFTP 远程文件系统封装

提供 SSH 连接管理和 SFTP 文件操作功能
"""

import os
import uuid
import threading
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime
from pathlib import Path

try:
    import paramiko
    HAS_PARAMIKO = True
except ImportError:
    HAS_PARAMIKO = False


# 连接池 {connection_id: {"ssh": ssh_client, "sftp": sftp_client, "root": remote_root, "last_active": timestamp}}
_connection_pool: Dict[str, Dict] = {}
_pool_lock = threading.Lock()

# 默认连接超时（秒）
DEFAULT_CONNECT_TIMEOUT = 30
DEFAULT_TIMEOUT = 300  # SFTP 操作超时


class SSHConnectionError(Exception):
    """SSH 连接错误"""
    pass


class SSHAuthError(SSHConnectionError):
    """认证失败"""
    pass


class SSHPathError(SSHConnectionError):
    """路径错误（权限不足、路径不存在等）"""
    pass


def is_available() -> bool:
    """检查 paramiko 是否可用"""
    return HAS_PARAMIKO


def get_connected_hosts() -> List[Dict[str, Any]]:
    """获取已连接的远程主机列表

    Returns:
        连接信息列表
    """
    with _pool_lock:
        return [
            {
                "id": conn_id,
                "host": info.get("host", ""),
                "port": info.get("port", 22),
                "username": info.get("username", ""),
                "root_path": info.get("root", ""),
                "connected_at": info.get("connected_at", ""),
            }
            for conn_id, info in _connection_pool.items()
        ]


def connect(
    host: str,
    port: int = 22,
    username: str = "",
    password: str = "",
    key_filename: Optional[str] = None,
    connect_timeout: int = DEFAULT_CONNECT_TIMEOUT
) -> Tuple[str, str]:
    """建立 SSH 连接

    Args:
        host: 主机地址
        port: 端口（默认 22）
        username: 用户名
        password: 密码
        key_filename: 私钥文件路径
        connect_timeout: 连接超时（秒）

    Returns:
        (connection_id, remote_root_path)

    Raises:
        SSHConnectionError: 连接失败
        SSHAuthError: 认证失败
    """
    if not HAS_PARAMIKO:
        raise SSHConnectionError("paramiko 库未安装，请运行: pip install paramiko")

    try:
        # 创建 SSH 客户端
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

        # 连接参数
        connect_kwargs = {
            "hostname": host,
            "port": port,
            "username": username,
            "timeout": connect_timeout,
        }

        # 认证方式
        if key_filename and os.path.exists(key_filename):
            # 使用私钥文件
            key = paramiko.RSAKey.from_private_key_file(key_filename)
            connect_kwargs["pkey"] = key
        elif password:
            connect_kwargs["password"] = password
        else:
            # 尝试无密码连接（可能使用 SSH 代理）
            pass

        ssh.connect(**connect_kwargs)

        # 打开 SFTP 通道
        sftp = ssh.open_sftp()

        # 获取远程主目录
        remote_root = sftp.getcwd() or "/"

        # 生成连接 ID
        conn_id = str(uuid.uuid4())[:8]

        # 存储到连接池
        with _pool_lock:
            _connection_pool[conn_id] = {
                "ssh": ssh,
                "sftp": sftp,
                "host": host,
                "port": port,
                "username": username,
                "root": remote_root,
                "connected_at": datetime.now().isoformat(),
                "last_active": datetime.now().timestamp(),
            }

        return conn_id, remote_root

    except paramiko.AuthenticationException:
        raise SSHAuthError(f"SSH 认证失败: 用户名或密码错误")
    except paramiko.SSHException as e:
        raise SSHConnectionError(f"SSH 连接失败: {str(e)}")
    except Exception as e:
        raise SSHConnectionError(f"连接错误: {str(e)}")


def disconnect(conn_id: str) -> bool:
    """断开 SSH 连接

    Args:
        conn_id: 连接 ID

    Returns:
        是否成功断开
    """
    with _pool_lock:
        if conn_id not in _connection_pool:
            return False

    try:
        info = _connection_pool.pop(conn_id)
        sftp = info.get("sftp")
        ssh = info.get("ssh")

        if sftp:
            try:
                sftp.close()
            except Exception:
                pass

        if ssh:
            try:
                ssh.close()
            except Exception:
                pass

        return True
    except Exception:
        return False


def disconnect_all():
    """断开所有连接"""
    with _pool_lock:
        conn_ids = list(_connection_pool.keys())

    for conn_id in conn_ids:
        disconnect(conn_id)


def is_connected(conn_id: str) -> bool:
    """检查连接是否活跃

    Args:
        conn_id: 连接 ID

    Returns:
        是否已连接
    """
    with _pool_lock:
        if conn_id not in _connection_pool:
            return False

    info = _connection_pool[conn_id]
    ssh = info.get("ssh")

    if not ssh:
        return False

    try:
        # 发送心跳检测连接
        transport = ssh.get_transport()
        return transport and transport.is_active()
    except Exception:
        return False


def _get_conn_info(conn_id: str) -> Optional[Dict]:
    """获取连接信息"""
    with _pool_lock:
        return _connection_pool.get(conn_id)


def _update_activity(conn_id: str):
    """更新最后活跃时间"""
    with _pool_lock:
        if conn_id in _connection_pool:
            _connection_pool[conn_id]["last_active"] = datetime.now().timestamp()


def _ensure_connected(conn_id: str):
    """确保连接仍然活跃"""
    if not is_connected(conn_id):
        raise SSHConnectionError("连接已断开，请重新连接")


def list_remote_files(conn_id: str, path: str = ".") -> List[Dict[str, Any]]:
    """列出远程目录中的文件和子目录

    Args:
        conn_id: 连接 ID
        path: 远程目录路径

    Returns:
        文件信息列表
    """
    conn_info = _get_conn_info(conn_id)
    if not conn_info:
        raise SSHConnectionError("连接不存在")

    sftp = conn_info.get("sftp")
    if not sftp:
        raise SSHConnectionError("SFTP 通道未建立")

    try:
        _ensure_connected(conn_id)
        _update_activity(conn_id)

        # 规范化路径
        if not path or path == ".":
            path = conn_info.get("root", "/")

        # 确保路径存在
        try:
            sftp.stat(path)
        except FileNotFoundError:
            raise SSHPathError(f"路径不存在: {path}")
        except PermissionError:
            raise SSHPathError(f"权限不足: {path}")

        items = []
        for entry in sftp.listdir_attr(path):
            remote_path = f"{path}/{entry.filename}" if not path.endswith("/") else f"{path}{entry.filename}"

            # 构建文件信息（兼容本地文件信息格式）
            file_info = {
                "name": entry.filename,
                "path": remote_path,
                "size": entry.st_size,
                "size_human": _format_size(entry.st_size),
                "extension": _get_extension(entry.filename),
                "modified": _format_time(entry.st_mtime),
                "created": _format_time(entry.st_atime),
                "is_dir": entry.st_mode & 0o40000 != 0,  # S_ISDIR
                "exists": True,
            }
            items.append(file_info)

        return items

    except SSHConnectionError:
        raise
    except Exception as e:
        raise SSHConnectionError(f"列出目录失败: {str(e)}")


def get_remote_file_info(conn_id: str, path: str) -> Dict[str, Any]:
    """获取远程文件信息

    Args:
        conn_id: 连接 ID
        path: 远程文件路径

    Returns:
        文件信息字典
    """
    conn_info = _get_conn_info(conn_id)
    if not conn_info:
        raise SSHConnectionError("连接不存在")

    sftp = conn_info.get("sftp")
    if not sftp:
        raise SSHConnectionError("SFTP 通道未建立")

    try:
        _ensure_connected(conn_id)
        _update_activity(conn_id)

        # 获取文件属性
        stat = sftp.stat(path)

        file_info = {
            "name": os.path.basename(path),
            "path": path,
            "size": stat.st_size,
            "size_human": _format_size(stat.st_size),
            "extension": _get_extension(path),
            "modified": _format_time(stat.st_mtime),
            "created": _format_time(stat.st_atime),
            "is_dir": stat.st_mode & 0o40000 != 0,
            "exists": True,
        }

        return file_info

    except FileNotFoundError:
        return {"name": os.path.basename(path), "path": path, "exists": False}
    except PermissionError:
        raise SSHPathError(f"权限不足: {path}")
    except Exception as e:
        raise SSHConnectionError(f"获取文件信息失败: {str(e)}")


def download_remote_file(conn_id: str, remote_path: str, local_path: str, callback=None) -> str:
    """下载远程文件到本地

    Args:
        conn_id: 连接 ID
        remote_path: 远程文件路径
        local_path: 本地目标路径
        callback: 进度回调函数 (bytes_downloaded, total_bytes)

    Returns:
        本地文件路径
    """
    conn_info = _get_conn_info(conn_id)
    if not conn_info:
        raise SSHConnectionError("连接不存在")

    sftp = conn_info.get("sftp")
    if not sftp:
        raise SSHConnectionError("SFTP 通道未建立")

    try:
        _ensure_connected(conn_id)
        _update_activity(conn_id)

        # 获取远程文件大小
        remote_stat = sftp.stat(remote_path)
        total_size = remote_stat.st_size

        # 确保本地目录存在
        os.makedirs(os.path.dirname(local_path), exist_ok=True)

        # 下载文件
        def progress_callback(bytes_downloaded):
            _update_activity(conn_id)
            if callback:
                callback(bytes_downloaded, total_size)

        sftp.get(remote_path, local_path, callback=progress_callback)

        return local_path

    except FileNotFoundError:
        raise SSHPathError(f"远程文件不存在: {remote_path}")
    except PermissionError:
        raise SSHPathError(f"权限不足: {remote_path}")
    except Exception as e:
        raise SSHConnectionError(f"下载失败: {str(e)}")


def upload_local_file(conn_id: str, local_path: str, remote_path: str, callback=None) -> str:
    """上传本地文件到远程

    Args:
        conn_id: 连接 ID
        local_path: 本地文件路径
        remote_path: 远程目标路径
        callback: 进度回调函数 (bytes_uploaded, total_bytes)

    Returns:
        远程文件路径
    """
    conn_info = _get_conn_info(conn_id)
    if not conn_info:
        raise SSHConnectionError("连接不存在")

    sftp = conn_info.get("sftp")
    if not sftp:
        raise SSHConnectionError("SFTP 通道未建立")

    try:
        _ensure_connected(conn_id)
        _update_activity(conn_id)

        if not os.path.exists(local_path):
            raise FileNotFoundError(f"本地文件不存在: {local_path}")

        # 获取本地文件大小
        total_size = os.path.getsize(local_path)

        # 获取远程目录
        remote_dir = os.path.dirname(remote_path)
        if remote_dir:
            try:
                sftp.stat(remote_dir)
            except FileNotFoundError:
                sftp.mkdir(remote_dir, parents=True)

        # 上传文件
        def progress_callback(bytes_uploaded):
            _update_activity(conn_id)
            if callback:
                callback(bytes_uploaded, total_size)

        sftp.put(local_path, remote_path, callback=progress_callback)

        return remote_path

    except Exception as e:
        raise SSHConnectionError(f"上传失败: {str(e)}")


def create_remote_directory(conn_id: str, path: str) -> str:
    """创建远程目录

    Args:
        conn_id: 连接 ID
        path: 远程目录路径

    Returns:
        创建的目录路径
    """
    conn_info = _get_conn_info(conn_id)
    if not conn_info:
        raise SSHConnectionError("连接不存在")

    sftp = conn_info.get("sftp")
    if not sftp:
        raise SSHConnectionError("SFTP 通道未建立")

    try:
        _ensure_connected(conn_id)
        _update_activity(conn_id)

        sftp.mkdir(path)
        return path

    except FileExistsError:
        raise SSHPathError(f"目录已存在: {path}")
    except PermissionError:
        raise SSHPathError(f"权限不足，无法创建: {path}")
    except Exception as e:
        raise SSHConnectionError(f"创建目录失败: {str(e)}")


def delete_remote_file(conn_id: str, path: str, use_trash: bool = False) -> bool:
    """删除远程文件或目录

    Args:
        conn_id: 连接 ID
        path: 远程路径
        use_trash: 是否移动到回收站（SFTP 不支持，忽略此参数）

    Returns:
        是否成功删除
    """
    conn_info = _get_conn_info(conn_id)
    if not conn_info:
        raise SSHConnectionError("连接不存在")

    sftp = conn_info.get("sftp")
    if not sftp:
        raise SSHConnectionError("SFTP 通道未建立")

    try:
        _ensure_connected(conn_id)
        _update_activity(conn_id)

        # 检查是文件还是目录
        stat = sftp.stat(path)
        if stat.st_mode & 0o40000 != 0:  # 目录
            # 递归删除目录
            for entry in sftp.listdir(path):
                entry_path = f"{path}/{entry}"
                delete_remote_file(conn_id, entry_path, use_trash)
            sftp.rmdir(path)
        else:  # 文件
            sftp.remove(path)

        return True

    except FileNotFoundError:
        raise SSHPathError(f"文件不存在: {path}")
    except PermissionError:
        raise SSHPathError(f"权限不足: {path}")
    except Exception as e:
        raise SSHConnectionError(f"删除失败: {str(e)}")


def read_remote_file(conn_id: str, path: str, offset: int = 0, length: int = -1) -> bytes:
    """读取远程文件内容（用于预览）

    Args:
        conn_id: 连接 ID
        path: 远程文件路径
        offset: 起始偏移
        length: 读取长度（-1 表示读取全部）

    Returns:
        文件内容 bytes
    """
    conn_info = _get_conn_info(conn_id)
    if not conn_info:
        raise SSHConnectionError("连接不存在")

    sftp = conn_info.get("sftp")
    if not sftp:
        raise SSHConnectionError("SFTP 通道未建立")

    try:
        _ensure_connected(conn_id)
        _update_activity(conn_id)

        with sftp.file(path, mode='rb') as remote_file:
            if offset > 0:
                remote_file.seek(offset)
            if length > 0:
                return remote_file.read(length)
            return remote_file.read()

    except Exception as e:
        raise SSHConnectionError(f"读取文件失败: {str(e)}")


def _format_size(size: int) -> str:
    """格式化文件大小

    Args:
        size: 字节大小

    Returns:
        人类可读的大小字符串
    """
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size < 1024.0:
            return f"{size:.1f} {unit}"
        size /= 1024.0
    return f"{size:.1f} PB"


def _format_time(timestamp: float) -> str:
    """格式化时间戳

    Args:
        timestamp: Unix 时间戳

    Returns:
        ISO 格式时间字符串
    """
    dt = datetime.fromtimestamp(timestamp)
    return dt.strftime("%Y-%m-%dT%H:%M:%S")


def _get_extension(filename: str) -> str:
    """获取文件扩展名

    Args:
        filename: 文件名

    Returns:
        扩展名（带点）
    """
    ext = os.path.splitext(filename)[1].lower()
    return ext if ext else ""
