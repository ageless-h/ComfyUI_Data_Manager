# -*- coding: utf-8 -*-
"""tests/fixtures/ssh_mock.py - SSH Mock 工具

提供用于 SSH 测试的 Mock 对象和辅助函数
"""

from unittest.mock import Mock, MagicMock
from typing import Optional, List, Dict, Any
import uuid


def create_mock_ssh_client(
    host: str = "test.example.com",
    port: int = 22,
    username: str = "test_user",
    connected: bool = True,
) -> Mock:
    """创建 Mock SSH 客户端

    Args:
        host: 主机地址
        port: 端口
        username: 用户名
        connected: 是否已连接

    Returns:
        Mock SSH 客户端对象
    """
    mock_ssh = Mock()

    # 模拟 transport
    mock_transport = Mock()
    mock_transport.is_active.return_value = connected
    mock_ssh.get_transport.return_value = mock_transport

    # 模拟连接方法
    mock_ssh.connect.return_value = None

    # 模拟 exec_command
    mock_stdin = Mock()
    mock_stdout = Mock()
    mock_stderr = Mock()
    mock_stdout.read.return_value = b""
    mock_stderr.read.return_value = b""
    mock_stdout.channel.recv_exit_status.return_value = 0
    mock_ssh.exec_command.return_value = (mock_stdin, mock_stdout, mock_stderr)

    # 模拟 close
    mock_ssh.close.return_value = None

    return mock_ssh


def create_mock_sftp_client(
    root_path: str = "/home/test_user",
    files: Optional[List[Dict[str, Any]]] = None,
) -> Mock:
    """创建 Mock SFTP 客户端

    Args:
        root_path: 远程根目录
        files: 文件列表

    Returns:
        Mock SFTP 客户端对象
    """
    mock_sftp = Mock()

    # 模拟 getcwd
    mock_sftp.getcwd.return_value = root_path

    # 模拟文件属性
    def create_stat(file_type: str = "file", size: int = 1024):
        stat = Mock()
        if file_type == "dir":
            stat.st_mode = 0o040755  # 目录
        else:
            stat.st_mode = 0o100644  # 文件
        stat.st_size = size
        stat.st_mtime = 1609459200  # 2021-01-01 00:00:00
        stat.st_atime = 1609459200
        return stat

    mock_sftp.stat.side_effect = lambda path: create_stat("dir" if path.endswith("/") else "file")

    # 模拟 lstat
    mock_sftp.lstat.side_effect = lambda path: create_stat()

    # 模拟 listdir_attr
    if files is None:
        files = [
            {"filename": "test_file.txt", "size": 1024, "is_dir": False},
            {"filename": "test_dir", "size": 4096, "is_dir": True},
        ]

    def mock_listdir_attr(path: str):
        result = []
        for file_info in files:
            entry = Mock()
            entry.filename = file_info["filename"]
            entry.st_size = file_info["size"]
            entry.st_mtime = 1609459200
            if file_info["is_dir"]:
                entry.st_mode = 0o040755
            else:
                entry.st_mode = 0o100644
            result.append(entry)
        return result

    mock_sftp.listdir_attr.side_effect = mock_listdir_attr

    # 模拟文件操作
    mock_sftp.get.return_value = None
    mock_sftp.put.return_value = None
    mock_sftp.mkdir.return_value = None
    mock_sftp.remove.return_value = None
    mock_sftp.rmdir.return_value = None
    mock_sftp.close.return_value = None

    # 模拟 file() 上下文管理器
    mock_file = Mock()
    mock_file.read.return_value = b"test content"
    mock_file.write.return_value = None
    mock_file.seek.return_value = None
    mock_file.close.return_value = None

    mock_file_obj = MagicMock()
    mock_file_obj.__enter__.return_value = mock_file
    mock_file_obj.__exit__.return_value = False

    mock_sftp.file.return_value = mock_file_obj

    return mock_sftp


def create_mock_ssh_exception(exception_type: str = "AuthenticationException") -> Exception:
    """创建 Mock SSH 异常

    Args:
        exception_type: 异常类型 (AuthenticationException, SSHException)

    Returns:
        异常对象
    """
    if exception_type == "AuthenticationException":
        return Exception("Authentication failed")
    elif exception_type == "SSHException":
        return Exception("SSH connection failed")
    else:
        return Exception("Unknown error")


def setup_mock_connect(
    mock_ssh: Mock,
    mock_sftp: Mock,
    conn_id: str,
    host: str = "test.example.com",
    port: int = 22,
    username: str = "test_user",
    root_path: str = "/home/test_user",
) -> Dict[str, Any]:
    """设置 Mock 连接返回值

    Args:
        mock_ssh: Mock SSH 客户端
        mock_sftp: Mock SFTP 客户端
        conn_id: 连接 ID
        host: 主机地址
        port: 端口
        username: 用户名
        root_path: 根目录

    Returns:
        连接信息字典
    """
    mock_ssh.open_sftp.return_value = mock_sftp
    mock_sftp.getcwd.return_value = root_path

    return {
        "id": conn_id,
        "host": host,
        "port": port,
        "username": username,
        "root_path": root_path,
    }


def mock_auth_error() -> Exception:
    """模拟认证错误"""
    try:
        import paramiko
        return paramiko.AuthenticationException("Authentication failed: username or password incorrect")
    except ImportError:
        return Exception("Authentication failed: username or password incorrect")


def mock_connection_error(message: str = "Connection failed") -> Exception:
    """模拟连接错误"""
    try:
        import paramiko
        return paramiko.SSHException(f"SSH connection failed: {message}")
    except ImportError:
        return Exception(f"SSH connection failed: {message}")


def mock_path_error(path: str, message: str = "Path not found") -> Exception:
    """模拟路径错误"""
    return Exception(f"{message}: {path}")


# 常用测试数据
MOCK_FILE_LIST = [
    {
        "name": "test_image.jpg",
        "path": "/home/test/test_image.jpg",
        "size": 204800,
        "size_human": "200.0 KB",
        "extension": ".jpg",
        "modified": "2021-01-01T00:00:00",
        "created": "2021-01-01T00:00:00",
        "is_dir": False,
        "exists": True,
    },
    {
        "name": "test_document.pdf",
        "path": "/home/test/test_document.pdf",
        "size": 102400,
        "size_human": "100.0 KB",
        "extension": ".pdf",
        "modified": "2021-01-01T00:00:00",
        "created": "2021-01-01T00:00:00",
        "is_dir": False,
        "exists": True,
    },
    {
        "name": "test_folder",
        "path": "/home/test/test_folder",
        "size": 4096,
        "size_human": "4.0 KB",
        "extension": "",
        "modified": "2021-01-01T00:00:00",
        "created": "2021-01-01T00:00:00",
        "is_dir": True,
        "exists": True,
    },
]

MOCK_CONNECTION_INFO = {
    "host": "test.example.com",
    "port": 22,
    "username": "test_user",
    "root_path": "/home/test_user",
}
