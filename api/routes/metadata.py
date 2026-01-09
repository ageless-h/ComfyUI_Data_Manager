# -*- coding: utf-8 -*-
"""api/routes/metadata.py - 元数据路由

提供文件类别、预览等元数据查询的 API 端点
"""

from aiohttp import web
import os
import logging
import io

from ...utils.info import FILE_CATEGORIES

try:
    from PIL import Image
    PILLOW_AVAILABLE = True
except ImportError:
    PILLOW_AVAILABLE = False

logger = logging.getLogger(__name__)


# ============================================================================
# MIME 类型映射表（扩展名 -> content-type）
# ============================================================================

MIME_TYPE_MAP = {
    # 图像格式
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
    '.psd': 'image/vnd.adobe.photoshop',
    # 音频格式
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.flac': 'audio/flac',
    '.aac': 'audio/aac',
    '.ogg': 'audio/ogg',
    '.wma': 'audio/x-ms-wma',
    '.m4a': 'audio/mp4',
    # 视频格式
    '.mp4': 'video/mp4',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime',
    '.mkv': 'video/x-matroska',
    '.webm': 'video/webm',
    '.flv': 'video/x-flv',
    # 文档格式
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.txt': 'text/plain',
}


def get_mime_type(ext: str, default: str = 'application/octet-stream') -> str:
    """获取文件扩展名对应的 MIME 类型

    Args:
        ext: 文件扩展名（如 ".jpg"）
        default: 未找到时的默认值

    Returns:
        MIME 类型字符串
    """
    return MIME_TYPE_MAP.get(ext.lower(), default)


async def get_categories_handler(request):
    """获取支持的文件类别

    GET /dm/categories
    """
    try:
        # 类别元信息（图标和颜色）
        category_meta = {
            "image": {"icon": "pi-image", "color": "#e74c3c"},
            "video": {"icon": "pi-video", "color": "#9b59b6"},
            "audio": {"icon": "pi-volume-up", "color": "#3498db"},
            "document": {"icon": "pi-file", "color": "#95a5a6"},
            "code": {"icon": "pi-code", "color": "#1abc9c"},
        }

        # 合并扩展名和元信息
        categories = {
            category: {
                "extensions": FILE_CATEGORIES[category],
                **meta
            }
            for category, meta in category_meta.items()
            if category in FILE_CATEGORIES
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
        if ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico', '.tiff', '.tif', '.avif', '.heic', '.heif', '.tga', '.psd']:
            # 检查是否需要转换为 PNG（浏览器不支持的格式）
            needs_conversion = ext in ['.tiff', '.tif', '.avif', '.heic', '.heif', '.tga', '.psd']

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
                    content_type = get_mime_type(ext)
            else:
                # 直接读取支持的格式
                with open(path, 'rb') as f:
                    content = f.read()
                content_type = get_mime_type(ext)

            return web.Response(
                body=content,
                content_type=content_type
            )

        # 音频文件：返回二进制内容
        elif ext in ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a']:
            with open(path, 'rb') as f:
                content = f.read()

            return web.Response(
                body=content,
                content_type=get_mime_type(ext, 'audio/mpeg')
            )

        # 视频文件：返回二进制内容
        elif ext in ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv']:
            with open(path, 'rb') as f:
                content = f.read()

            return web.Response(
                body=content,
                content_type=get_mime_type(ext, 'video/mp4')
            )

        # PDF 文件：返回二进制内容（浏览器原生支持）
        elif ext == '.pdf':
            with open(path, 'rb') as f:
                content = f.read()

            return web.Response(
                body=content,
                content_type='application/pdf'
            )

        # Markdown 文件：返回渲染后的 HTML
        elif ext == '.md':
            try:
                import markdown as md_lib
                with open(path, 'r', encoding='utf-8') as f:
                    text = f.read()

                # 限制大小
                max_size = 200 * 1024  # 200KB
                if len(text) > max_size:
                    text = text[:max_size] + "\n\n... (文件过大，已截断)"

                # 渲染为 HTML
                html_content = md_lib.markdown(text, extensions=['tables', 'fenced_code', 'codehilite'])

                return web.Response(
                    text=f'''<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; line-height: 1.6; color: #d4d4d4; background: #1e1e1e; }}
        h1, h2, h3 {{ color: #569cd6; }}
        code {{ background: #2d2d2d; padding: 2px 6px; border-radius: 4px; }}
        pre {{ background: #2d2d2d; padding: 15px; border-radius: 8px; overflow-x: auto; }}
        blockquote {{ border-left: 4px solid #569cd6; margin: 0; padding-left: 15px; color: #888; }}
        table {{ border-collapse: collapse; width: 100%; }}
        th, td {{ border: 1px solid #3a3a3a; padding: 8px; text-align: left; }}
        th {{ background: #2d2d2d; }}
    </style>
</head>
<body>
{html_content}
</body>
</html>''',
                    content_type='text/html'
                )
            except Exception as e:
                logger.warning(f"[DataManager] Failed to render markdown: {e}")
                return web.json_response({
                    "error": f"Failed to render markdown: {str(e)}"
                }, status=500)

        # 文本文件：返回文本内容
        elif ext in ['.txt', '.rtf']:
            try:
                with open(path, 'r', encoding='utf-8', errors='replace') as f:
                    content = f.read()

                # 限制大小
                max_size = 100 * 1024  # 100KB
                if len(content) > max_size:
                    content = content[:max_size] + "\n\n... (文件过大，已截断)"

                return web.Response(
                    text=content,
                    content_type='text/plain'
                )
            except Exception as e:
                return web.json_response({
                    "error": f"Cannot read file: {str(e)}"
                }, status=400)

        # 代码文件：返回文本内容
        elif ext in ['.json', '.py', '.js', '.html', '.css', '.xml', '.yaml', '.yml', '.cpp', '.c', '.h']:
            try:
                with open(path, 'r', encoding='utf-8', errors='replace') as f:
                    content = f.read()

                # 限制大小（代码文件可以稍大）
                max_size = 500 * 1024  # 500KB
                if len(content) > max_size:
                    content = content[:max_size] + "\n\n... (文件过大，已截断)"

                return web.Response(
                    text=content,
                    content_type='text/plain'
                )
            except Exception as e:
                return web.json_response({
                    "error": f"Cannot read file: {str(e)}"
                }, status=400)

        # CSV 文件：返回文本内容
        elif ext == '.csv':
            try:
                with open(path, 'r', encoding='utf-8', errors='replace') as f:
                    content = f.read()

                # 限制大小
                max_size = 500 * 1024  # 500KB
                if len(content) > max_size:
                    content = content[:max_size] + "\n\n... (文件过大，已截断)"

                return web.Response(
                    text=content,
                    content_type='text/plain'
                )
            except Exception as e:
                return web.json_response({
                    "error": f"Cannot read CSV file: {str(e)}"
                }, status=400)

        # Excel 文件：返回二进制内容供前端 SheetJS 处理
        elif ext in ['.xls', '.xlsx', '.ods']:
            with open(path, 'rb') as f:
                content = f.read()

            content_type_map = {
                '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                '.xls': 'application/vnd.ms-excel',
                '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
            }

            return web.Response(
                body=content,
                content_type=content_type_map.get(ext, 'application/octet-stream')
            )

        # Word 文档：返回二进制内容供前端 mammoth.js 处理
        elif ext in ['.doc', '.docx']:
            with open(path, 'rb') as f:
                content = f.read()

            # .docx 是 Office Open XML 格式，.doc 是旧版二进制格式
            content_type_map = {
                '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                '.doc': 'application/msword',
            }

            return web.Response(
                body=content,
                content_type=content_type_map.get(ext, 'application/octet-stream')
            )

        # 其他文件
        else:
            return web.json_response({
                "error": f"File type {ext} not supported for preview"
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
