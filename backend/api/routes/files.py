# -*- coding: utf-8 -*-
"""api/routes/files.py - 文件列表和信息路由

提供文件列表和文件信息查询的 API 端点
"""

from aiohttp import web
import os
import logging

logger = logging.getLogger(__name__)

from ...helpers import list_files, get_file_info


async def list_files_handler(request):
    """列出目录中的文件

    POST /dm/list
    Body: {"path": "./output", "pattern": "*.*", "recursive": false}
    """
    try:
        data = await request.json()
        path = data.get("path", ".")
        pattern = data.get("pattern", "*.*")
        recursive = data.get("recursive", False)

        # 规范化路径
        if not os.path.isabs(path):
            # 相对路径，相对于 ComfyUI 根目录
            import folder_paths

            comfy_root = os.path.dirname(folder_paths.__file__)
            path = os.path.abspath(os.path.join(comfy_root, path))

        if not os.path.exists(path):
            return web.json_response({"error": "Directory not found", "path": path}, status=404)

        # 使用共享模块获取文件列表（包含目录）
        files = list_files(path, pattern, recursive, include_dirs=True)

        return web.json_response(
            {"success": True, "path": path, "files": files, "count": len(files)}
        )

    except Exception as e:
        logger.error(f"[DataManager] list_files error: {e}")
        return web.json_response({"error": str(e)}, status=500)


async def get_file_info_handler(request):
    """获取文件详细信息

    POST /dm/info
    Body: {"path": "./output/image.png"}
    """
    try:
        data = await request.json()
        path = data.get("path", "")

        if not path:
            return web.json_response({"error": "Path is required"}, status=400)

        info = get_file_info(path)

        return web.json_response({"success": True, "info": info})

    except Exception as e:
        logger.error(f"[DataManager] get_file_info error: {e}")
        return web.json_response({"error": str(e)}, status=500)


def register_file_routes(server):
    """注册文件相关路由

    Args:
        server: ComfyUI PromptServer 实例
    """
    # 优先使用 PromptServer.routes 注册
    if hasattr(server, "routes") and server.routes is not None:
        try:
            server.routes.post("/dm/list")(list_files_handler)
            server.routes.post("/dm/info")(get_file_info_handler)
            logger.info("[DataManager] File routes registered (PromptServer.routes)")
            return
        except Exception as e:
            logger.warning(f"[DataManager] PromptServer.routes registration failed: {e}")

    # 回退到 app.router 注册
    app = getattr(server, "app", None)
    if app and hasattr(app, "router"):
        app.router.add_post("/dm/list", list_files_handler)
        app.router.add_post("/dm/info", get_file_info_handler)
        logger.info("[DataManager] File routes registered (app.router fallback)")
