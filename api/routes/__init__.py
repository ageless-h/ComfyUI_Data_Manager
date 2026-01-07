# -*- coding: utf-8 -*-
"""api/routes - API 路由模块

统一注册所有 API 路由
"""

import logging

logger = logging.getLogger(__name__)

from .files import register_file_routes
from .operations import register_operation_routes
from .metadata import register_metadata_routes


def register_all_routes(server):
    """注册所有 API 路由

    Args:
        server: ComfyUI PromptServer 实例
    """
    try:
        register_file_routes(server)
        register_operation_routes(server)
        register_metadata_routes(server)
        logger.info("[DataManager] All API routes registered successfully")
    except Exception as e:
        logger.error(f"[DataManager] Failed to register routes: {e}")
