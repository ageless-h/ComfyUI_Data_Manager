# -*- coding: utf-8 -*-
"""api/routes/ssh.py - SSH 远程连接管理路由

提供 SSH 连接、文件操作等远程访问 API 端点
"""

from aiohttp import web
import logging
import os

logger = logging.getLogger(__name__)

from ...helpers.ssh_fs import (
    is_available,
    connect,
    disconnect,
    disconnect_all,
    get_connected_hosts,
    list_remote_files,
    get_remote_file_info,
    download_remote_file,
    upload_local_file,
    create_remote_directory,
    delete_remote_file,
    read_remote_file,
    SSHConnectionError,
    SSHAuthError,
    SSHPathError,
)
from ...helpers.ssh_credentials import (
    load_credentials,
    save_credential,
    delete_credential,
    encode_password,
    decode_password,
)


async def ssh_connect_handler(request):
    """建立 SSH 连接

    POST /dm/ssh/connect
    Body: {
        "host": "192.168.1.100",
        "port": 22,
        "username": "user",
        "password": "xxx",
        "key_filename": "/path/to/key"  // 可选
    }
    """
    try:
        data = await request.json()

        host = data.get("host", "")
        port = data.get("port", 22)
        username = data.get("username", "")
        password = data.get("password", "")
        key_filename = data.get("key_filename", "")

        if not host:
            return web.json_response({"error": "host 参数必填"}, status=400)
        if not username:
            return web.json_response({"error": "username 参数必填"}, status=400)

        if not is_available():
            return web.json_response(
                {"error": "paramiko 库未安装", "hint": "请运行: pip install paramiko"}, status=500
            )

        conn_id, root_path = connect(
            host=host,
            port=port,
            username=username,
            password=password,
            key_filename=key_filename if key_filename else None,
        )

        logger.info(f"[DataManager] SSH 连接已建立: {conn_id} -> {username}@{host}:{port}")

        return web.json_response(
            {
                "success": True,
                "connection_id": conn_id,
                "host": host,
                "port": port,
                "username": username,
                "root_path": root_path,
            }
        )

    except SSHAuthError as e:
        logger.warning(f"[DataManager] SSH 认证失败: {e}")
        return web.json_response({"error": str(e)}, status=401)

    except SSHConnectionError as e:
        logger.warning(f"[DataManager] SSH 连接失败: {e}")
        return web.json_response({"error": str(e)}, status=500)

    except Exception as e:
        logger.error(f"[DataManager] SSH 连接异常: {e}")
        return web.json_response({"error": f"连接异常: {str(e)}"}, status=500)


async def ssh_disconnect_handler(request):
    """断开 SSH 连接

    POST /dm/ssh/disconnect
    Body: {"connection_id": "xxx"}
    """
    try:
        data = await request.json()
        conn_id = data.get("connection_id", "")

        if not conn_id:
            return web.json_response({"error": "connection_id 参数必填"}, status=400)

        success = disconnect(conn_id)

        if success:
            logger.info(f"[DataManager] SSH 连接已断开: {conn_id}")
            return web.json_response({"success": True})
        else:
            return web.json_response({"error": "连接不存在或已断开"}, status=404)

    except Exception as e:
        logger.error(f"[DataManager] SSH 断开连接异常: {e}")
        return web.json_response({"error": str(e)}, status=500)


async def ssh_list_handler(request):
    """列出远程目录内容

    POST /dm/ssh/list
    Body: {"connection_id": "xxx", "path": "/remote/path"}
    """
    try:
        data = await request.json()
        conn_id = data.get("connection_id", "")
        path = data.get("path", ".")

        if not conn_id:
            return web.json_response({"error": "connection_id 参数必填"}, status=400)

        files = list_remote_files(conn_id, path)

        return web.json_response(
            {"success": True, "path": path, "files": files, "count": len(files)}
        )

    except SSHConnectionError as e:
        return web.json_response({"error": str(e)}, status=500)
    except SSHPathError as e:
        return web.json_response({"error": str(e)}, status=404)
    except Exception as e:
        logger.error(f"[DataManager] SSH list 异常: {e}")
        return web.json_response({"error": str(e)}, status=500)


async def ssh_info_handler(request):
    """获取远程文件信息

    POST /dm/ssh/info
    Body: {"connection_id": "xxx", "path": "/remote/file"}
    """
    try:
        data = await request.json()
        conn_id = data.get("connection_id", "")
        path = data.get("path", "")

        if not conn_id:
            return web.json_response({"error": "connection_id 参数必填"}, status=400)
        if not path:
            return web.json_response({"error": "path 参数必填"}, status=400)

        info = get_remote_file_info(conn_id, path)

        return web.json_response({"success": True, "info": info})

    except SSHConnectionError as e:
        return web.json_response({"error": str(e)}, status=500)
    except SSHPathError as e:
        return web.json_response({"error": str(e)}, status=404)
    except Exception as e:
        logger.error(f"[DataManager] SSH info 异常: {e}")
        return web.json_response({"error": str(e)}, status=500)


async def ssh_download_handler(request):
    """下载远程文件

    POST /dm/ssh/download
    Body: {
        "connection_id": "xxx",
        "remote_path": "/remote/file",
        "local_path": "C:/temp/output"
    }
    """
    try:
        data = await request.json()
        conn_id = data.get("connection_id", "")
        remote_path = data.get("remote_path", "")
        local_path = data.get("local_path", "")

        if not conn_id:
            return web.json_response({"error": "connection_id 参数必填"}, status=400)
        if not remote_path:
            return web.json_response({"error": "remote_path 参数必填"}, status=400)
        if not local_path:
            return web.json_response({"error": "local_path 参数必填"}, status=400)

        # 确保本地目录存在
        local_dir = os.path.dirname(local_path)
        if local_dir:
            os.makedirs(local_dir, exist_ok=True)

        result_path = download_remote_file(conn_id, remote_path, local_path)

        return web.json_response({"success": True, "local_path": result_path})

    except SSHConnectionError as e:
        return web.json_response({"error": str(e)}, status=500)
    except SSHPathError as e:
        return web.json_response({"error": str(e)}, status=404)
    except Exception as e:
        logger.error(f"[DataManager] SSH download 异常: {e}")
        return web.json_response({"error": str(e)}, status=500)


async def ssh_upload_handler(request):
    """上传本地文件到远程

    POST /dm/ssh/upload
    Body: {
        "connection_id": "xxx",
        "local_path": "C:/local/file",
        "remote_path": "/remote/path"
    }
    """
    try:
        data = await request.json()
        conn_id = data.get("connection_id", "")
        local_path = data.get("local_path", "")
        remote_path = data.get("remote_path", "")

        if not conn_id:
            return web.json_response({"error": "connection_id 参数必填"}, status=400)
        if not local_path:
            return web.json_response({"error": "local_path 参数必填"}, status=400)
        if not remote_path:
            return web.json_response({"error": "remote_path 参数必填"}, status=400)

        result_path = upload_local_file(conn_id, local_path, remote_path)

        return web.json_response({"success": True, "remote_path": result_path})

    except SSHConnectionError as e:
        return web.json_response({"error": str(e)}, status=500)
    except SSHPathError as e:
        return web.json_response({"error": str(e)}, status=404)
    except Exception as e:
        logger.error(f"[DataManager] SSH upload 异常: {e}")
        return web.json_response({"error": str(e)}, status=500)


async def ssh_delete_handler(request):
    """删除远程文件或目录

    POST /dm/ssh/delete
    Body: {"connection_id": "xxx", "path": "/remote/path", "use_trash": false}
    """
    try:
        data = await request.json()
        conn_id = data.get("connection_id", "")
        path = data.get("path", "")
        use_trash = data.get("use_trash", False)

        if not conn_id:
            return web.json_response({"error": "connection_id 参数必填"}, status=400)
        if not path:
            return web.json_response({"error": "path 参数必填"}, status=400)

        success = delete_remote_file(conn_id, path, use_trash)

        return web.json_response({"success": success})

    except SSHConnectionError as e:
        return web.json_response({"error": str(e)}, status=500)
    except SSHPathError as e:
        return web.json_response({"error": str(e)}, status=404)
    except Exception as e:
        logger.error(f"[DataManager] SSH delete 异常: {e}")
        return web.json_response({"error": str(e)}, status=500)


async def ssh_list_hosts_handler(request):
    """获取已连接的远程主机列表

    GET /dm/ssh/hosts
    """
    try:
        hosts = get_connected_hosts()
        return web.json_response({"success": True, "hosts": hosts, "count": len(hosts)})

    except Exception as e:
        logger.error(f"[DataManager] SSH list_hosts 异常: {e}")
        return web.json_response({"error": str(e)}, status=500)


async def ssh_read_handler(request):
    """读取远程文件内容（用于预览）

    POST /dm/ssh/read
    Body: {"connection_id": "xxx", "path": "/remote/file", "offset": 0, "length": -1}
    """
    try:
        data = await request.json()
        conn_id = data.get("connection_id", "")
        path = data.get("path", "")
        offset = data.get("offset", 0)
        length = data.get("length", -1)

        if not conn_id:
            return web.json_response({"error": "connection_id 参数必填"}, status=400)
        if not path:
            return web.json_response({"error": "path 参数必填"}, status=400)

        content = read_remote_file(conn_id, path, offset, length)

        return web.json_response(
            {
                "success": True,
                "content_length": len(content),
                "content": (
                    content.decode("latin-1") if len(content) < 1024 * 1024 else None
                ),  # 小于 1MB 直接返回
            }
        )

    except SSHConnectionError as e:
        return web.json_response({"error": str(e)}, status=500)
    except SSHPathError as e:
        return web.json_response({"error": str(e)}, status=404)
    except Exception as e:
        logger.error(f"[DataManager] SSH read 异常: {e}")
        return web.json_response({"error": str(e)}, status=500)


async def ssh_credentials_save_handler(request):
    """保存 SSH 连接凭证

    POST /dm/ssh/credentials/save
    Body: {
        "id": "optional-id",  // 可选，不提供则自动生成
        "name": "user@host",
        "host": "192.168.1.100",
        "port": 22,
        "username": "user",
        "password": "xxx"
    }
    """
    try:
        data = await request.json()

        name = data.get("name", "")
        host = data.get("host", "")
        port = data.get("port", 22)
        username = data.get("username", "")
        password = data.get("password", "")
        credential_id = data.get("id", f"{username}@{host}:{port}")

        if not host or not username:
            return web.json_response({"error": "host 和 username 参数必填"}, status=400)

        # 创建凭证对象
        credential = {
            "id": credential_id,
            "name": name or f"{username}@{host}",
            "host": host,
            "port": port,
            "username": username,
            "password": encode_password(password),
            "created": data.get("created", None),
        }

        success = save_credential(credential)

        if success:
            logger.info(f"[DataManager] SSH 凭证已保存: {credential['name']}")
            return web.json_response({"success": True, "credential": credential})
        else:
            return web.json_response({"error": "保存凭证失败"}, status=500)

    except Exception as e:
        logger.error(f"[DataManager] SSH 凭证保存异常: {e}")
        return web.json_response({"error": str(e)}, status=500)


async def ssh_credentials_list_handler(request):
    """获取已保存的 SSH 凭证列表

    GET /dm/ssh/credentials/list
    """
    try:
        credentials = load_credentials()

        # 隐藏密码字段返回
        safe_credentials = []
        for cred in credentials:
            safe_credentials.append({
                "id": cred.get("id"),
                "name": cred.get("name"),
                "host": cred.get("host"),
                "port": cred.get("port"),
                "username": cred.get("username"),
                "created": cred.get("created"),
            })

        return web.json_response({
            "success": True,
            "credentials": safe_credentials,
            "count": len(safe_credentials)
        })

    except Exception as e:
        logger.error(f"[DataManager] SSH 凭证列表获取异常: {e}")
        return web.json_response({"error": str(e)}, status=500)


async def ssh_credentials_delete_handler(request):
    """删除已保存的 SSH 凭证

    POST /dm/ssh/credentials/delete
    Body: {"id": "credential-id"}
    """
    try:
        data = await request.json()
        credential_id = data.get("id", "")

        if not credential_id:
            return web.json_response({"error": "id 参数必填"}, status=400)

        success = delete_credential(credential_id)

        if success:
            logger.info(f"[DataManager] SSH 凭证已删除: {credential_id}")
            return web.json_response({"success": True})
        else:
            return web.json_response({"error": "凭证不存在或删除失败"}, status=404)

    except Exception as e:
        logger.error(f"[DataManager] SSH 凭证删除异常: {e}")
        return web.json_response({"error": str(e)}, status=500)


def register_ssh_routes(server):
    """注册 SSH 相关路由

    Args:
        server: ComfyUI PromptServer 实例
    """
    # 路由配置：(路径, 处理器, HTTP方法)
    routes = [
        ("/dm/ssh/connect", ssh_connect_handler, "POST"),
        ("/dm/ssh/disconnect", ssh_disconnect_handler, "POST"),
        ("/dm/ssh/list", ssh_list_handler, "POST"),
        ("/dm/ssh/info", ssh_info_handler, "POST"),
        ("/dm/ssh/download", ssh_download_handler, "POST"),
        ("/dm/ssh/upload", ssh_upload_handler, "POST"),
        ("/dm/ssh/delete", ssh_delete_handler, "POST"),
        ("/dm/ssh/hosts", ssh_list_hosts_handler, "GET"),
        ("/dm/ssh/read", ssh_read_handler, "POST"),
        # 凭证管理路由
        ("/dm/ssh/credentials/save", ssh_credentials_save_handler, "POST"),
        ("/dm/ssh/credentials/list", ssh_credentials_list_handler, "GET"),
        ("/dm/ssh/credentials/delete", ssh_credentials_delete_handler, "POST"),
    ]

    # 优先使用 PromptServer.routes 注册
    if hasattr(server, "routes") and server.routes is not None:
        try:
            for path, handler, method in routes:
                if method.upper() == "GET":
                    server.routes.get(path)(handler)
                else:
                    server.routes.post(path)(handler)
            logger.info(f"[DataManager] SSH routes registered: {len(routes)} endpoints")
            return
        except Exception as e:
            logger.warning(f"[DataManager] PromptServer.routes registration failed: {e}")

    # 回退到 app.router 注册
    app = getattr(server, "app", None)
    if app and hasattr(app, "router"):
        for path, handler, method in routes:
            if method.upper() == "GET":
                app.router.add_get(path, handler)
            else:
                app.router.add_post(path, handler)
        logger.info(f"[DataManager] SSH routes registered (app.router): {len(routes)} endpoints")
