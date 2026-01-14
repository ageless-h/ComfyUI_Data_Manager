# -*- coding: utf-8 -*-
"""api - HTTP API 模块

提供 RESTful API 端点供前端调用
"""

import logging

logger = logging.getLogger(__name__)

# API 路由注册标志
_ROUTES_REGISTERED = False


def register_api_routes():
    """注册所有 API 路由到 ComfyUI 服务器"""
    global _ROUTES_REGISTERED
    if _ROUTES_REGISTERED:
        return True

    try:
        from server import PromptServer

        if hasattr(PromptServer, "instance") and PromptServer.instance:
            from .routes import register_all_routes

            register_all_routes(PromptServer.instance)
            _ROUTES_REGISTERED = True
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
