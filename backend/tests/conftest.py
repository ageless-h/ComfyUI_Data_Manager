# -*- coding: utf-8 -*-
"""tests/conftest.py - Pytest 共享配置和 fixtures

提供 SSH 测试所需的共享 fixtures 和配置

注意：此文件避免导入任何 ComfyUI_Data_Manager 包的模块，
以防止在没有 torch/comfy_api 的环境中运行测试时出现问题。
"""

import os
import sys
import pytest
from unittest.mock import Mock, MagicMock
from pathlib import Path

# 添加 ComfyUI 目录到 sys.path 以支持 comfy_api 导入
# 这必须在 conftest 加载时完成，否则会导致父包 __init__.py 导入失败
comfy_ui_path = Path(__file__).parent.parent.parent.parent.parent
if str(comfy_ui_path) not in sys.path:
    sys.path.insert(0, str(comfy_ui_path))


@pytest.fixture
def ssh_test_config():
    """SSH 测试服务器配置

    从环境变量读取测试服务器配置，如果未设置则使用默认值。
    密码必须通过环境变量 SSH_TEST_PASSWORD 设置。
    """
    return {
        "host": os.getenv("SSH_TEST_HOST", "127.0.0.1"),
        "port": int(os.getenv("SSH_TEST_PORT", "22")),
        "username": os.getenv("SSH_TEST_USER", "test_user"),
        "password": os.getenv("SSH_TEST_PASSWORD", ""),
        "test_enabled": bool(os.getenv("SSH_TEST_PASSWORD")),
    }


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

    return mock


@pytest.fixture
def mock_sftp_client():
    """Mock paramiko SFTP 客户端"""
    mock = Mock()

    # 模拟文件属性
    mock_attr = Mock()
    mock_attr.st_mode = 0o100644  # 普通文件
    mock_attr.st_size = 1024
    mock_attr.st_mtime = 1609459200  # 2021-01-01 00:00:00
    mock_attr.st_atime = 1609459200

    mock.stat.return_value = mock_attr
    mock.lstat.return_value = mock_attr

    # 模拟目录列表
    mock.listdir_attr.return_value = [
        Mock(
            filename="test_file.txt",
            st_mode=0o100644,
            st_size=1024,
            st_mtime=1609459200,
        ),
        Mock(
            filename="test_dir",
            st_mode=0o040755,  # 目录
            st_size=4096,
            st_mtime=1609459200,
        ),
    ]

    # 模拟 getcwd
    mock.getcwd.return_value = "/home/test_user"

    # 模拟文件操作
    mock.file.return_value.__enter__ = Mock(return_value=Mock(read=Mock(return_value=b"test content")))
    mock.file.return_value.__exit__ = Mock(return_value=False)

    return mock


@pytest.fixture
def mock_paramiko(monkeypatch):
    """Mock paramiko 模块"""
    mock_ssh = Mock()
    mock_ssh.SSHClient = Mock
    mock_ssh.AutoAddPolicy = Mock
    mock_ssh.AuthenticationException = Exception
    mock_ssh.SSHException = Exception
    mock_ssh.RSAKey = Mock()

    # 只 mock 顶层 paramiko 模块
    monkeypatch.setattr("paramiko", mock_ssh, raising=False)

    return mock_ssh


@pytest.fixture
def sample_file_list():
    """示例文件列表数据"""
    return [
        {
            "name": "test_file.txt",
            "path": "/home/test/test_file.txt",
            "size": 1024,
            "size_human": "1.0 KB",
            "extension": ".txt",
            "modified": "2021-01-01T00:00:00",
            "created": "2021-01-01T00:00:00",
            "is_dir": False,
            "exists": True,
        },
        {
            "name": "test_dir",
            "path": "/home/test/test_dir",
            "size": 4096,
            "size_human": "4.0 KB",
            "extension": "",
            "modified": "2021-01-01T00:00:00",
            "created": "2021-01-01T00:00:00",
            "is_dir": True,
            "exists": True,
        },
    ]


@pytest.fixture
def skip_if_no_paramiko():
    """如果 paramiko 未安装，跳过测试"""
    try:
        import importlib.util
        project_root = Path(__file__).parent.parent.parent
        ssh_fs_path = project_root / "backend" / "helpers" / "ssh_fs.py"
        spec = importlib.util.spec_from_file_location("ssh_fs_check", str(ssh_fs_path))
        ssh_fs = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(ssh_fs)

        if not ssh_fs.HAS_PARAMIKO:
            pytest.skip("paramiko not installed")
    except Exception:
        pytest.skip("paramiko not installed")


@pytest.fixture
def skip_if_no_ssh_credentials(ssh_test_config):
    """如果没有 SSH 测试凭据，跳过集成测试"""
    if not ssh_test_config["test_enabled"]:
        pytest.skip("SSH_TEST_PASSWORD not set - skipping integration test")


@pytest.fixture(autouse=True)
def reset_ssh_connection_pool():
    """每个测试后重置 SSH 连接池

    此 fixture 在每次测试后清理连接池，防止测试之间的状态污染。
    使用 importlib 直接加载 ssh_fs 模块，避免触发父包导入。
    """
    import importlib.util

    # 加载 ssh_fs 模块来访问连接池
    project_root = Path(__file__).parent.parent.parent
    ssh_fs_path = project_root / "backend" / "helpers" / "ssh_fs.py"

    # 为每个测试使用唯一的模块名称，避免缓存冲突
    import hashlib
    import time
    unique_id = f"ssh_fs_reset_{hash(time.time())}"

    spec = importlib.util.spec_from_file_location(unique_id, str(ssh_fs_path))
    ssh_fs = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(ssh_fs)

    # 清理连接池
    if hasattr(ssh_fs, "_connection_pool"):
        original_pool = ssh_fs._connection_pool.copy()
        ssh_fs._connection_pool.clear()

    yield

    # 测试后再清理一次
    if hasattr(ssh_fs, "_connection_pool"):
        ssh_fs._connection_pool.clear()
        # 如果需要，可以恢复原始连接池
        # ssh_fs._connection_pool.update(original_pool)
