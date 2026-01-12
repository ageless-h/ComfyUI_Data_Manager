# -*- coding: utf-8 -*-
"""测试 API 路由模块"""

import os
import sys
import tempfile
import shutil
from pathlib import Path
from unittest.mock import MagicMock, AsyncMock
from aiohttp import web
import json

# 添加项目根目录到路径
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

# 使用完整的模块导入避免冲突
import custom_nodes.ComfyUI_Data_Manager.utils as dm_utils


# ============================================================================
# 测试 files.py 路由
# ============================================================================

def test_files_routes():
    """测试 files.py 路由处理函数"""
    print("\n" + "="*60)
    print("测试 API files.py 路由")
    print("="*60)

    # 使用模块内的函数
    list_files = dm_utils.list_files
    get_file_info = dm_utils.get_file_info

    # 创建测试环境
    test_dir = os.path.join(tempfile.gettempdir(), "test_data_manager", "api_files")
    if os.path.exists(test_dir):
        shutil.rmtree(test_dir)
    os.makedirs(test_dir)

    # 创建测试文件
    test_file = os.path.join(test_dir, "test.txt")
    with open(test_file, 'w', encoding='utf-8') as f:
        f.write("测试内容")

    test_subdir = os.path.join(test_dir, "subdir")
    os.makedirs(test_subdir)

    # 测试 list_files
    print("\n[测试 1] list_files")
    files = list_files(test_dir, pattern="*.*", recursive=False, include_dirs=True)
    assert len(files) >= 1, f"应至少找到1个文件，实际找到{len(files)}"
    print(f"  找到 {len(files)} 个文件")
    print("  ✓ list_files 测试通过")

    # 测试 list_files 递归
    print("\n[测试 2] list_files 递归")
    files_recursive = list_files(test_dir, pattern="*.*", recursive=True, include_dirs=True)
    assert len(files_recursive) >= len(files), "递归搜索应该找到相同或更多项目"
    print(f"  递归找到 {len(files_recursive)} 个项目")
    print("  ✓ list_files (递归) 测试通过")

    # 测试 get_file_info
    print("\n[测试 3] get_file_info")
    info = get_file_info(test_file)
    assert info is not None, "get_file_info 应该返回信息"
    assert "name" in info, "信息应该包含 name"
    print(f"  文件信息: {info.get('name', 'N/A')}")
    print("  ✓ get_file_info 测试通过")

    # 测试不存在的路径
    print("\n[测试 4] list_files (不存在的路径)")
    empty_result = list_files("/nonexistent/path/12345", "*.*", False, True)
    assert empty_result == [], "不存在的目录应该返回空列表"
    print("  ✓ list_files (不存在的路径) 测试通过")

    # 清理
    shutil.rmtree(test_dir)

    print("\n✓ API files.py 路由测试全部通过")
    return True


# ============================================================================
# 测试 metadata.py 路由
# ============================================================================

def test_metadata_routes():
    """测试 metadata.py 路由处理函数"""
    print("\n" + "="*60)
    print("测试 API metadata.py 路由")
    print("="*60)

    from custom_nodes.ComfyUI_Data_Manager.api.routes.metadata import get_categories_handler, preview_file_handler

    # 创建测试环境
    test_dir = os.path.join(tempfile.gettempdir(), "test_data_manager", "api_metadata")
    if os.path.exists(test_dir):
        shutil.rmtree(test_dir)
    os.makedirs(test_dir)

    # 创建测试图像文件
    try:
        from PIL import Image
        test_image = os.path.join(test_dir, "test.png")
        img = Image.new('RGB', (100, 100), color='red')
        img.save(test_image)
        has_pillow = True
    except ImportError:
        has_pillow = False
        test_image = None

    # 创建测试文本文件
    test_txt = os.path.join(test_dir, "test.txt")
    with open(test_txt, 'w', encoding='utf-8') as f:
        f.write("测试文本内容")

    # 测试 get_categories_handler
    print("\n[测试 1] get_categories_handler")

    mock_request = MagicMock()

    async def run_test():
        response = await get_categories_handler(mock_request)

        # web.json_response 返回的 Response 可以通过 text 属性获取 JSON 字符串
        import json
        response_text = response.text if hasattr(response, 'text') and response.text else ''
        data = json.loads(response_text) if response_text else {}

        assert response.status == 200, f"状态码应为200，实际为{response.status}"
        assert data.get("success") == True, "success 应为 True"
        assert "categories" in data, "应包含 categories 字段"
        assert "image" in data["categories"], "应包含 image 类别"
        assert "video" in data["categories"], "应包含 video 类别"
        assert "audio" in data["categories"], "应包含 audio 类别"
        print(f"  类别数量: {len(data.get('categories', {}))}")
        print("  ✓ get_categories_handler 测试通过")

    import asyncio
    asyncio.run(run_test())

    # 测试 preview_file_handler - 文本文件
    print("\n[测试 2] preview_file_handler (文本文件)")

    mock_request = MagicMock()
    mock_request.query.get = MagicMock(return_value=test_txt)

    async def run_test2():
        response = await preview_file_handler(mock_request)
        text = response.text

        assert response.status == 200, f"状态码应为200，实际为{response.status}"
        assert "测试文本内容" in text, "应包含文件内容"
        print("  ✓ preview_file_handler (文本文件) 测试通过")

    asyncio.run(run_test2())

    # 测试 preview_file_handler - 图像文件
    if test_image and has_pillow:
        print("\n[测试 3] preview_file_handler (图像文件)")

        mock_request = MagicMock()
        mock_request.query.get = MagicMock(return_value=test_image)

        async def run_test3():
            response = await preview_file_handler(mock_request)

            assert response.status == 200, f"状态码应为200，实际为{response.status}"
            assert response.body is not None, "应返回图像内容"
            print(f"  图像大小: {len(response.body)} 字节")
            print("  ✓ preview_file_handler (图像文件) 测试通过")

        asyncio.run(run_test3())

    # 测试 preview_file_handler - 不存在的文件
    print("\n[测试 4] preview_file_handler (不存在的文件)")

    mock_request = MagicMock()
    mock_request.query.get = MagicMock(return_value="/nonexistent/file.txt")

    async def run_test4():
        response = await preview_file_handler(mock_request)

        # 错误响应是 json_response，可以通过 text 属性获取
        import json
        response_text = response.text if hasattr(response, 'text') and response.text else ''
        data = json.loads(response_text) if response_text else {}

        assert response.status == 404, f"状态码应为404，实际为{response.status}"
        assert "error" in data, "应包含 error 字段"
        print("  ✓ preview_file_handler (不存在的文件) 测试通过")

    asyncio.run(run_test4())

    # 测试 preview_file_handler - 缺少路径参数
    print("\n[测试 5] preview_file_handler (缺少路径参数)")

    mock_request = MagicMock()
    mock_request.query.get = MagicMock(return_value="")

    async def run_test5():
        response = await preview_file_handler(mock_request)

        # 错误响应是 json_response，可以通过 text 属性获取
        import json
        response_text = response.text if hasattr(response, 'text') and response.text else ''
        data = json.loads(response_text) if response_text else {}

        assert response.status == 400, f"状态码应为400，实际为{response.status}"
        assert "error" in data, "应包含 error 字段"
        print("  ✓ preview_file_handler (缺少路径参数) 测试通过")

    asyncio.run(run_test5())

    # 清理
    shutil.rmtree(test_dir)

    print("\n✓ API metadata.py 路由测试全部通过")
    return True


# ============================================================================
# 测试 operations.py 路由
# ============================================================================

def test_operations_routes():
    """测试 operations.py 路由处理函数"""
    print("\n" + "="*60)
    print("测试 API operations.py 路由")
    print("="*60)

    from custom_nodes.ComfyUI_Data_Manager.api.routes.operations import (
        save_file_handler, create_file_handler, create_directory_handler,
        delete_file_handler
    )

    # 创建测试环境
    test_dir = os.path.join(tempfile.gettempdir(), "test_data_manager", "api_operations")
    if os.path.exists(test_dir):
        shutil.rmtree(test_dir)
    os.makedirs(test_dir)

    # 创建测试文件
    test_file = os.path.join(test_dir, "test.txt")
    with open(test_file, 'w', encoding='utf-8') as f:
        f.write("原始内容")

    # 测试 save_file_handler
    print("\n[测试 1] save_file_handler")

    target_dir = os.path.join(test_dir, "target")
    os.makedirs(target_dir)

    mock_request = MagicMock()
    mock_request.json = AsyncMock(return_value={
        "source": test_file,
        "target_dir": target_dir,
        "filename": "saved.txt"
    })

    async def run_test():
        response = await save_file_handler(mock_request)

        # 成功的 save_file_handler 返回 web.json_response
        # 可以使用 text 属性获取 JSON 字符串然后解析
        import json
        response_text = response.text if hasattr(response, 'text') else ''
        data = json.loads(response_text) if response_text else {}

        assert response.status == 200, f"状态码应为200，实际为{response.status}"
        assert data.get("success") == True, "success 应为 True"
        assert "path" in data, "应包含 path 字段"
        print(f"  保存路径: {data.get('path', 'N/A')}")
        print("  ✓ save_file_handler 测试通过")

    import asyncio
    asyncio.run(run_test())

    # 测试 save_file_handler - 源文件不存在
    print("\n[测试 2] save_file_handler (源文件不存在)")

    mock_request = MagicMock()
    mock_request.json = AsyncMock(return_value={
        "source": "/nonexistent/file.txt",
        "target_dir": target_dir
    })

    async def run_test2():
        response = await save_file_handler(mock_request)

        # 错误的响应也是 json_response
        import json
        response_text = response.text if hasattr(response, 'text') else ''
        data = json.loads(response_text) if response_text else {}

        assert response.status == 404, f"状态码应为404，实际为{response.status}"
        assert "error" in data, "应包含 error 字段"
        print("  ✓ save_file_handler (源文件不存在) 测试通过")

    asyncio.run(run_test2())

    # 测试 create_file_handler
    print("\n[测试 3] create_file_handler")

    new_file = os.path.join(test_dir, "new_file.txt")

    mock_request = MagicMock()
    mock_request.json = AsyncMock(return_value={
        "directory": test_dir,
        "filename": "new_file.txt",
        "content": "新文件内容"
    })

    async def run_test3():
        response = await create_file_handler(mock_request)

        import json
        response_text = response.text if hasattr(response, 'text') else ''
        data = json.loads(response_text) if response_text else {}

        assert response.status == 200, f"状态码应为200，实际为{response.status}"
        assert data.get("success") == True, "success 应为 True"
        assert os.path.exists(new_file), "文件应该被创建"
        print(f"  创建路径: {data.get('path', new_file)}")
        print("  ✓ create_file_handler 测试通过")

    asyncio.run(run_test3())

    # 测试 create_directory_handler
    print("\n[测试 4] create_directory_handler")

    new_folder = os.path.join(test_dir, "new_folder")

    mock_request = MagicMock()
    mock_request.json = AsyncMock(return_value={
        "directory": test_dir,
        "dirname": "new_folder"
    })

    async def run_test4():
        response = await create_directory_handler(mock_request)

        import json
        response_text = response.text if hasattr(response, 'text') else ''
        data = json.loads(response_text) if response_text else {}

        assert response.status == 200, f"状态码应为200，实际为{response.status}"
        assert data.get("success") == True, "success 应为 True"
        assert os.path.exists(new_folder), "文件夹应该被创建"
        print(f"  创建路径: {data.get('path', new_folder)}")
        print("  ✓ create_directory_handler 测试通过")

    asyncio.run(run_test4())

    # 测试 delete_file_handler
    print("\n[测试 5] delete_file_handler")

    file_to_delete = os.path.join(test_dir, "to_delete.txt")
    with open(file_to_delete, 'w', encoding='utf-8') as f:
        f.write("将被删除")

    mock_request = MagicMock()
    mock_request.json = AsyncMock(return_value={
        "path": file_to_delete,
        "use_trash": False
    })

    async def run_test5():
        response = await delete_file_handler(mock_request)

        import json
        response_text = response.text if hasattr(response, 'text') else ''
        data = json.loads(response_text) if response_text else {}

        assert response.status == 200, f"状态码应为200，实际为{response.status}"
        assert data.get("success") == True, "success 应为 True"
        assert not os.path.exists(file_to_delete), "文件应该被删除"
        print("  ✓ delete_file_handler 测试通过")

    asyncio.run(run_test5())

    # 清理
    shutil.rmtree(test_dir)

    print("\n✓ API operations.py 路由测试全部通过")
    return True


# ============================================================================
# 主函数
# ============================================================================

def main():
    print("\n" + "="*60)
    print("API 路由模块测试")
    print("="*60)

    results = []

    results.append(("files_routes", test_files_routes()))
    results.append(("metadata_routes", test_metadata_routes()))
    results.append(("operations_routes", test_operations_routes()))

    print("\n" + "="*60)
    print("测试结果总结")
    print("="*60)

    all_passed = True
    for name, result in results:
        status = "✓ 通过" if result else "✗ 失败"
        if not result:
            all_passed = False
        print(f"  {name}: {status}")

    print("\n" + "="*60)
    if all_passed:
        print("✓ 所有 API 路由模块测试通过")
    else:
        print("✗ 部分测试失败")
    print("="*60)

    return all_passed


if __name__ == "__main__":
    import sys
    success = main()
    sys.exit(0 if success else 1)
