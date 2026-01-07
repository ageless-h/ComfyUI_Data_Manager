# -*- coding: utf-8 -*-
"""api/routes/operations.py - 文件操作路由

提供文件操作（如保存）的 API 端点
"""

from aiohttp import web
import os
import logging

logger = logging.getLogger(__name__)

from ...utils import save_file


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
            return web.json_response({
                "error": "Source path is required"
            }, status=400)

        if not os.path.exists(source):
            return web.json_response({
                "error": "Source file not found",
                "path": source
            }, status=404)

        # 保存文件
        saved_path = save_file(source, target_dir, filename, prefix, add_timestamp)

        return web.json_response({
            "success": True,
            "path": saved_path,
            "filename": os.path.basename(saved_path)
        })

    except FileNotFoundError as e:
        return web.json_response({
            "error": "Source file not found"
        }, status=404)

    except Exception as e:
        logger.error(f"[DataManager] save_file error: {e}")
        return web.json_response({
            "error": str(e)
        }, status=500)


def register_operation_routes(server):
    """注册文件操作路由

    Args:
        server: ComfyUI PromptServer 实例
    """
    # 优先使用 PromptServer.routes 注册
    if hasattr(server, "routes") and server.routes is not None:
        try:
            server.routes.post("/dm/save")(save_file_handler)
            logger.info("[DataManager] Operation routes registered (PromptServer.routes)")
            return
        except Exception as e:
            logger.warning(f"[DataManager] PromptServer.routes registration failed: {e}")

    # 回退到 app.router 注册
    app = getattr(server, "app", None)
    if app and hasattr(app, 'router'):
        app.router.add_post("/dm/save", save_file_handler)
        logger.info("[DataManager] Operation routes registered (app.router fallback)")
