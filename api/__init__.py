# -*- coding: utf-8 -*-
"""api/__init__.py - 后端 API 端点

提供文件管理相关的 HTTP API 端点，供前端扩展调用
"""

from aiohttp import web
import os
import json
import logging

logger = logging.getLogger(__name__)

from ..shared import list_files as shared_list_files, get_file_info as shared_get_file_info, save_file as shared_save_file, get_file_category


async def list_files(request):
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
            return web.json_response({
                "error": "Directory not found",
                "path": path
            }, status=404)

        # 使用共享模块获取文件列表（包含目录）
        files = shared_list_files(path, pattern, recursive, include_dirs=True)

        return web.json_response({
            "success": True,
            "path": path,
            "files": files,
            "count": len(files)
        })

    except Exception as e:
        logger.error(f"[DataManager] list_files error: {e}")
        return web.json_response({
            "error": str(e)
        }, status=500)


async def get_file_info(request):
    """获取文件详细信息

    POST /dm/info
    Body: {"path": "./output/image.png"}
    """
    try:
        data = await request.json()
        path = data.get("path", "")

        if not path:
            return web.json_response({
                "error": "Path is required"
            }, status=400)

        info = shared_get_file_info(path)

        return web.json_response({
            "success": True,
            "info": info
        })

    except Exception as e:
        logger.error(f"[DataManager] get_file_info error: {e}")
        return web.json_response({
            "error": str(e)
        }, status=500)


async def save_file(request):
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
        saved_path = shared_save_file(source, target_dir, filename, prefix, add_timestamp)

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


async def get_categories(request):
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


async def preview_file(request):
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


# API 路由注册标志
_ROUTES_REGISTERED = False


def register_api_routes():
    """注册 API 路由到 ComfyUI 服务器"""
    global _ROUTES_REGISTERED
    if _ROUTES_REGISTERED:
        return True

    try:
        from server import PromptServer

        if hasattr(PromptServer, 'instance') and PromptServer.instance:
            ps = PromptServer.instance

            # 优先使用 PromptServer.routes 注册
            if hasattr(ps, "routes") and ps.routes is not None:
                try:
                    ps.routes.post("/dm/list")(list_files)
                    ps.routes.post("/dm/info")(get_file_info)
                    ps.routes.post("/dm/save")(save_file)
                    ps.routes.get("/dm/categories")(get_categories)
                    ps.routes.get("/dm/preview")(preview_file)
                    _ROUTES_REGISTERED = True
                    logger.info("[DataManager] API routes registered (PromptServer.routes)")
                    return True
                except Exception as e:
                    logger.warning(f"[DataManager] PromptServer.routes registration failed: {e}")

            # 回退到 app.router 注册
            app = getattr(ps, "app", None)
            if app and hasattr(app, 'router'):
                app.router.add_post("/dm/list", list_files)
                app.router.add_post("/dm/info", get_file_info)
                app.router.add_post("/dm/save", save_file)
                app.router.add_get("/dm/categories", get_categories)
                app.router.add_get("/dm/preview", preview_file)
                _ROUTES_REGISTERED = True
                logger.info("[DataManager] API routes registered (app.router fallback)")
                return True

    except ImportError:
        logger.warning("[DataManager] Cannot import PromptServer, skipping API route registration")
    except Exception as e:
        logger.error(f"[DataManager] API route registration failed: {e}")

    return False


# 在模块加载时尝试注册
try:
    register_api_routes()
except Exception:
    pass
