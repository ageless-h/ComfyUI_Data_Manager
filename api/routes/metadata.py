# -*- coding: utf-8 -*-
"""api/routes/metadata.py - 元数据路由

提供文件类别、预览等元数据查询的 API 端点
"""

from aiohttp import web
import os
import logging
import io

try:
    from PIL import Image
    PILLOW_AVAILABLE = True
except ImportError:
    PILLOW_AVAILABLE = False

logger = logging.getLogger(__name__)


async def get_categories_handler(request):
    """获取支持的文件类别

    GET /dm/categories
    """
    try:
        categories = {
            "image": {
                "extensions": [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg", ".ico", ".tiff", ".tif", ".avif", ".heic", ".heif", ".tga"],
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
    """预览文件内容（支持图像、音视频、代码等）

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

        # 获取文件扩展名
        _, ext = os.path.splitext(path)
        ext = ext.lower()

        # 图像文件：返回二进制内容
        if ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico', '.tiff', '.tif', '.avif', '.heic', '.heif', '.tga']:
            # 检查是否需要转换为 PNG（浏览器不支持的格式）
            needs_conversion = ext in ['.tiff', '.tif', '.avif', '.heic', '.heif', '.tga']

            if needs_conversion and PILLOW_AVAILABLE:
                try:
                    # 使用 Pillow 转换为 PNG
                    with Image.open(path) as img:
                        # 处理多帧图像（如多页 TIFF）
                        if getattr(img, 'n_frames', 1) > 1:
                            # 使用第一帧
                            img.seek(0)

                        # 转换为 RGB（处理 RGBA、CMYK 等模式）
                        if img.mode in ('RGBA', 'LA', 'P'):
                            # 保持透明度
                            img = img.convert('RGBA')
                        elif img.mode not in ('RGB', 'L'):
                            img = img.convert('RGB')

                        # 保存为 PNG 到内存
                        output = io.BytesIO()
                        img.save(output, format='PNG')
                        content = output.getvalue()
                        content_type = 'image/png'

                        logger.info(f"[DataManager] Converted {ext} to PNG for preview")
                except Exception as e:
                    logger.warning(f"[DataManager] Failed to convert {ext} to PNG: {e}")
                    # 转换失败，回退到原始文件
                    with open(path, 'rb') as f:
                        content = f.read()

                    content_type_map = {
                        '.tiff': 'image/tiff',
                        '.tif': 'image/tiff',
                        '.avif': 'image/avif',
                        '.heic': 'image/heic',
                        '.heif': 'image/heif',
                        '.tga': 'image/x-targa',
                    }
                    content_type = content_type_map.get(ext, 'application/octet-stream')
            else:
                # 直接读取支持的格式
                with open(path, 'rb') as f:
                    content = f.read()

                # 根据扩展名设置 content type
                content_type_map = {
                    '.jpg': 'image/jpeg',
                    '.jpeg': 'image/jpeg',
                    '.png': 'image/png',
                    '.gif': 'image/gif',
                    '.bmp': 'image/bmp',
                    '.webp': 'image/webp',
                    '.svg': 'image/svg+xml',
                    '.ico': 'image/x-icon',
                    '.tiff': 'image/tiff',
                    '.tif': 'image/tiff',
                    '.avif': 'image/avif',
                    '.heic': 'image/heic',
                    '.heif': 'image/heif',
                    '.tga': 'image/x-targa',
                }
                content_type = content_type_map.get(ext, 'application/octet-stream')

            return web.Response(
                body=content,
                content_type=content_type
            )

        # 音频文件：返回二进制内容
        elif ext in ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a']:
            with open(path, 'rb') as f:
                content = f.read()

            content_type_map = {
                '.mp3': 'audio/mpeg',
                '.wav': 'audio/wav',
                '.flac': 'audio/flac',
                '.aac': 'audio/aac',
                '.ogg': 'audio/ogg',
                '.wma': 'audio/x-ms-wma',
                '.m4a': 'audio/mp4',
            }

            return web.Response(
                body=content,
                content_type=content_type_map.get(ext, 'audio/mpeg')
            )

        # 视频文件：返回二进制内容
        elif ext in ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv']:
            with open(path, 'rb') as f:
                content = f.read()

            content_type_map = {
                '.mp4': 'video/mp4',
                '.avi': 'video/x-msvideo',
                '.mov': 'video/quicktime',
                '.mkv': 'video/x-matroska',
                '.webm': 'video/webm',
                '.flv': 'video/x-flv',
            }

            return web.Response(
                body=content,
                content_type=content_type_map.get(ext, 'video/mp4')
            )

        # 文本文件：返回文本内容
        else:
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
