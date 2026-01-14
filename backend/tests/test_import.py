# -*- coding: utf-8 -*-
"""测试后端模块导入"""

import sys

sys.path.insert(0, r"C:\Users\Administrator\Documents\ai\ComfyUI")

print("=" * 60)
print("测试 V1 API 导入")
print("=" * 60)

try:
    from custom_nodes.ComfyUI_Data_Manager import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS

    print("✓ V1 API 导入成功")
    print(f"  节点类: {list(NODE_CLASS_MAPPINGS.keys())}")
    print(f"  显示名称: {list(NODE_DISPLAY_NAME_MAPPINGS.keys())}")
except Exception as e:
    print(f"✗ V1 API 导入失败: {e}")

print("\n" + "=" * 60)
print("测试 V3 API 导入")
print("=" * 60)

try:
    import asyncio
    from custom_nodes.ComfyUI_Data_Manager.nodes_v3 import comfy_entrypoint

    async def test_v3():
        ext = await comfy_entrypoint()
        nodes = await ext.get_node_list()
        print("✓ V3 API 导入成功")
        print("  节点类:")
        for n in nodes:
            print(f"    - {n.__name__}")

    asyncio.run(test_v3())
except ImportError as e:
    print(f"⚠ V3 API 不可用（预期行为）: {e}")
except Exception as e:
    print(f"✗ V3 API 测试失败: {e}")

print("\n" + "=" * 60)
print("测试 shared 模块")
print("=" * 60)

try:
    from custom_nodes.ComfyUI_Data_Manager.shared import (
        list_files,
        get_file_info,
        save_file,
        get_file_category,
    )

    print("✓ shared 模块导入成功")
    print("  函数: list_files, get_file_info, save_file, get_file_category")
except Exception as e:
    print(f"✗ shared 模块导入失败: {e}")

print("\n" + "=" * 60)
print("测试 API 模块")
print("=" * 60)

try:
    from custom_nodes.ComfyUI_Data_Manager.api import list_files as api_list_files
    from custom_nodes.ComfyUI_Data_Manager.api import get_file_info as api_get_file_info
    from custom_nodes.ComfyUI_Data_Manager.api import save_file as api_save_file

    print("✓ API 模块导入成功")
    print("  端点: list_files, get_file_info, save_file")
except Exception as e:
    print(f"✗ API 模块导入失败: {e}")

print("\n" + "=" * 60)
print("后端导入测试完成")
print("=" * 60)
