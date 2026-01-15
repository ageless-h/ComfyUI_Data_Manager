# -*- coding: utf-8 -*-
"""helpers/batch_namer.py - 批量文件命名模块

提供批量保存时的文件命名规则生成功能
"""

import os
import re
import logging
from pathlib import Path
from typing import Optional, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)


# 支持的占位符
PLACEHOLDERS = {
    "{index}": "当前索引（从1开始）",
    "{index:04d}": "零填充索引（如 0001）",
    "{timestamp}": "当前时间戳（Unix）",
    "{datetime}": "日期时间（YYYYMMDD_HHMMSS）",
    "{date}": "日期（YYYYMMDD）",
    "{time}": "时间（HHMMSS）",
    "{original_name}": "原文件名（不含扩展名）",
    "{original_ext}": "原文件扩展名",
    "{original_path}": "原文件所在目录",
    "{uuid}": "唯一标识符",
}


def generate_name(
    naming_rule: str,
    index: int = 0,
    original_path: Optional[str] = None,
    output_ext: Optional[str] = None,
    context: Optional[Dict[str, Any]] = None,
) -> str:
    """根据命名规则生成文件名

    Args:
        naming_rule: 命名规则，支持占位符
            - 基础格式：`result_{:04d}` -> `result_0001.png`
            - 保留原文件名：`{original_name}` -> `photo.png`
            - 保留目录结构：`{original_path}/{original_name}` -> `subdir/photo.png`
        index: 当前索引（从 0 或 1 开始，取决于规则）
        original_path: 原始文件路径（用于提取原文件名、扩展名、目录）
        output_ext: 输出文件的扩展名（如 "png", "jpg"）
        context: 额外上下文变量

    Returns:
        生成的文件名（包含扩展名）

    Examples:
        >>> generate_name("result_{:04d}", index=0, output_ext="png")
        'result_0000.png'

        >>> generate_name("result_{index:04d}", index=1, output_ext="png")
        'result_0001.png'

        >>> generate_name("{original_name}", original_path="/path/to/photo.jpg", output_ext="png")
        'photo.png'

        >>> generate_name("{original_path}/result_{index:04d}", index=1, original_path="/path/to/subdir/photo.jpg", output_ext="png")
        'subdir/result_0001.png'
    """
    context = context or {}

    # 解析原始文件信息
    original_info = _parse_original_path(original_path) if original_path else {}

    # 获取输出扩展名
    if output_ext is None and original_info:
        # 如果没有指定输出扩展名，使用原文件的扩展名
        output_ext = original_info.get("ext", "").lstrip(".")

    # 确保 output_ext 不包含点号
    if output_ext and output_ext.startswith("."):
        output_ext = output_ext.lstrip(".")

    # 处理目录部分（如果规则包含路径分隔符）
    if "/" in naming_rule or "\\" in naming_rule:
        dir_part, name_part = _split_path_and_name(naming_rule)
    else:
        dir_part = ""
        name_part = naming_rule

    # 生成文件名部分
    filename = _apply_name_format(
        name_part,
        index=index,
        original_info=original_info,
        context=context,
    )

    # 添加扩展名
    if output_ext and not filename.lower().endswith(f".{output_ext.lower()}"):
        filename = f"{filename}.{output_ext}"

    # 组合目录和文件名
    if dir_part:
        result = os.path.join(dir_part, filename)
    else:
        result = filename

    # 标准化路径
    result = result.replace("\\", "/")

    logger.debug(f"[DataManager] 生成文件名: rule='{naming_rule}', index={index}, result='{result}'")

    return result


def _parse_original_path(original_path: str) -> Dict[str, Any]:
    """解析原始文件路径

    Args:
        original_path: 原始文件路径

    Returns:
        包含原始文件信息的字典
    """
    path = Path(original_path)

    return {
        "name": path.stem,  # 文件名（不含扩展名）
        "ext": path.suffix,  # 扩展名（包含点号，如 ".png"）
        "ext_without_dot": path.suffix.lstrip("."),  # 扩展名（不含点号）
        "parent": path.parent.name if path.parent.name else "",  # 父目录名
        "parent_path": str(path.parent),  # 父目录完整路径
    }


def _split_path_and_name(naming_rule: str) -> tuple[str, str]:
    """分离命名规则中的路径和文件名部分

    Args:
        naming_rule: 命名规则

    Returns:
        (目录部分, 文件名部分) 元组
    """
    # 查找最后一个路径分隔符
    if "/" in naming_rule:
        sep = "/"
    elif "\\" in naming_rule:
        sep = "\\"
    else:
        return "", naming_rule

    parts = naming_rule.rsplit(sep, 1)

    if len(parts) == 2:
        return parts[0], parts[1]
    return "", naming_rule


def _apply_name_format(
    format_template: str,
    index: int = 0,
    original_info: Optional[Dict[str, Any]] = None,
    context: Optional[Dict[str, Any]] = None,
) -> str:
    """应用命名格式

    Args:
        format_template: 格式模板
        index: 当前索引
        original_info: 原始文件信息
        context: 额外上下文

    Returns:
        格式化后的字符串
    """
    original_info = original_info or {}
    context = context or {}

    # 合并上下文
    vars = {
        "index": index + 1,  # 索引从 1 开始
        "original_name": original_info.get("name", ""),
        "original_ext": original_info.get("ext_without_dot", ""),
        "original_path": original_info.get("parent", ""),
        **context,
    }

    # 添加时间戳
    now = datetime.now()
    vars.update({
        "timestamp": int(now.timestamp()),
        "datetime": now.strftime("%Y%m%d_%H%M%S"),
        "date": now.strftime("%Y%m%d"),
        "time": now.strftime("%H%M%S"),
    })

    # 添加 UUID
    import uuid
    vars["uuid"] = str(uuid.uuid4())[:8]  # 短 UUID

    # 处理 Python 格式字符串（如 {:04d}）
    try:
        # 检查是否包含 Python 格式占位符
        if re.search(r"\{[^}]*:[^}]*\}", format_template):
            # 提取格式规范
            match = re.search(r"\{([^}]*):([^}]*)\}", format_template)
            if match:
                var_name = match.group(1).strip() or "index"
                format_spec = match.group(2)

                # 获取变量值
                value = vars.get(var_name, index)

                # 应用格式
                formatted_value = f"{value:{format_spec}}"

                # 替换格式字符串
                format_template = re.sub(
                    r"\{[^}]*:[^}]*\}",
                    formatted_value,
                    format_template,
                    count=1
                )
    except Exception as e:
        logger.warning(f"[DataManager] 格式化失败: {e}")

    # 替换简单的占位符（如 {index}, {original_name}）
    try:
        result = format_template.format(**vars)
    except KeyError as e:
        logger.warning(f"[DataManager] 占位符未找到: {e}")
        result = format_template

    return result


def validate_naming_rule(naming_rule: str) -> tuple[bool, Optional[str]]:
    """验证命名规则是否有效

    Args:
        naming_rule: 命名规则

    Returns:
        (是否有效, 错误消息) 元组

    Examples:
        >>> validate_naming_rule("result_{:04d}")
        (True, None)

        >>> validate_naming_rule("")
        (False, "命名规则不能为空")

        >>> validate_naming_rule("../../../etc/passwd")
        (False, "命名规则包含不安全的路径遍历")
    """
    if not naming_rule:
        return False, "命名规则不能为空"

    # 检查不安全的路径遍历
    if "../" in naming_rule or "..\\" in naming_rule:
        return False, "命名规则包含不安全的路径遍历"

    # 检查是否包含非法字符（Windows）
    invalid_chars = ['<', '>', ':', '"', '|']
    for char in invalid_chars:
        if char in naming_rule:
            return False, f"命名规则包含非法字符: '{char}'"

    # 检查占位符语法
    try:
        # 尝试解析格式字符串
        _apply_name_format(naming_rule, index=0)
    except Exception as e:
        return False, f"命名规则语法错误: {e}"

    return True, None


def get_naming_rule_info(naming_rule: str) -> Dict[str, Any]:
    """获取命名规则的信息

    Args:
        naming_rule: 命名规则

    Returns:
        包含命名规则信息的字典
    """
    # 分析占位符
    placeholders = re.findall(r"\{([^}]+)\}", naming_rule)

    # 分析类型
    has_index = any("index" in p for p in placeholders)
    has_timestamp = any(p in ["timestamp", "datetime", "date", "time"] for p in placeholders)
    has_original = any(p.startswith("original_") for p in placeholders)
    has_path = "/" in naming_rule or "\\" in naming_rule

    # 生成示例
    examples = []
    if has_index:
        examples.append(generate_name(naming_rule, index=0, output_ext="png"))
        examples.append(generate_name(naming_rule, index=1, output_ext="png"))

    return {
        "rule": naming_rule,
        "placeholders": placeholders,
        "has_index": has_index,
        "has_timestamp": has_timestamp,
        "has_original": has_original,
        "preserves_structure": has_path,
        "examples": examples,
    }


def create_naming_rule_presets() -> Dict[str, str]:
    """创建常用的命名规则预设

    Returns:
        命名规则预设字典
    """
    return {
        "按索引命名": "result_{index:04d}",
        "带时间戳": "result_{datetime}",
        "保留原文件名": "{original_name}",
        "保留目录结构": "{original_path}/{original_name}",
        "索引+时间戳": "{index:04d}_{datetime}",
        "时间戳+索引": "{datetime}_{index:04d}",
        "UUID命名": "{uuid}",
    }
