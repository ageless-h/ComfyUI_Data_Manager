# -*- coding: utf-8 -*-
"""api/routes/operations.py - 文件操作路由

提供文件操作（如保存）的 API 端点
"""

from aiohttp import web
import os
import logging

logger = logging.getLogger(__name__)

from ...helpers import save_file, create_file, create_directory, delete_file


async def save_file_handler(request):
    """保存文件到指定目录

    POST /dm/save
    Body: {
        "source": "./temp/image.png",
        "target_dir": "./output",
        "filename": "saved_image.png",
        "prefix": "",
        "add_timestamp": false
    }
    """
    try:
        data = await request.json()
        source = data.get("source", "")
        target_dir = data.get("target_dir", "./output")
        filename = data.get("filename", "")
        prefix = data.get("prefix", "")
        add_timestamp = data.get("add_timestamp", False)

        if not source:
            return web.json_response({"error": "Source path is required"}, status=400)

        if not os.path.exists(source):
            return web.json_response({"error": "Source file not found", "path": source}, status=404)

        # 保存文件
        saved_path = save_file(source, target_dir, filename, prefix, add_timestamp)

        return web.json_response(
            {"success": True, "path": saved_path, "filename": os.path.basename(saved_path)}
        )

    except FileNotFoundError as e:
        return web.json_response({"error": "Source file not found"}, status=404)

    except Exception as e:
        logger.error(f"[DataManager] save_file error: {e}")
        return web.json_response({"error": str(e)}, status=500)


async def create_file_handler(request):
    """创建新文件

    POST /dm/create/file
    Body: {
        "directory": "./output",
        "filename": "new_file.txt",
        "content": ""
    }
    """
    try:
        data = await request.json()
        directory = data.get("directory", ".")
        filename = data.get("filename", "")
        content = data.get("content", "")

        if not filename:
            return web.json_response({"error": "Filename is required"}, status=400)

        # 规范化路径
        if not os.path.isabs(directory):
            import folder_paths

            comfy_root = os.path.dirname(folder_paths.__file__)
            directory = os.path.abspath(os.path.join(comfy_root, directory))

        # 创建文件
        file_path = create_file(directory, filename, content)

        return web.json_response({"success": True, "path": file_path, "filename": filename})

    except FileExistsError as e:
        return web.json_response({"error": "File already exists", "message": str(e)}, status=409)

    except FileNotFoundError as e:
        return web.json_response({"error": "Directory not found", "message": str(e)}, status=404)

    except Exception as e:
        logger.error(f"[DataManager] create_file error: {e}")
        return web.json_response({"error": str(e)}, status=500)


async def create_directory_handler(request):
    """创建新文件夹

    POST /dm/create/directory
    Body: {
        "directory": "./output",
        "dirname": "new_folder"
    }
    """
    try:
        data = await request.json()
        directory = data.get("directory", ".")
        dirname = data.get("dirname", "")

        if not dirname:
            return web.json_response({"error": "Directory name is required"}, status=400)

        # 规范化路径
        if not os.path.isabs(directory):
            import folder_paths

            comfy_root = os.path.dirname(folder_paths.__file__)
            directory = os.path.abspath(os.path.join(comfy_root, directory))

        # 创建文件夹
        dir_path = create_directory(directory, dirname)

        return web.json_response({"success": True, "path": dir_path, "dirname": dirname})

    except FileExistsError as e:
        return web.json_response(
            {"error": "Directory already exists", "message": str(e)}, status=409
        )

    except FileNotFoundError as e:
        return web.json_response(
            {"error": "Parent directory not found", "message": str(e)}, status=404
        )

    except Exception as e:
        logger.error(f"[DataManager] create_directory error: {e}")
        return web.json_response({"error": str(e)}, status=500)


async def delete_file_handler(request):
    """删除文件或文件夹

    POST /dm/delete
    Body: {
        "path": "./output/image.png",
        "use_trash": true
    }
    """
    try:
        data = await request.json()
        path = data.get("path", "")
        use_trash = data.get("use_trash", True)

        if not path:
            return web.json_response({"error": "Path is required"}, status=400)

        # 规范化路径
        if not os.path.isabs(path):
            import folder_paths

            comfy_root = os.path.dirname(folder_paths.__file__)
            path = os.path.abspath(os.path.join(comfy_root, path))

        # 删除文件
        delete_file(path, use_trash)

        return web.json_response({"success": True, "path": path})

    except FileNotFoundError as e:
        return web.json_response({"error": "File not found", "message": str(e)}, status=404)

    except PermissionError as e:
        return web.json_response({"error": "Permission denied", "message": str(e)}, status=403)

    except Exception as e:
        logger.error(f"[DataManager] delete_file error: {e}")
        return web.json_response({"error": str(e)}, status=500)


def register_operation_routes(server):
    """注册文件操作路由

    Args:
        server: ComfyUI PromptServer 实例
    """
    # 优先使用 PromptServer.routes 注册
    if hasattr(server, "routes") and server.routes is not None:
        try:
            server.routes.post("/dm/save")(save_file_handler)
            server.routes.post("/dm/create/file")(create_file_handler)
            server.routes.post("/dm/create/directory")(create_directory_handler)
            server.routes.post("/dm/delete")(delete_file_handler)
            logger.info("[DataManager] Operation routes registered (PromptServer.routes)")
            return
        except Exception as e:
            logger.warning(f"[DataManager] PromptServer.routes registration failed: {e}")

    # 回退到 app.router 注册
    app = getattr(server, "app", None)
    if app and hasattr(app, "router"):
        app.router.add_post("/dm/save", save_file_handler)
        app.router.add_post("/dm/create/file", create_file_handler)
        app.router.add_post("/dm/create/directory", create_directory_handler)
        app.router.add_post("/dm/delete", delete_file_handler)
        logger.info("[DataManager] Operation routes registered (app.router fallback)")
