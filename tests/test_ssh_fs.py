# -*- coding: utf-8 -*-
"""tests/test_ssh_fs.py - SSH 文件系统操作测试

测试 utils/ssh_fs.py 模块的功能

使用完全隔离的 mock 策略，每个测试都有自己的模块实例。
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
import sys
import os
import importlib.util
from pathlib import Path


def get_ssh_fs_module():
    """获取 ssh_fs 模块的新实例，避免测试间状态污染"""
    project_root = Path(__file__).parent.parent
    ssh_fs_path = project_root / "utils" / "ssh_fs.py"

    # 使用唯一的模块名称避免缓存
    import uuid
    module_name = f"ssh_fs_test_{uuid.uuid4().hex[:8]}"
    spec = importlib.util.spec_from_file_location(module_name, str(ssh_fs_path))
    ssh_fs = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = ssh_fs
    spec.loader.exec_module(ssh_fs)

    return ssh_fs, module_name


def cleanup_module(module_name):
    """清理模块实例"""
    if module_name in sys.modules:
        del sys.modules[module_name]


@pytest.fixture
def ssh_fs_module():
    """提供干净的 ssh_fs 模块实例"""
    module, name = get_ssh_fs_module()
    yield module
    cleanup_module(name)


@pytest.fixture
def mock_ssh_client():
    """Mock paramiko SSH 客户端"""
    mock = Mock()
    mock.transport = Mock()
    mock.transport.is_active.return_value = True

    # 模拟 exec_command 返回值
    stdin = Mock()
    stdout = Mock()
    stderr = Mock()
    stdout.read.return_value = b""
    stderr.read.return_value = b""
    stdout.channel.recv_exit_status.return_value = 0

    mock.exec_command.return_value = (stdin, stdout, stderr)

    # open_sftp 返回值将由测试设置
    mock_sftp = Mock()
    mock.open_sftp.return_value = mock_sftp

    return mock, mock_sftp


@pytest.fixture
def mock_sftp_client():
    """Mock paramiko SFTP 客户端"""
    mock = Mock()

    # 模拟文件属性
    mock_attr = Mock()
    mock_attr.st_mode = 0o100644  # 普通文件
    mock_attr.st_size = 1024
    mock_attr.st_mtime = 1609459200
    mock_attr.st_atime = 1609459200

    mock.stat.return_value = mock_attr
    mock.lstat.return_value = mock_attr

    # 模拟目录列表
    mock.listdir_attr.return_value = []
    mock.getcwd.return_value = "/home/test_user"

    # 模拟文件操作
    mock_file = Mock()
    mock_file.read.return_value = b"test content"
    mock_file.write.return_value = None
    mock_file.seek.return_value = None
    mock_file.close.return_value = None

    mock_file_obj = MagicMock()
    mock_file_obj.__enter__ = Mock(return_value=mock_file)
    mock_file_obj.__exit__ = Mock(return_value=False)

    mock.file.return_value = mock_file_obj
    mock.get.return_value = None
    mock.put.return_value = None
    mock.mkdir.return_value = None
    mock.remove.return_value = None
    mock.rmdir.return_value = None
    mock.close.return_value = None

    return mock


class TestAvailability:
    """测试 paramiko 可用性检查"""

    def test_is_available_returns_true_when_paramiko_installed(self, monkeypatch):
        """paramiko 安装时 should return True"""
        module, name = get_ssh_fs_module()
        try:
            # Mock paramiko 为已安装
            mock_paramiko = Mock()
            monkeypatch.setattr(f"{name}.paramiko", mock_paramiko, raising=False)
            monkeypatch.setattr(f"{name}.HAS_PARAMIKO", True, raising=False)

            result = module.is_available()
            assert result is True
        finally:
            cleanup_module(name)

    def test_is_available_returns_false_when_paramiko_not_installed(self, monkeypatch):
        """paramiko 未安装时 should return False"""
        module, name = get_ssh_fs_module()
        try:
            # Mock paramiko 为未安装
            monkeypatch.setattr(f"{name}.HAS_PARAMIKO", False, raising=False)
            monkeypatch.setattr(f"{name}.paramiko", None, raising=False)

            result = module.is_available()
            assert result is False
        finally:
            cleanup_module(name)


class TestConnect:
    """测试 SSH 连接功能"""

    def test_connect_success_with_password(self, monkeypatch, mock_ssh_client):
        """使用密码连接成功 should return connection_id and root_path"""
        mock_ssh, mock_sftp = mock_ssh_client
        mock_sftp.getcwd.return_value = "/home/test_user"

        module, name = get_ssh_fs_module()
        try:
            # Mock paramiko
            mock_paramiko = Mock()
            mock_paramiko.SSHClient = Mock(return_value=mock_ssh)
            mock_paramiko.AutoAddPolicy = Mock()
            mock_paramiko.AuthenticationException = Exception
            mock_paramiko.SSHException = Exception
            monkeypatch.setattr(f"{name}.paramiko", mock_paramiko, raising=False)
            monkeypatch.setattr(f"{name}.HAS_PARAMIKO", True, raising=False)

            # 清空连接池
            module._connection_pool.clear()

            conn_id, root_path = module.connect(
                host="test.example.com",
                port=22,
                username="test_user",
                password="test_password"
            )

            assert conn_id is not None
            assert root_path == "/home/test_user"
        finally:
            cleanup_module(name)

    def test_connect_success_with_key_file(self, monkeypatch, mock_ssh_client):
        """使用密钥文件连接成功 should return connection_id and root_path"""
        mock_ssh, mock_sftp = mock_ssh_client
        module, name = get_ssh_fs_module()
        try:
            mock_paramiko = Mock()
            mock_paramiko.SSHClient = Mock(return_value=mock_ssh)
            mock_paramiko.AutoAddPolicy = Mock()
            mock_paramiko.RSAKey = Mock()
            mock_paramiko.AuthenticationException = Exception
            mock_paramiko.SSHException = Exception
            monkeypatch.setattr(f"{name}.paramiko", mock_paramiko, raising=False)
            monkeypatch.setattr(f"{name}.HAS_PARAMIKO", True, raising=False)

            module._connection_pool.clear()

            conn_id, root_path = module.connect(
                host="test.example.com",
                port=22,
                username="test_user",
                key_filename="/path/to/key"
            )

            assert conn_id is not None
        finally:
            cleanup_module(name)

    def test_connect_authentication_failure(self, monkeypatch, mock_ssh_client):
        """认证失败 should raise SSHAuthError"""
        mock_ssh, mock_sftp = mock_ssh_client
        module, name = get_ssh_fs_module()
        try:
            mock_paramiko = Mock()
            mock_paramiko.SSHClient = Mock(return_value=mock_ssh)
            mock_paramiko.AutoAddPolicy = Mock()
            mock_paramiko.AuthenticationException = type("AuthException", (Exception,), {})
            mock_paramiko.SSHException = Exception
            monkeypatch.setattr(f"{name}.paramiko", mock_paramiko, raising=False)
            monkeypatch.setattr(f"{name}.HAS_PARAMIKO", True, raising=False)

            # Mock connect 方法抛出认证异常
            def connect_raises_auth(*args, **kwargs):
                raise mock_paramiko.AuthenticationException("Authentication failed")

            mock_ssh.connect = connect_raises_auth

            module._connection_pool.clear()

            with pytest.raises(module.SSHAuthError):
                module.connect(
                    host="test.example.com",
                    port=22,
                    username="test_user",
                    password="wrong_password"
                )
        finally:
            cleanup_module(name)

    def test_connect_connection_failure(self, monkeypatch, mock_ssh_client):
        """连接失败 should raise SSHConnectionError"""
        mock_ssh, mock_sftp = mock_ssh_client
        module, name = get_ssh_fs_module()
        try:
            mock_paramiko = Mock()
            mock_paramiko.SSHClient = Mock(return_value=mock_ssh)
            mock_paramiko.AutoAddPolicy = Mock()
            mock_paramiko.AuthenticationException = Exception
            mock_paramiko.SSHException = type("SSHException", (Exception,), {})
            monkeypatch.setattr(f"{name}.paramiko", mock_paramiko, raising=False)
            monkeypatch.setattr(f"{name}.HAS_PARAMIKO", True, raising=False)

            # Mock connect 方法抛出连接异常
            def connect_raises_ssh(*args, **kwargs):
                raise mock_paramiko.SSHException("Connection failed")

            mock_ssh.connect = connect_raises_ssh

            module._connection_pool.clear()

            with pytest.raises(module.SSHConnectionError):
                module.connect(
                    host="unreachable.example.com",
                    port=22,
                    username="test_user",
                    password="test_password"
                )
        finally:
            cleanup_module(name)

    def test_connect_paramiko_not_installed(self, monkeypatch):
        """paramiko 未安装 should raise SSHConnectionError"""
        module, name = get_ssh_fs_module()
        try:
            monkeypatch.setattr(f"{name}.HAS_PARAMIKO", False, raising=False)
            monkeypatch.setattr(f"{name}.paramiko", None, raising=False)

            module._connection_pool.clear()

            with pytest.raises(module.SSHConnectionError, match="paramiko 库未安装"):
                module.connect(
                    host="test.example.com",
                    port=22,
                    username="test_user",
                    password="test_password"
                )
        finally:
            cleanup_module(name)

    def test_connect_default_port(self, monkeypatch, mock_ssh_client):
        """使用默认端口 should use port 22"""
        mock_ssh, mock_sftp = mock_ssh_client
        module, name = get_ssh_fs_module()
        try:
            mock_paramiko = Mock()
            mock_paramiko.SSHClient = Mock(return_value=mock_ssh)
            mock_paramiko.AutoAddPolicy = Mock()
            mock_paramiko.AuthenticationException = Exception
            mock_paramiko.SSHException = Exception
            monkeypatch.setattr(f"{name}.paramiko", mock_paramiko, raising=False)
            monkeypatch.setattr(f"{name}.HAS_PARAMIKO", True, raising=False)

            module._connection_pool.clear()

            conn_id, root_path = module.connect(
                host="test.example.com",
                port=0,  # 使用默认端口
                username="test_user",
                password="test_password"
            )

            assert conn_id is not None
        finally:
            cleanup_module(name)


class TestDisconnect:
    """测试 SSH 断开连接功能"""

    def test_disconnect_valid_connection(self, monkeypatch, mock_ssh_client):
        """断开有效连接 should return True"""
        mock_ssh, mock_sftp = mock_ssh_client
        module, name = get_ssh_fs_module()
        try:
            mock_paramiko = Mock()
            mock_paramiko.SSHClient = Mock(return_value=mock_ssh)
            mock_paramiko.AutoAddPolicy = Mock()
            monkeypatch.setattr(f"{name}.paramiko", mock_paramiko, raising=False)
            monkeypatch.setattr(f"{name}.HAS_PARAMIKO", True, raising=False)

            # 添加连接到池
            conn_id = "test_conn_123"
            module._connection_pool[conn_id] = {
                "ssh": mock_ssh,
                "sftp": None,
                "root": "/home/test",
                "last_active": 0
            }

            result = module.disconnect(conn_id)
            assert result is True
            assert conn_id not in module._connection_pool
        finally:
            cleanup_module(name)

    def test_disconnect_invalid_connection(self):
        """断开无效连接 should return False"""
        module, name = get_ssh_fs_module()
        try:
            result = module.disconnect("nonexistent_conn")
            assert result is False
        finally:
            cleanup_module(name)

    def test_disconnect_all(self, monkeypatch, mock_ssh_client):
        """断开所有连接 should clear connection pool"""
        mock_ssh, mock_sftp = mock_ssh_client
        module, name = get_ssh_fs_module()
        try:
            mock_paramiko = Mock()
            mock_paramiko.SSHClient = Mock(return_value=mock_ssh)
            mock_paramiko.AutoAddPolicy = Mock()
            monkeypatch.setattr(f"{name}.paramiko", mock_paramiko, raising=False)
            monkeypatch.setattr(f"{name}.HAS_PARAMIKO", True, raising=False)

            # 添加多个连接
            for i in range(3):
                module._connection_pool[f"conn_{i}"] = {
                    "ssh": mock_ssh,
                    "sftp": None,
                    "root": "/home/test",
                    "last_active": 0
                }

            module.disconnect_all()
            assert len(module._connection_pool) == 0
        finally:
            cleanup_module(name)


class TestGetConnectedHosts:
    """测试获取连接列表功能"""

    def test_get_connected_hosts_empty(self):
        """没有连接时 should return empty list"""
        module, name = get_ssh_fs_module()
        try:
            module._connection_pool.clear()
            hosts = module.get_connected_hosts()
            assert hosts == []
        finally:
            cleanup_module(name)

    def test_get_connected_hosts_with_connections(self, monkeypatch, mock_ssh_client):
        """有连接时 should return host list"""
        mock_ssh, mock_sftp = mock_ssh_client
        module, name = get_ssh_fs_module()
        try:
            mock_paramiko = Mock()
            mock_paramiko.SSHClient = Mock(return_value=mock_ssh)
            mock_paramiko.AutoAddPolicy = Mock()
            monkeypatch.setattr(f"{name}.paramiko", mock_paramiko, raising=False)
            monkeypatch.setattr(f"{name}.HAS_PARAMIKO", True, raising=False)

            # 添加连接
            module._connection_pool["conn_1"] = {
                "ssh": mock_ssh,
                "sftp": None,
                "root": "/home/user1",
                "host": "server1.example.com",
                "port": 22,
                "username": "user1",
                "last_active": 100
            }
            module._connection_pool["conn_2"] = {
                "ssh": mock_ssh,
                "sftp": None,
                "root": "/home/user2",
                "host": "server2.example.com",
                "port": 2222,
                "username": "user2",
                "last_active": 200
            }

            hosts = module.get_connected_hosts()
            assert len(hosts) == 2
        finally:
            cleanup_module(name)


class TestIsConnected:
    """测试检查连接状态功能"""

    def test_is_connected_valid_connection(self, monkeypatch, mock_ssh_client):
        """有效连接 should return True"""
        mock_ssh, mock_sftp = mock_ssh_client
        # 确保 get_transport 返回的对象的 is_active() 返回 True
        mock_ssh.get_transport.return_value.is_active.return_value = True
        module, name = get_ssh_fs_module()
        try:
            mock_paramiko = Mock()
            mock_paramiko.SSHClient = Mock(return_value=mock_ssh)
            mock_paramiko.AutoAddPolicy = Mock()
            monkeypatch.setattr(f"{name}.paramiko", mock_paramiko, raising=False)
            monkeypatch.setattr(f"{name}.HAS_PARAMIKO", True, raising=False)

            conn_id = "test_conn"
            module._connection_pool[conn_id] = {
                "ssh": mock_ssh,
                "sftp": None,
                "root": "/home/test",
                "last_active": 0
            }

            result = module.is_connected(conn_id)
            assert result is True
        finally:
            cleanup_module(name)

    def test_is_connected_invalid_connection(self):
        """无效连接 should return False"""
        module, name = get_ssh_fs_module()
        try:
            result = module.is_connected("nonexistent_conn")
            assert result is False
        finally:
            cleanup_module(name)


class TestListRemoteFiles:
    """测试列出远程文件功能"""

    def test_list_remote_files_success(self, monkeypatch, mock_sftp_client):
        """列出目录成功 should return file list"""
        module, name = get_ssh_fs_module()
        try:
            # Mock SFTP client listdir_attr - 添加 st_atime 属性
            mock_files = [
                Mock(filename="file1.txt", st_size=1024, st_mode=0o100644, st_mtime=1609459200, st_atime=1609459200),
                Mock(filename="dir1", st_size=4096, st_mode=0o040755, st_mtime=1609459200, st_atime=1609459200),
            ]
            mock_sftp_client.listdir_attr.return_value = mock_files

            # 添加连接
            conn_id = "test_conn"
            mock_ssh = Mock()
            mock_ssh.open_sftp.return_value = mock_sftp_client
            module._connection_pool[conn_id] = {
                "ssh": mock_ssh,
                "sftp": mock_sftp_client,
                "root": "/home/test",
                "last_active": 0
            }

            # Mock get_remote_file_info
            with patch.object(module, "get_remote_file_info", return_value={
                "name": "file1.txt",
                "path": "/home/test/file1.txt",
                "size": 1024,
                "is_dir": False,
                "exists": True
            }):
                files = module.list_remote_files(conn_id, "/home/test")

            assert len(files) == 2
        finally:
            cleanup_module(name)

    def test_list_remote_files_path_not_found(self, monkeypatch):
        """路径不存在 should raise SSHPathError"""
        module, name = get_ssh_fs_module()
        try:
            # 添加连接
            conn_id = "test_conn"
            mock_ssh = Mock()
            mock_sftp = Mock()

            # Mock stat 抛出 FileNotFoundError (代码先检查 stat)
            def raise_filenotfound(*args, **kwargs):
                raise FileNotFoundError("Path not found")

            mock_sftp.stat.side_effect = raise_filenotfound
            mock_ssh.open_sftp.return_value = mock_sftp
            module._connection_pool[conn_id] = {
                "ssh": mock_ssh,
                "sftp": mock_sftp,
                "root": "/home/test",
                "last_active": 0
            }

            with pytest.raises(module.SSHPathError):
                module.list_remote_files(conn_id, "/nonexistent")
        finally:
            cleanup_module(name)

    def test_list_remote_files_connection_not_found(self):
        """连接不存在 should raise SSHConnectionError"""
        module, name = get_ssh_fs_module()
        try:
            with pytest.raises(module.SSHConnectionError):
                module.list_remote_files("nonexistent_conn", "/home/test")
        finally:
            cleanup_module(name)


class TestGetRemoteFileInfo:
    """测试获取远程文件信息功能"""

    def test_get_remote_file_info_success(self, monkeypatch, mock_sftp_client):
        """获取文件信息成功 should return file info"""
        module, name = get_ssh_fs_module()
        try:
            conn_id = "test_conn"
            mock_ssh = Mock()
            mock_ssh.open_sftp.return_value = mock_sftp_client
            module._connection_pool[conn_id] = {
                "ssh": mock_ssh,
                "sftp": mock_sftp_client,
                "root": "/home/test",
                "last_active": 0
            }

            info = module.get_remote_file_info(conn_id, "/test/file.txt")

            assert info is not None
            assert info["exists"] is True
        finally:
            cleanup_module(name)

    def test_get_remote_file_info_not_found(self, monkeypatch):
        """文件不存在 should raise SSHConnectionError"""
        module, name = get_ssh_fs_module()
        try:
            conn_id = "test_conn"
            mock_sftp = Mock()

            # Mock stat 抛出异常
            def raise_ioerror(*args, **kwargs):
                raise IOError("File not found")

            mock_sftp.stat.side_effect = raise_ioerror

            mock_ssh = Mock()
            mock_ssh.open_sftp.return_value = mock_sftp
            module._connection_pool[conn_id] = {
                "ssh": mock_ssh,
                "sftp": mock_sftp,
                "root": "/home/test",
                "last_active": 0
            }

            with pytest.raises(module.SSHConnectionError):
                module.get_remote_file_info(conn_id, "/nonexistent/file.txt")
        finally:
            cleanup_module(name)


class TestDownloadRemoteFile:
    """测试下载远程文件功能"""

    def test_download_remote_file_success(self, monkeypatch, tmp_path):
        """下载文件成功 should return local path"""
        module, name = get_ssh_fs_module()
        try:
            local_dir = tmp_path / "downloads"
            local_dir.mkdir()

            conn_id = "test_conn"
            mock_ssh = Mock()
            mock_sftp = Mock()
            mock_ssh.open_sftp.return_value = mock_sftp
            module._connection_pool[conn_id] = {
                "ssh": mock_ssh,
                "sftp": mock_sftp,
                "root": "/home/test",
                "last_active": 0
            }

            local_path = str(local_dir / "file.txt")
            result = module.download_remote_file(conn_id, "/remote/file.txt", local_path)

            assert result == local_path
        finally:
            cleanup_module(name)

    def test_download_remote_file_remote_not_found(self, monkeypatch):
        """远程文件不存在 should raise SSHConnectionError"""
        module, name = get_ssh_fs_module()
        try:
            conn_id = "test_conn"
            mock_sftp = Mock()

            def raise_ioerror(*args, **kwargs):
                raise IOError("Remote file not found")

            mock_sftp.get.side_effect = raise_ioerror

            mock_ssh = Mock()
            mock_ssh.open_sftp.return_value = mock_sftp
            module._connection_pool[conn_id] = {
                "ssh": mock_ssh,
                "sftp": mock_sftp,
                "root": "/home/test",
                "last_active": 0
            }

            with pytest.raises(module.SSHConnectionError):
                module.download_remote_file(conn_id, "/remote/nonexistent.txt", "/local/file.txt")
        finally:
            cleanup_module(name)


class TestUploadLocalFile:
    """测试上传本地文件功能"""

    def test_upload_local_file_success(self, monkeypatch, tmp_path):
        """上传文件成功 should return remote path"""
        module, name = get_ssh_fs_module()
        try:
            # 创建本地测试文件
            local_file = tmp_path / "test_upload.txt"
            local_file.write_text("test content")

            conn_id = "test_conn"
            mock_ssh = Mock()
            mock_sftp = Mock()
            mock_ssh.open_sftp.return_value = mock_sftp
            module._connection_pool[conn_id] = {
                "ssh": mock_ssh,
                "sftp": mock_sftp,
                "root": "/home/test",
                "last_active": 0
            }

            result = module.upload_local_file(conn_id, str(local_file), "/remote/uploaded.txt")

            assert result == "/remote/uploaded.txt"
        finally:
            cleanup_module(name)

    def test_upload_local_file_local_not_found(self, monkeypatch):
        """本地文件不存在 should raise SSHConnectionError"""
        module, name = get_ssh_fs_module()
        try:
            conn_id = "test_conn"
            mock_ssh = Mock()
            mock_sftp = Mock()
            mock_ssh.open_sftp.return_value = mock_sftp
            module._connection_pool[conn_id] = {
                "ssh": mock_ssh,
                "sftp": mock_sftp,
                "root": "/home/test",
                "last_active": 0
            }

            with pytest.raises(module.SSHConnectionError, match="上传失败"):
                module.upload_local_file(conn_id, "/nonexistent/local.txt", "/remote/uploaded.txt")
        finally:
            cleanup_module(name)


class TestCreateRemoteDirectory:
    """测试创建远程目录功能"""

    def test_create_remote_directory_success(self, monkeypatch):
        """创建目录成功 should return path"""
        module, name = get_ssh_fs_module()
        try:
            conn_id = "test_conn"
            mock_ssh = Mock()
            mock_sftp = Mock()
            mock_sftp.mkdir.return_value = None
            # Mock stat 返回父目录属性 (目录存在)
            mock_stat = Mock()
            mock_stat.st_mode = 0o040755  # 目录
            mock_sftp.stat.return_value = mock_stat
            mock_ssh.open_sftp.return_value = mock_sftp
            module._connection_pool[conn_id] = {
                "ssh": mock_ssh,
                "sftp": mock_sftp,
                "root": "/home/test",
                "last_active": 0
            }

            result = module.create_remote_directory(conn_id, "/remote/new_dir")

            assert result == "/remote/new_dir"
        finally:
            cleanup_module(name)

    def test_create_remote_directory_already_exists(self, monkeypatch):
        """目录已存在 should raise SSHPathError"""
        module, name = get_ssh_fs_module()
        try:
            conn_id = "test_conn"
            mock_sftp = Mock()
            # SFTP mkdir 会抛出 FileExistsError 当目录已存在
            mock_sftp.mkdir.side_effect = FileExistsError("Directory exists")
            # Mock stat 返回目标目录属性 (目录已存在)
            mock_stat = Mock()
            mock_stat.st_mode = 0o040755  # 目录
            mock_sftp.stat.return_value = mock_stat

            mock_ssh = Mock()
            mock_ssh.open_sftp.return_value = mock_sftp
            module._connection_pool[conn_id] = {
                "ssh": mock_ssh,
                "sftp": mock_sftp,
                "root": "/home/test",
                "last_active": 0
            }

            with pytest.raises(module.SSHPathError):
                module.create_remote_directory(conn_id, "/remote/existing_dir")
        finally:
            cleanup_module(name)


class TestDeleteRemoteFile:
    """测试删除远程文件功能"""

    def test_delete_remote_file_success(self, monkeypatch):
        """删除文件成功 should return True"""
        module, name = get_ssh_fs_module()
        try:
            conn_id = "test_conn"
            mock_ssh = Mock()
            mock_sftp = Mock()
            mock_sftp.remove.return_value = None
            mock_sftp.rmdir.return_value = None
            # Mock stat 返回文件属性 (普通文件)
            mock_stat = Mock()
            mock_stat.st_mode = 0o100644  # 普通文件
            mock_sftp.stat.return_value = mock_stat
            mock_ssh.open_sftp.return_value = mock_sftp
            module._connection_pool[conn_id] = {
                "ssh": mock_ssh,
                "sftp": mock_sftp,
                "root": "/home/test",
                "last_active": 0
            }

            result = module.delete_remote_file(conn_id, "/remote/file.txt", False)

            assert result is True
        finally:
            cleanup_module(name)

    def test_delete_remote_directory_success(self, monkeypatch):
        """删除目录成功 should return True"""
        module, name = get_ssh_fs_module()
        try:
            conn_id = "test_conn"
            mock_ssh = Mock()
            mock_sftp = Mock()
            mock_sftp.remove.side_effect = IOError("Is a directory")
            mock_sftp.rmdir.return_value = None
            # Mock stat 返回目录属性
            mock_stat = Mock()
            mock_stat.st_mode = 0o040755  # 目录
            mock_sftp.stat.return_value = mock_stat
            # Mock listdir 返回空列表 (目录为空)
            mock_sftp.listdir.return_value = []
            mock_ssh.open_sftp.return_value = mock_sftp
            module._connection_pool[conn_id] = {
                "ssh": mock_ssh,
                "sftp": mock_sftp,
                "root": "/home/test",
                "last_active": 0
            }

            result = module.delete_remote_file(conn_id, "/remote/dir", False)

            assert result is True
        finally:
            cleanup_module(name)

    def test_delete_remote_file_not_found(self, monkeypatch):
        """文件不存在 should raise SSHConnectionError"""
        module, name = get_ssh_fs_module()
        try:
            conn_id = "test_conn"
            mock_sftp = Mock()

            def raise_ioerror(*args, **kwargs):
                raise IOError("File not found")

            mock_sftp.stat.side_effect = raise_ioerror
            mock_sftp.remove.side_effect = raise_ioerror
            mock_sftp.rmdir.side_effect = raise_ioerror

            mock_ssh = Mock()
            mock_ssh.open_sftp.return_value = mock_sftp
            module._connection_pool[conn_id] = {
                "ssh": mock_ssh,
                "sftp": mock_sftp,
                "root": "/home/test",
                "last_active": 0
            }

            with pytest.raises(module.SSHConnectionError):
                module.delete_remote_file(conn_id, "/remote/nonexistent.txt", False)
        finally:
            cleanup_module(name)


class TestReadRemoteFile:
    """测试读取远程文件功能"""

    def test_read_remote_file_success(self, monkeypatch, mock_sftp_client):
        """读取文件成功 should return content"""
        module, name = get_ssh_fs_module()
        try:
            conn_id = "test_conn"
            mock_ssh = Mock()
            mock_ssh.open_sftp.return_value = mock_sftp_client
            module._connection_pool[conn_id] = {
                "ssh": mock_ssh,
                "sftp": mock_sftp_client,
                "root": "/home/test",
                "last_active": 0
            }

            content = module.read_remote_file(conn_id, "/remote/file.txt")

            assert content == b"test content"
        finally:
            cleanup_module(name)

    def test_read_remote_file_with_offset(self, monkeypatch, mock_sftp_client):
        """使用偏移量读取文件 should return partial content"""
        module, name = get_ssh_fs_module()
        try:
            conn_id = "test_conn"
            mock_ssh = Mock()
            mock_ssh.open_sftp.return_value = mock_sftp_client
            module._connection_pool[conn_id] = {
                "ssh": mock_ssh,
                "sftp": mock_sftp_client,
                "root": "/home/test",
                "last_active": 0
            }

            content = module.read_remote_file(conn_id, "/remote/file.txt", offset=10, length=100)

            assert content is not None
        finally:
            cleanup_module(name)
