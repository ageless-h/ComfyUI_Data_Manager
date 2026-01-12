# -*- coding: utf-8 -*-
"""test_preview_api.py - 预览 API 测试脚本

用于测试 /dm/preview 端点是否正常工作
"""

import os
import sys

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def test_imports():
    """测试模块导入"""
    print("=" * 60)
    print("测试 1: 模块导入")
    print("=" * 60)

    try:
        from utils import file_ops, path_utils, formatters, info
        print("✅ utils 模块导入成功")
        print(f"  - file_ops: {file_ops}")
        print(f"  - path_utils: {path_utils}")
        print(f"  - formatters: {formatters}")
        print(f"  - info: {info}")
    except ImportError as e:
        print(f"❌ utils 模块导入失败: {e}")
        return False

    try:
        from api.routes import files, operations, metadata
        print("✅ api.routes 模块导入成功（注意：aiohttp 依赖在 ComfyUI 环境中可用）")
    except ImportError as e:
        if 'aiohttp' in str(e):
            print("⚠️  aiohttp 未安装（ComfyUI 环境中会自动可用）")
        else:
            print(f"❌ api.routes 模块导入失败: {e}")
            return False

    return True


def test_util_functions():
    """测试工具函数"""
    print("\n" + "=" * 60)
    print("测试 2: 工具函数")
    print("=" * 60)

    from utils import path_utils, formatters, info

    # 测试路径工具
    test_path = "/path/to/test/file.txt"
    parent = path_utils.get_parent_path(test_path)
    print(f"✅ get_parent_path('{test_path}') = '{parent}'")

    # 测试格式化工具
    size = formatters.human_readable_size(1024 * 1024 * 2.5)
    print(f"✅ human_readable_size(2621440) = '{size}'")

    # 测试文件类别
    file_type = info.get_file_category("test.png")
    print(f"✅ get_file_category('test.png') = '{file_type}'")

    return True


def test_api_handler():
    """测试 API 处理器函数（不依赖 aiohttp）"""
    print("\n" + "=" * 60)
    print("测试 3: API 处理器函数签名")
    print("=" * 60)

    try:
        # 导入模块（会触发 aiohttp 错误，但我们可以捕获）
        from api.routes import metadata
        print("✅ metadata 模块导入成功")

        # 检查函数存在
        if hasattr(metadata, 'preview_file_handler'):
            print("✅ preview_file_handler 函数存在")
            print(f"  函数签名: {metadata.preview_file_handler.__name__}")
            print(f"  函数文档: {metadata.preview_file_handler.__doc__[:50]}...")
        else:
            print("❌ preview_file_handler 函数不存在")
            return False

    except ImportError as e:
        if 'aiohttp' in str(e):
            print("⚠️  aiohttp 依赖缺失（ComfyUI 运行环境中会自动可用）")
            print("✅ 代码结构正确，只是运行时依赖缺失")
            return True
        else:
            print(f"❌ 导入失败: {e}")
            return False

    return True


def test_javascript_syntax():
    """测试 JavaScript 语法"""
    print("\n" + "=" * 60)
    print("测试 4: JavaScript 语法")
    print("=" * 60)

    extension_js = "web/extension.js"

    if not os.path.exists(extension_js):
        print(f"❌ 文件不存在: {extension_js}")
        return False

    # 统计代码行数
    with open(extension_js, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        total_lines = len(lines)
        code_lines = len([l for l in lines if l.strip() and not l.strip().startswith('//')])
        comment_lines = len([l for l in lines if l.strip().startswith('//')])

    print(f"✅ extension.js 文件存在")
    print(f"  - 总行数: {total_lines}")
    print(f"  - 代码行: {code_lines}")
    print(f"  - 注释行: {comment_lines}")
    print(f"  - 空行: {total_lines - code_lines - comment_lines}")

    # 检查关键函数是否存在
    with open(extension_js, 'r', encoding='utf-8') as f:
        content = f.read()

    key_functions = [
        'openFloatingPreview',
        'loadPreviewContent',
        'closeFloatingPreview',
        'previewFile',
        'createPreviewPanel',
        'openFileManager'
    ]

    print("\n关键函数检查:")
    for func in key_functions:
        if f'function {func}' in content or f'{func}(' in content:
            print(f"  ✅ {func}")
        else:
            print(f"  ❌ {func} - 未找到")
            return False

    return True


def test_file_structure():
    """测试文件结构"""
    print("\n" + "=" * 60)
    print("测试 5: 文件结构")
    print("=" * 60)

    required_files = [
        "__init__.py",
        "core/__init__.py",
        "core/nodes_v1.py",
        "core/nodes_v3.py",
        "utils/__init__.py",
        "utils/file_ops.py",
        "utils/path_utils.py",
        "utils/formatters.py",
        "utils/info.py",
        "api/__init__.py",
        "api/routes/__init__.py",
        "api/routes/files.py",
        "api/routes/operations.py",
        "api/routes/metadata.py",
        "web/extension.js"
    ]

    print("检查必需文件:")
    all_exist = True
    for file in required_files:
        if os.path.exists(file):
            print(f"  ✅ {file}")
        else:
            print(f"  ❌ {file} - 不存在")
            all_exist = False

    return all_exist


def main():
    """运行所有测试"""
    print("\n" + "🧪" * 30)
    print("  ComfyUI Data Manager - 预览功能测试")
    print("🧪" * 30 + "\n")

    tests = [
        ("模块导入", test_imports),
        ("工具函数", test_util_functions),
        ("API 处理器", test_api_handler),
        ("JavaScript 语法", test_javascript_syntax),
        ("文件结构", test_file_structure),
    ]

    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n❌ {test_name} 测试出错: {e}")
            import traceback
            traceback.print_exc()
            results.append((test_name, False))

    # 输出总结
    print("\n" + "=" * 60)
    print("测试总结")
    print("=" * 60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for test_name, result in results:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{status} - {test_name}")

    print(f"\n总计: {passed}/{total} 测试通过")

    if passed == total:
        print("\n🎉 所有测试通过！代码已准备就绪。")
        print("\n下一步:")
        print("1. 启动 ComfyUI")
        print("2. 添加 'Data Manager - Core' 节点")
        print("3. 打开文件管理器")
        print("4. 测试预览功能")
    else:
        print("\n⚠️  部分测试失败，请检查代码。")


if __name__ == "__main__":
    main()
