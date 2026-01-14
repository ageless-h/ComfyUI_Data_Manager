# -*- coding: utf-8 -*-
"""tests/test_ssh_routes.py - SSH API 路由测试

测试 api/routes/ssh.py 模块的 API 端点
"""

import pytest
import json
import sys
import importlib.util
from pathlib import Path
from unittest.mock import Mock, patch, AsyncMock

# 添加 ComfyUI 目录到 sys.path 以支持 comfy_api 导入
comfy_ui_path = Path(__file__).parent.parent.parent.parent
if str(comfy_ui_path) not in sys.path:
    sys.path.insert(0, str(comfy_ui_path))

# 直接加载 ssh_fs 模块，避免触发 custom_nodes 包初始化
project_root = Path(__file__).parent.parent.parent
ssh_fs_path = project_root / "backend" / "helpers" / "ssh_fs.py"
spec = importlib.util.spec_from_file_location("ssh_fs", str(ssh_fs_path))
ssh_fs = importlib.util.module_from_spec(spec)
sys.modules["ssh_fs"] = ssh_fs
spec.loader.exec_module(ssh_fs)

# 创建模拟的包层级结构以支持相对导入
# backend -> api -> routes -> ssh (需要 ...helpers.ssh_fs)
mock_api = type(sys)("mock_api")
mock_routes = type(sys)("mock_routes")
mock_helpers = type(sys)("mock_helpers")
mock_helpers.ssh_fs = ssh_fs
mock_routes.helpers = mock_helpers
mock_api.routes = mock_routes

# 注入到 sys.modules
sys.modules["custom_nodes.ComfyUI_Data_Manager.helpers"] = mock_helpers
sys.modules["custom_nodes.ComfyUI_Data_Manager.helpers.ssh_fs"] = ssh_fs
sys.modules["custom_nodes.ComfyUI_Data_Manager.backend"] = type(sys)("mock_package")
sys.modules["custom_nodes.ComfyUI_Data_Manager.backend.api"] = mock_api
sys.modules["custom_nodes.ComfyUI_Data_Manager.backend.api.routes"] = mock_routes

# 读取 ssh.py 内容并替换相对导入为绝对导入
ssh_routes_path = project_root / "backend" / "api" / "routes" / "ssh.py"
with open(ssh_routes_path, "r", encoding="utf-8") as f:
    ssh_routes_code = f.read()

# 替换相对导入
ssh_routes_code = ssh_routes_code.replace(
    "from ...helpers.ssh_fs import (",
    "from ssh_fs import ("
)
ssh_routes_code = ssh_routes_code.replace(
    "from ...helpers import (",
    "from mock_helpers import ("
)

# 动态创建模块
# 创建 Mock web 模块，包含 json_response 方法
mock_web = Mock()
mock_web.json_response = Mock(side_effect=lambda data, status=200: Mock(
    status=status,
    body=json.dumps(data).encode(),
    text=json.dumps(data),
    headers={}
))

ssh_routes = type(sys)("ssh_routes")
ssh_routes.__dict__.update({
    "web": mock_web,  # Mock aiohttp.web with json_response
    "logging": __import__("logging"),
    "os": __import__("os"),
    "ssh_fs": ssh_fs,
    "mock_helpers": mock_helpers,
})

# 执行修改后的代码
exec(ssh_routes_code, ssh_routes.__dict__)

# 从 ssh_routes 导入需要的处理函数
ssh_connect_handler = ssh_routes.ssh_connect_handler
ssh_disconnect_handler = ssh_routes.ssh_disconnect_handler
ssh_list_handler = ssh_routes.ssh_list_handler
ssh_info_handler = ssh_routes.ssh_info_handler
ssh_download_handler = ssh_routes.ssh_download_handler
ssh_upload_handler = ssh_routes.ssh_upload_handler
ssh_delete_handler = ssh_routes.ssh_delete_handler
ssh_list_hosts_handler = ssh_routes.ssh_list_hosts_handler
ssh_read_handler = ssh_routes.ssh_read_handler

# 从 ssh_fs 导入异常类
SSHConnectionError = ssh_fs.SSHConnectionError
SSHAuthError = ssh_fs.SSHAuthError
SSHPathError = ssh_fs.SSHPathError


class MockRequest:
    """Mock aiohttp request object"""

    def __init__(self, json_data=None):
        self._json_data = json_data or {}

    async def json(self):
        return self._json_data


class MockResponse:
    """Mock aiohttp response helper"""

    @staticmethod
    def json_response(data, status=200):
        """Create JSON response"""
        response = Mock()
        response.status = status
        response.body = json.dumps(data).encode()
        response.text = json.dumps(data)
        response.headers = {}
        return response


@pytest.mark.asyncio
class TestSSHConnectHandler:
    """测试 SSH 连接端点"""

    async def test_connect_success(self, monkeypatch):
        """连接成功 should return connection_id and info"""
        # Mock ssh_fs.connect
        mock_connect = patch("ssh_fs.connect", return_value=("conn_12345", "/home/user"))
        mock_connect.start()

        request = MockRequest({
            "host": "test.example.com",
            "port": 22,
            "username": "test_user",
            "password": "test_password"
        })

        response = await ssh_connect_handler(request)

        assert response.status == 200
        response = Mock.json_response(json.loads(response.body))
        # 验证响应结构
        body = json.loads(response.body)
        assert body["success"] is True
        assert "connection_id" in body
        assert body["host"] == "test.example.com"
        assert body["username"] == "test_user"

        mock_connect.stop()

    async def test_connect_missing_host(self):
        """缺少主机地址 should return 400 error"""
        request = MockRequest({
            "port": 22,
            "username": "test_user",
            "password": "test_password"
        })

        response = await ssh_connect_handler(request)

        assert response.status == 400
        body = json.loads(response.body)
        assert "error" in body
        assert "host" in body["error"]

    async def test_connect_missing_username(self):
        """缺少用户名 should return 400 error"""
        request = MockRequest({
            "host": "test.example.com",
            "port": 22,
            "password": "test_password"
        })

        response = await ssh_connect_handler(request)

        assert response.status == 400
        body = json.loads(response.body)
        assert "error" in body
        assert "username" in body["error"]

    async def test_connect_auth_failure(self, monkeypatch):
        """认证失败 should return 401 error"""
        mock_connect = patch("ssh_fs.connect", side_effect=SSHAuthError("认证失败"))
        mock_connect.start()

        request = MockRequest({
            "host": "test.example.com",
            "port": 22,
            "username": "test_user",
            "password": "wrong_password"
        })

        response = await ssh_connect_handler(request)

        assert response.status == 401
        body = json.loads(response.body)
        assert "error" in body

        mock_connect.stop()

    async def test_connect_connection_failure(self, monkeypatch):
        """连接失败 should return 500 error"""
        mock_connect = patch("ssh_fs.connect", side_effect=SSHConnectionError("连接超时"))
        mock_connect.start()

        request = MockRequest({
            "host": "unreachable.example.com",
            "port": 22,
            "username": "test_user",
            "password": "test_password"
        })

        response = await ssh_connect_handler(request)

        assert response.status == 500
        body = json.loads(response.body)
        assert "error" in body

        mock_connect.stop()


@pytest.mark.asyncio
class TestSSHDisconnectHandler:
    """测试 SSH 断开连接端点"""

    async def test_disconnect_success(self, monkeypatch):
        """断开连接成功 should return success"""
        mock_disconnect = patch("ssh_fs.disconnect", return_value=True)
        mock_disconnect.start()

        request = MockRequest({"connection_id": "conn_12345"})

        response = await ssh_disconnect_handler(request)

        assert response.status == 200
        body = json.loads(response.body)
        assert body["success"] is True

        mock_disconnect.stop()

    async def test_disconnect_missing_connection_id(self):
        """缺少 connection_id should return 400 error"""
        request = MockRequest({})

        response = await ssh_disconnect_handler(request)

        assert response.status == 400
        body = json.loads(response.body)
        assert "error" in body

    async def test_disconnect_connection_not_found(self, monkeypatch):
        """连接不存在 should return 404 error"""
        mock_disconnect = patch("ssh_fs.disconnect", return_value=False)
        mock_disconnect.start()

        request = MockRequest({"connection_id": "nonexistent_conn"})

        response = await ssh_disconnect_handler(request)

        assert response.status == 404
        body = json.loads(response.body)
        assert "error" in body

        mock_disconnect.stop()


@pytest.mark.asyncio
class TestSSHListHandler:
    """测试列出目录端点"""

    async def test_list_success(self, monkeypatch):
        """列出目录成功 should return file list"""
        mock_files = [
            {"name": "file1.txt", "path": "/path/file1.txt", "size": 1024, "is_dir": False},
            {"name": "dir1", "path": "/path/dir1", "size": 4096, "is_dir": True},
        ]
        mock_list = patch("ssh_fs.list_remote_files", return_value=mock_files)
        mock_list.start()

        request = MockRequest({
            "connection_id": "conn_12345",
            "path": "/home/user"
        })

        response = await ssh_list_handler(request)

        assert response.status == 200
        body = json.loads(response.body)
        assert body["success"] is True
        assert body["path"] == "/home/user"
        assert body["count"] == 2
        assert len(body["files"]) == 2

        mock_list.stop()

    async def test_list_missing_connection_id(self):
        """缺少 connection_id should return 400 error"""
        request = MockRequest({"path": "/home/user"})

        response = await ssh_list_handler(request)

        assert response.status == 400
        body = json.loads(response.body)
        assert "error" in body

    async def test_list_connection_not_found(self, monkeypatch):
        """连接不存在 should return 500 error"""
        mock_list = patch("ssh_fs.list_remote_files", side_effect=SSHConnectionError("连接不存在"))
        mock_list.start()

        request = MockRequest({
            "connection_id": "nonexistent_conn",
            "path": "/home/user"
        })

        response = await ssh_list_handler(request)

        assert response.status == 500
        body = json.loads(response.body)
        assert "error" in body

        mock_list.stop()

    async def test_list_path_not_found(self, monkeypatch):
        """路径不存在 should return 404 error"""
        mock_list = patch("ssh_fs.list_remote_files", side_effect=SSHPathError("路径不存在"))
        mock_list.start()

        request = MockRequest({
            "connection_id": "conn_12345",
            "path": "/nonexistent/path"
        })

        response = await ssh_list_handler(request)

        assert response.status == 404
        body = json.loads(response.body)
        assert "error" in body

        mock_list.stop()


@pytest.mark.asyncio
class TestSSHInfoHandler:
    """测试获取文件信息端点"""

    async def test_info_success(self, monkeypatch):
        """获取文件信息成功 should return file info"""
        mock_info = {
            "name": "test.txt",
            "path": "/path/test.txt",
            "size": 2048,
            "is_dir": False,
            "exists": True
        }
        mock_get = patch("ssh_fs.get_remote_file_info", return_value=mock_info)
        mock_get.start()

        request = MockRequest({
            "connection_id": "conn_12345",
            "path": "/path/test.txt"
        })

        response = await ssh_info_handler(request)

        assert response.status == 200
        body = json.loads(response.body)
        assert body["success"] is True
        assert "info" in body
        assert body["info"]["name"] == "test.txt"

        mock_get.stop()

    async def test_info_missing_connection_id(self):
        """缺少 connection_id should return 400 error"""
        request = MockRequest({"path": "/path/test.txt"})

        response = await ssh_info_handler(request)

        assert response.status == 400
        body = json.loads(response.body)
        assert "error" in body

    async def test_info_missing_path(self):
        """缺少路径 should return 400 error"""
        request = MockRequest({"connection_id": "conn_12345"})

        response = await ssh_info_handler(request)

        assert response.status == 400
        body = json.loads(response.body)
        assert "error" in body


@pytest.mark.asyncio
class TestSSHDownloadHandler:
    """测试下载文件端点"""

    async def test_download_success(self, monkeypatch, tmp_path):
        """下载文件成功 should return local path"""
        # 创建目标目录
        local_dir = tmp_path / "downloads"
        local_dir.mkdir()

        mock_download = patch("ssh_fs.download_remote_file", return_value=str(local_dir / "file.txt"))
        mock_download.start()

        request = MockRequest({
            "connection_id": "conn_12345",
            "remote_path": "/remote/file.txt",
            "local_path": str(local_dir / "file.txt")
        })

        response = await ssh_download_handler(request)

        assert response.status == 200
        body = json.loads(response.body)
        assert body["success"] is True
        assert "local_path" in body

        mock_download.stop()

    async def test_download_missing_parameters(self):
        """缺少参数 should return 400 error"""
        request = MockRequest({
            "connection_id": "conn_12345",
            "remote_path": "/remote/file.txt"
            # 缺少 local_path
        })

        response = await ssh_download_handler(request)

        assert response.status == 400
        body = json.loads(response.body)
        assert "error" in body


@pytest.mark.asyncio
class TestSSHUploadHandler:
    """测试上传文件端点"""

    async def test_upload_success(self, monkeypatch):
        """上传文件成功 should return remote path"""
        mock_upload = patch("ssh_fs.upload_local_file", return_value="/remote/uploaded.txt")
        mock_upload.start()

        request = MockRequest({
            "connection_id": "conn_12345",
            "local_path": "/local/file.txt",
            "remote_path": "/remote/uploaded.txt"
        })

        response = await ssh_upload_handler(request)

        assert response.status == 200
        body = json.loads(response.body)
        assert body["success"] is True
        assert body["remote_path"] == "/remote/uploaded.txt"

        mock_upload.stop()

    async def test_upload_missing_parameters(self):
        """缺少参数 should return 400 error"""
        request = MockRequest({
            "connection_id": "conn_12345"
            # 缺少 local_path 和 remote_path
        })

        response = await ssh_upload_handler(request)

        assert response.status == 400
        body = json.loads(response.body)
        assert "error" in body


@pytest.mark.asyncio
class TestSSHDeleteHandler:
    """测试删除文件端点"""

    async def test_delete_success(self, monkeypatch):
        """删除文件成功 should return success"""
        mock_delete = patch("ssh_fs.delete_remote_file", return_value=True)
        mock_delete.start()

        request = MockRequest({
            "connection_id": "conn_12345",
            "path": "/remote/file.txt",
            "use_trash": False
        })

        response = await ssh_delete_handler(request)

        assert response.status == 200
        body = json.loads(response.body)
        assert body["success"] is True

        mock_delete.stop()

    async def test_delete_missing_parameters(self):
        """缺少参数 should return 400 error"""
        request = MockRequest({
            "connection_id": "conn_12345"
            # 缺少 path
        })

        response = await ssh_delete_handler(request)

        assert response.status == 400
        body = json.loads(response.body)
        assert "error" in body


@pytest.mark.asyncio
class TestSSHListHostsHandler:
    """测试获取主机列表端点"""

    async def test_list_hosts_empty(self, monkeypatch):
        """没有连接时 should return empty list"""
        mock_get = patch("ssh_fs.get_connected_hosts", return_value=[])
        mock_get.start()

        # Mock aiohttp web.json_response
        with patch("backend.api.routes.ssh.web.json_response") as mock_json_response:
            mock_response = Mock()
            mock_response.status = 200
            mock_response.body = json.dumps({"success": True, "hosts": [], "count": 0}).encode()
            mock_json_response.return_value = mock_response

            response = await ssh_list_hosts_handler(None)

            assert response.status == 200

        mock_get.stop()

    async def test_list_hosts_with_connections(self, monkeypatch):
        """有连接时 should return host list"""
        mock_hosts = [
            {"id": "conn1", "host": "server1.example.com", "port": 22, "username": "user1"},
            {"id": "conn2", "host": "server2.example.com", "port": 2222, "username": "user2"},
        ]
        mock_get = patch("ssh_fs.get_connected_hosts", return_value=mock_hosts)
        mock_get.start()

        # Mock aiohttp web.json_response
        with patch("backend.api.routes.ssh.web.json_response") as mock_json_response:
            mock_response = Mock()
            mock_response.status = 200
            mock_response.body = json.dumps({"success": True, "hosts": mock_hosts, "count": 2}).encode()
            mock_json_response.return_value = mock_response

            response = await ssh_list_hosts_handler(None)

            assert response.status == 200

        mock_get.stop()


@pytest.mark.asyncio
class TestSSHReadHandler:
    """测试读取文件端点"""

    async def test_read_success(self, monkeypatch):
        """读取文件成功 should return content"""
        mock_read = patch("ssh_fs.read_remote_file", return_value=b"file content")
        mock_read.start()

        request = MockRequest({
            "connection_id": "conn_12345",
            "path": "/remote/file.txt",
            "offset": 0,
            "length": -1
        })

        response = await ssh_read_handler(request)

        assert response.status == 200
        body = json.loads(response.body)
        assert body["success"] is True
        assert "content_length" in body

        mock_read.stop()

    async def test_read_missing_parameters(self):
        """缺少参数 should return 400 error"""
        request = MockRequest({
            "connection_id": "conn_12345"
            # 缺少 path
        })

        response = await ssh_read_handler(request)

        assert response.status == 400
        body = json.loads(response.body)
        assert "error" in body
