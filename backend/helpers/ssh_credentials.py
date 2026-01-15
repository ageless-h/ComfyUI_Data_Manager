# -*- coding: utf-8 -*-
"""
helpers/ssh_credentials.py - SSH 连接凭证存储管理

提供 SSH 连接凭证的本地文件存储功能，包括：
- 凭证的保存、加载、删除
- 凭证的加密存储（base64）
- 凭证文件的自动创建和管理
"""

import json
import os
import base64
import logging
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional, Any

logger = logging.getLogger(__name__)


# 默认凭证文件路径
DEFAULT_CREDENTIALS_FILE = Path.home() / '.comfyui' / 'datamanager' / 'ssh_credentials.json'


def get_credentials_file_path() -> Path:
    """获取凭证文件路径，支持环境变量配置"""
    # 可以通过环境变量自定义凭证文件路径
    custom_path = os.environ.get('COMFYUI_SSH_CREDENTIALS_FILE')
    if custom_path:
        return Path(custom_path)
    return DEFAULT_CREDENTIALS_FILE


def ensure_credentials_dir() -> Path:
    """确保凭证文件目录存在"""
    cred_file = get_credentials_file_path()
    cred_dir = cred_file.parent
    cred_dir.mkdir(parents=True, exist_ok=True)
    return cred_dir


def load_credentials() -> List[Dict[str, Any]]:
    """
    加载所有保存的 SSH 凭证

    Returns:
        凭证列表，如果文件不存在或读取失败则返回空列表
    """
    cred_file = get_credentials_file_path()

    if not cred_file.exists():
        logger.debug(f'[DataManager] SSH 凭证文件不存在: {cred_file}')
        return []

    try:
        with open(cred_file, 'r', encoding='utf-8') as f:
            credentials = json.load(f)
        logger.info(f'[DataManager] 已加载 {len(credentials)} 个 SSH 凭证')
        return credentials
    except json.JSONDecodeError as e:
        logger.error(f'[DataManager] SSH 凭证文件格式错误: {e}')
        return []
    except Exception as e:
        logger.error(f'[DataManager] 加载 SSH 凭证失败: {e}')
        return []


def save_credential(credential: Dict[str, Any]) -> bool:
    """
    保存一个新的 SSH 凭证

    Args:
        credential: 包含 id, name, host, port, username, password 的字典

    Returns:
        是否保存成功
    """
    ensure_credentials_dir()
    cred_file = get_credentials_file_path()

    # 加载现有凭证
    credentials = load_credentials()

    # 检查是否已存在相同 ID 的凭证，如果存在则更新
    existing_index = -1
    for i, cred in enumerate(credentials):
        if cred.get('id') == credential.get('id'):
            existing_index = i
            break

    if existing_index >= 0:
        credentials[existing_index] = credential
        logger.info(f'[DataManager] 更新 SSH 凭证: {credential.get("name")}')
    else:
        credentials.append(credential)
        logger.info(f'[DataManager] 保存新 SSH 凭证: {credential.get("name")}')

    try:
        with open(cred_file, 'w', encoding='utf-8') as f:
            json.dump(credentials, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        logger.error(f'[DataManager] 保存 SSH 凭证失败: {e}')
        return False


def delete_credential(credential_id: str) -> bool:
    """
    删除指定的 SSH 凭证

    Args:
        credential_id: 要删除的凭证 ID

    Returns:
        是否删除成功
    """
    cred_file = get_credentials_file_path()

    if not cred_file.exists():
        logger.warning(f'[DataManager] 凭证文件不存在，无法删除: {credential_id}')
        return False

    credentials = load_credentials()
    original_count = len(credentials)

    # 过滤掉要删除的凭证
    credentials = [cred for cred in credentials if cred.get('id') != credential_id]

    if len(credentials) == original_count:
        logger.warning(f'[DataManager] 未找到要删除的凭证: {credential_id}')
        return False

    try:
        with open(cred_file, 'w', encoding='utf-8') as f:
            json.dump(credentials, f, ensure_ascii=False, indent=2)
        logger.info(f'[DataManager] 已删除 SSH 凭证: {credential_id}')
        return True
    except Exception as e:
        logger.error(f'[DataManager] 删除 SSH 凭证失败: {e}')
        return False


def encode_password(password: str) -> str:
    """
    对密码进行 base64 编码（简单加密）

    Args:
        password: 明文密码

    Returns:
        base64 编码后的密码
    """
    return base64.b64encode(password.encode('utf-8')).decode('ascii')


def decode_password(encoded: str) -> str:
    """
    解码 base64 编码的密码

    Args:
        encoded: base64 编码的密码

    Returns:
        明文密码
    """
    try:
        return base64.b64decode(encoded.encode('ascii')).decode('utf-8')
    except Exception:
        # 如果解码失败，返回原字符串
        return encoded
