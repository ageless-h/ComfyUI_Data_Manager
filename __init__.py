# -*- coding: utf-8 -*-
"""ComfyUI Data Manager - API 版本检测和路由入口

自动检测 ComfyUI 版本并选择合适的 API：
- V3 API (comfy_api.latest) - Node 2.0 / Vue.js 架构
- V1 API (NODE_CLASS_MAPPINGS) - Node 1.0 / 传统架构
"""

import logging

logger = logging.getLogger(__name__)

# 尝试导入 V3 API
try:
    from comfy_api.latest import ComfyExtension
    HAS_V3 = True
    logger.info("[DataManager] V3 API detected - Using Node 2.0 mode")
except ImportError:
    HAS_V3 = False
    logger.info("[DataManager] V3 API not available - Using Node 1.0 mode")

# 根据可用 API 导入相应模块
if HAS_V3:
    # 使用 V3 API (Node 2.0)
    from .core.nodes_v3 import comfy_entrypoint

    WEB_DIRECTORY = "./web"

    __all__ = ["comfy_entrypoint", "WEB_DIRECTORY"]

else:
    # 使用 V1 API (Node 1.0) - 向后兼容
    from .core.nodes_v1 import (
        NODE_CLASS_MAPPINGS,
        NODE_DISPLAY_NAME_MAPPINGS,
        WEB_DIRECTORY
    )

    __all__ = [
        "NODE_CLASS_MAPPINGS",
        "NODE_DISPLAY_NAME_MAPPINGS",
        "WEB_DIRECTORY"
    ]

# 注册 API 路由（同时支持 V1 和 V3）
try:
    from .api import register_api_routes
    register_api_routes()
except Exception as e:
    logger.warning(f"[DataManager] Failed to register API routes: {e}")
