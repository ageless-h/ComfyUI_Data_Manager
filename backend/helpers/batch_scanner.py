# -*- coding: utf-8 -*-
"""helpers/batch_scanner.py - 批量文件扫描模块

提供基于 glob 模式的文件扫描功能，用于批量加载文件
"""

import os
import glob
import logging
from pathlib import Path
from typing import List, Optional, Tuple

logger = logging.getLogger(__name__)


def scan_files(
    base_dir: str,
    pattern: str,
    recursive: bool = False,
    case_sensitive: bool = False,
) -> List[str]:
    """使用 glob 模式扫描文件

    Args:
        base_dir: 基础目录路径
        pattern: glob 模式（如 "*.png", "**/*.jpg", "input/*.png"）
        recursive: 是否递归扫描子目录
        case_sensitive: 是否区分大小写（Windows 默认不区分）

    Returns:
        匹配的文件路径列表（相对于 base_dir 的路径）

    Raises:
        FileNotFoundError: 如果 base_dir 不存在
        ValueError: 如果 pattern 无效

    Examples:
        >>> scan_files("/path/to/dir", "*.png")
        ['image1.png', 'image2.png']

        >>> scan_files("/path/to/dir", "**/*.jpg", recursive=True)
        ['photo1.jpg', 'subdir/photo2.jpg']

        >>> scan_files("/path/to/dir", "input/*.png")
        ['input/image1.png']
    """
    # 验证基础目录
    if not os.path.exists(base_dir):
        raise FileNotFoundError(f"基础目录不存在: {base_dir}")

    if not os.path.isdir(base_dir):
        raise ValueError(f"路径不是目录: {base_dir}")

    # 标准化路径
    base_dir = os.path.normpath(base_dir)

    # 构建完整的 glob 模式
    full_pattern = os.path.join(base_dir, pattern)

    # 确定是否使用递归 glob
    use_recursive = recursive or "**" in pattern

    # 执行 glob 扫描
    try:
        if use_recursive:
            # 递归扫描：** 可以匹配任意层级子目录
            matches = glob.glob(full_pattern, recursive=True)
        else:
            # 非递归扫描：只匹配当前目录
            matches = glob.glob(full_pattern, recursive=False)

    except Exception as e:
        logger.error(f"[DataManager] glob 扫描失败: {e}")
        raise ValueError(f"无效的 glob 模式 '{pattern}': {e}")

    # 过滤出文件（排除目录）
    file_paths = []
    for match in matches:
        if os.path.isfile(match):
            # 返回相对于 base_dir 的路径
            try:
                rel_path = os.path.relpath(match, base_dir)
                file_paths.append(rel_path)
            except ValueError:
                # 在 Windows 上，不同驱动器之间无法计算相对路径
                # 直接返回绝对路径
                file_paths.append(match)

    # 按文件名排序（确保顺序一致）
    file_paths.sort(key=lambda x: x.lower())

    logger.info(f"[DataManager] 扫描完成: base_dir={base_dir}, pattern={pattern}, found={len(file_paths)} files")

    return file_paths


def scan_files_absolute(
    base_dir: str,
    pattern: str,
    recursive: bool = False,
) -> List[str]:
    """扫描文件并返回绝对路径

    与 scan_files 相同，但返回绝对路径而非相对路径

    Args:
        base_dir: 基础目录路径
        pattern: glob 模式
        recursive: 是否递归扫描

    Returns:
        匹配的文件绝对路径列表
    """
    # 获取相对路径列表
    rel_paths = scan_files(base_dir, pattern, recursive)

    # 转换为绝对路径
    abs_paths = [os.path.normpath(os.path.join(base_dir, p)) for p in rel_paths]

    return abs_paths


def parse_glob_pattern(pattern: str) -> Tuple[str, bool, str]:
    """解析 glob 模式

    Args:
        pattern: glob 模式（如 "*.png", "input/**/*.jpg", "subdir/*.png"）

    Returns:
        (目录部分, 是否递归, 文件名模式) 元组

    Examples:
        >>> parse_glob_pattern("*.png")
        ('', False, '*.png')

        >>> parse_glob_pattern("input/*.jpg")
        ('input', False, '*.jpg')

        >>> parse_glob_pattern("**/*.png")
        ('', True, '*.png')

        >>> parse_glob_pattern("subdir/**/*.jpg")
        ('subdir', True, '*.jpg')
    """
    original_pattern = pattern

    # 标准化路径分隔符
    pattern = pattern.replace("\\", "/")

    # 检查是否包含递归通配符
    is_recursive = "**" in pattern

    # 分离目录和文件名部分
    if "/" in pattern:
        dir_part, file_part = pattern.rsplit("/", 1)
    else:
        dir_part = ""
        file_part = pattern

    # 清理目录部分中的递归通配符
    if "**" in dir_part:
        # 保留目录结构，但标记为递归
        dir_part = dir_part.replace("**", ".").replace("/./", "/").strip("./")

    return dir_part, is_recursive, file_part


def validate_glob_pattern(pattern: str) -> Tuple[bool, Optional[str]]:
    """验证 glob 模式是否有效

    Args:
        pattern: glob 模式

    Returns:
        (是否有效, 错误消息) 元组

    Examples:
        >>> validate_glob_pattern("*.png")
        (True, None)

        >>> validate_glob_pattern("")
        (False, "模式不能为空")

        >>> validate_glob_pattern("../../../etc/passwd")
        (False, "模式包含不安全的路径遍历")
    """
    if not pattern:
        return False, "模式不能为空"

    # 检查不安全的路径遍历
    if "../" in pattern or "..\\" in pattern:
        return False, "模式包含不安全的路径遍历"

    # 检查是否包含非法字符（Windows）
    invalid_chars = ['<', '>', ':', '"', '|', '?', '*']
    # 注意：* 和 ? 是 glob 通配符，需要特殊处理
    for char in invalid_chars:
        if char in pattern and char not in ('*', '?'):
            # 只检查非通配符的非法字符
            if char == '?' and '?' in pattern:
                # ? 是有效的通配符
                continue
            return False, f"模式包含非法字符: '{char}'"

    # 基本语法检查
    try:
        # 尝试解析模式
        dir_part, is_recursive, file_part = parse_glob_pattern(pattern)

        # 检查文件名部分是否有效
        if not file_part or file_part in (".", ".."):
            return False, "文件名部分无效"

    except Exception as e:
        return False, f"模式解析失败: {e}"

    return True, None


def get_pattern_info(pattern: str) -> dict:
    """获取 glob 模式的信息

    Args:
        pattern: glob 模式

    Returns:
        包含模式信息的字典
    """
    dir_part, is_recursive, file_part = parse_glob_pattern(pattern)

    # 分析通配符类型
    has_wildcard = any(char in file_part for char in ['*', '?', '[', ']'])
    has_extension_wildcard = file_part.endswith(".*") or ".*." in file_part

    return {
        "pattern": pattern,
        "directory": dir_part or ".",
        "is_recursive": is_recursive,
        "file_pattern": file_part,
        "has_wildcard": has_wildcard,
        "has_extension_wildcard": has_extension_wildcard,
        "extension": file_part.split(".")[-1] if "." in file_part and not has_extension_wildcard else None,
    }
