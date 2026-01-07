# -*- coding: utf-8 -*-
"""api/routes/metadata.py - 元数据路由

提供文件类别、预览等元数据查询的 API 端点
"""

from aiohttp import web
import os
import logging

logger = logging.getLogger(__name__)


async def get_categories_handler(request):
    """获取支持的文件类别

    GET /dm/categories
    """
    try:
        categories = {
            "image": {
                "extensions": [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg"],
                "icon": "pi-image",
                "color": "#e74c3c"
            },
            "video": {
                "extensions": [".mp4", ".avi", ".mov", ".mkv", ".webm", ".flv"],
                "icon": "pi-video",
                "color": "#9b59b6"
            },
            "audio": {
                "extensions": [".mp3", ".wav", ".flac", ".aac", ".ogg", ".wma", ".m4a"],
                "icon": "pi-volume-up",
                "color": "#3498db"
            },
            "document": {
                "extensions": [".pdf", ".doc", ".docx", ".txt", ".rtf", ".md"],
                "icon": "pi-file",
                "color": "#95a5a6"
            },
            "code": {
                "extensions": [".py", ".js", ".html", ".css", ".json", ".xml"],
                "icon": "pi-code",
                "color": "#1abc9c"
            }
        }

        return web.json_response({
            "success": True,
            "categories": categories
        })

    except Exception as e:
        logger.error(f"[DataManager] get_categories error: {e}")
        return web.json_response({
            "error": str(e)
        }, status=500)


async def preview_file_handler(request):
    """预览文件内容（用于代码文件等文本文件）

    GET /dm/preview?path=/path/to/file
    """
    try:
        path = request.query.get("path", "")

        if not path:
            return web.json_response({
                "error": "Path is required"
            }, status=400)

        if not os.path.exists(path):
            return web.json_response({
                "error": "File not found"
            }, status=404)

        # 读取文件内容（仅文本文件）
        try:
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()

            # 限制大小
            max_size = 100 * 1024  # 100KB
            if len(content) > max_size:
                content = content[:max_size] + "\n\n... (文件过大，已截断)"

            return web.Response(
                text=content,
                content_type='text/plain; charset=utf-8'
            )

        except UnicodeDecodeError:
            # 二进制文件
            return web.json_response({
                "error": "Binary file cannot be previewed"
            }, status=400)

    except Exception as e:
        logger.error(f"[DataManager] preview_file error: {e}")
        return web.json_response({
            "error": str(e)
        }, status=500)


def register_metadata_routes(server):
    """注册元数据路由

    Args:
        server: ComfyUI PromptServer 实例
    """
    # 优先使用 PromptServer.routes 注册
    if hasattr(server, "routes") and server.routes is not None:
        try:
            server.routes.get("/dm/categories")(get_categories_handler)
            server.routes.get("/dm/preview")(preview_file_handler)
            logger.info("[DataManager] Metadata routes registered (PromptServer.routes)")
            return
        except Exception as e:
            logger.warning(f"[DataManager] PromptServer.routes registration failed: {e}")

    # 回退到 app.router 注册
    app = getattr(server, "app", None)
    if app and hasattr(app, 'router'):
        app.router.add_get("/dm/categories", get_categories_handler)
        app.router.add_get("/dm/preview", preview_file_handler)
        logger.info("[DataManager] Metadata routes registered (app.router fallback)")
