# -*- coding: utf-8 -*-
"""测试 utils 模块"""

import os
import sys
import tempfile
import shutil
from pathlib import Path

# 添加项目根目录到路径
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

# 使用完整的模块导入避免冲突
import custom_nodes.ComfyUI_Data_Manager.utils as dm_utils


# ============================================================================
# 测试 path_utils.py
# ============================================================================

def test_path_utils():
    """测试 path_utils 模块"""
    print("\n" + "="*60)
    print("测试 path_utils 模块")
    print("="*60)

    ensure_directory = dm_utils.ensure_directory
    join_paths = dm_utils.join_paths
    get_parent_path = dm_utils.get_parent_path

    # 测试 ensure_directory
    print("\n[测试 1] ensure_directory")
    test_dir = os.path.join(tempfile.gettempdir(), "test_data_manager", "ensure_test")
    if os.path.exists(test_dir):
        shutil.rmtree(test_dir)

    result = ensure_directory(test_dir)
    assert result == True, "应该成功创建目录"
    assert os.path.exists(test_dir), "目录应该存在"

    # 再次调用应该返回 True（目录已存在）
    result = ensure_directory(test_dir)
    assert result == True, "已存在的目录应该返回 True"

    print("  ✓ ensure_directory 测试通过")

    # 测试 join_paths
    print("\n[测试 2] join_paths")
    result = join_paths("C:", "Users", "Admin", "Documents")
    assert "Users" in result and "Admin" in result, f"路径应该包含所有组件: {result}"
    print(f"  结果: {result}")
    print("  ✓ join_paths 测试通过")

    # 测试 get_parent_path
    print("\n[测试 3] get_parent_path")
    parent = get_parent_path("C:/Users/Admin/Documents/file.txt")
    assert "Documents" in parent or parent == "C:/Users/Admin/Documents", f"父路径应该包含Documents: {parent}"
    print(f"  父路径: {parent}")

    parent = get_parent_path("file.txt")
    assert parent == ".", "没有父路径应该返回 '.'"
    print("  ✓ get_parent_path 测试通过")

    # 测试 ensure_directory - 嵌套目录
    print("\n[测试 4] ensure_directory (嵌套目录)")
    nested_dir = os.path.join(tempfile.gettempdir(), "test_data_manager", "nested1", "nested2")
    if os.path.exists(nested_dir):
        shutil.rmtree(os.path.join(tempfile.gettempdir(), "test_data_manager"))
    result = ensure_directory(nested_dir)
    assert result == True, "应该成功创建嵌套目录"
    assert os.path.exists(nested_dir), "嵌套目录应该存在"
    print(f"  创建嵌套目录: {nested_dir}")
    print("  ✓ ensure_directory (嵌套目录) 测试通过")

    # 清理
    if os.path.exists(os.path.join(tempfile.gettempdir(), "test_data_manager")):
        shutil.rmtree(os.path.join(tempfile.gettempdir(), "test_data_manager"))

    print("\n✓ path_utils 模块测试全部通过")
    return True


# ============================================================================
# 测试 file_ops.py
# ============================================================================

def test_file_ops():
    """测试 file_ops 模块"""
    print("\n" + "="*60)
    print("测试 file_ops 模块")
    print("="*60)

    save_file = dm_utils.save_file
    list_files = dm_utils.list_files
    create_file = dm_utils.create_file
    create_directory = dm_utils.create_directory
    delete_file = dm_utils.delete_file

    test_base_dir = os.path.join(tempfile.gettempdir(), "test_data_manager", "file_ops")
    if os.path.exists(test_base_dir):
        shutil.rmtree(test_base_dir)
    os.makedirs(test_base_dir)

    # 创建测试源文件
    source_file = os.path.join(test_base_dir, "source.txt")
    with open(source_file, 'w', encoding='utf-8') as f:
        f.write("测试内容")

    # 测试 save_file
    print("\n[测试 1] save_file")
    target_dir = os.path.join(test_base_dir, "target")
    saved_path = save_file(source_file, target_dir, "copied.txt")
    assert os.path.exists(saved_path), f"保存的文件应该存在: {saved_path}"
    print(f"  保存路径: {saved_path}")
    print("  ✓ save_file 测试通过")

    # 测试 save_file 带前缀和时间戳
    print("\n[测试 2] save_file 带前缀和时间戳")
    saved_path2 = save_file(source_file, target_dir, prefix="prefix_", add_timestamp=True)
    assert os.path.exists(saved_path2), "带时间戳的文件应该存在"
    assert "prefix_" in os.path.basename(saved_path2), "文件名应该包含前缀"
    print(f"  保存路径: {saved_path2}")
    print("  ✓ save_file (前缀/时间戳) 测试通过")

    # 测试 list_files
    print("\n[测试 3] list_files")
    files = list_files(test_base_dir, pattern="*.*", recursive=False, include_dirs=True)
    assert len(files) >= 2, f"应该列出文件和目录: {len(files)}"
    print(f"  找到 {len(files)} 个项目")
    print("  ✓ list_files 测试通过")

    # 测试 list_files 递归
    print("\n[测试 4] list_files 递归")
    files_recursive = list_files(test_base_dir, pattern="*.*", recursive=True, include_dirs=True)
    assert len(files_recursive) > len(files), "递归搜索应该找到更多项目"
    print(f"  递归找到 {len(files_recursive)} 个项目")
    print("  ✓ list_files (递归) 测试通过")

    # 测试 list_files 不存在的目录
    print("\n[测试 5] list_files 不存在的目录")
    empty_result = list_files("/nonexistent/path/12345")
    assert empty_result == [], "不存在的目录应该返回空列表"
    print("  ✓ list_files (不存在的目录) 测试通过")

    # 测试 create_file
    print("\n[测试 6] create_file")
    new_file = create_file(test_base_dir, "new_file.txt", "新文件内容")
    assert os.path.exists(new_file), "创建的文件应该存在"
    with open(new_file, 'r', encoding='utf-8') as f:
        content = f.read()
    assert content == "新文件内容", "文件内容应该正确"
    print(f"  创建文件: {new_file}")
    print("  ✓ create_file 测试通过")

    # 测试 create_directory
    print("\n[测试 7] create_directory")
    new_dir = create_directory(test_base_dir, "new_subdir")
    assert os.path.exists(new_dir), "创建的目录应该存在"
    print(f"  创建目录: {new_dir}")
    print("  ✓ create_directory 测试通过")

    # 测试 save_file - 源文件不存在
    print("\n[测试 8] save_file (源文件不存在)")
    try:
        save_file("/nonexistent/file.txt", test_base_dir)
        assert False, "应该抛出 FileNotFoundError"
    except FileNotFoundError:
        print("  ✓ save_file (源文件不存在) 测试通过")

    # 测试 save_file - 非字符串 source
    print("\n[测试 9] save_file (非字符串 source)")
    result = save_file(12345, test_base_dir)  # 非字符串应该返回空字符串
    assert result == "", f"非字符串 source 应该返回空字符串，实际为: {result}"
    print("  ✓ save_file (非字符串 source) 测试通过")

    # 测试 delete_file - 永久删除
    print("\n[测试 10] delete_file (永久删除)")
    file_to_delete = os.path.join(test_base_dir, "permanent_delete.txt")
    with open(file_to_delete, 'w', encoding='utf-8') as f:
        f.write("将被永久删除")
    result = delete_file(file_to_delete, use_trash=False)
    assert result == True, "delete_file 应该返回 True"
    assert not os.path.exists(file_to_delete), "文件应该被永久删除"
    print("  ✓ delete_file (永久删除) 测试通过")

    # 测试 delete_file - 删除目录
    print("\n[测试 11] delete_file (删除目录)")
    dir_to_delete = os.path.join(test_base_dir, "dir_to_delete")
    os.makedirs(dir_to_delete)
    result = delete_file(dir_to_delete, use_trash=False)
    assert result == True, "delete_file 应该返回 True"
    assert not os.path.exists(dir_to_delete), "目录应该被永久删除"
    print("  ✓ delete_file (删除目录) 测试通过")

    # 测试 create_directory - 已存在的目录（应该抛出异常）
    print("\n[测试 12] create_directory (目录已存在)")
    try:
        create_directory(test_base_dir, "new_subdir")  # 已存在
        assert False, "应该抛出 FileExistsError"
    except FileExistsError:
        print("  ✓ create_directory (目录已存在) 测试通过")

    # 测试 create_file - 文件已存在（应该抛出异常）
    print("\n[测试 13] create_file (文件已存在)")
    try:
        create_file(test_base_dir, "new_file.txt", "新内容")  # 已存在
        assert False, "应该抛出 FileExistsError"
    except FileExistsError:
        print("  ✓ create_file (文件已存在) 测试通过")

    # 清理
    shutil.rmtree(test_base_dir)

    print("\n✓ file_ops 模块测试全部通过")
    return True


# ============================================================================
# 测试 info.py
# ============================================================================

def test_info():
    """测试 info 模块"""
    print("\n" + "="*60)
    print("测试 info 模块")
    print("="*60)

    get_file_info = dm_utils.get_file_info
    get_file_category = dm_utils.get_file_category
    from custom_nodes.ComfyUI_Data_Manager.utils.info import _get_file_info, _matches_pattern

    test_dir = os.path.join(tempfile.gettempdir(), "test_data_manager", "info")
    if os.path.exists(test_dir):
        shutil.rmtree(test_dir)
    os.makedirs(test_dir)

    # 创建测试文件
    test_file = os.path.join(test_dir, "test.txt")
    with open(test_file, 'w', encoding='utf-8') as f:
        f.write("测试内容")

    # 创建测试目录
    test_subdir = os.path.join(test_dir, "subdir")
    os.makedirs(test_subdir)

    # 测试 _get_file_info
    print("\n[测试 1] _get_file_info")
    info = _get_file_info(test_file)
    assert info is not None, "文件信息应该不为空"
    assert "name" in info, "信息应该包含 name"
    assert "path" in info, "信息应该包含 path"
    assert "size" in info, "信息应该包含 size"
    print(f"  文件信息: {info['name']}, {info['size']} 字节")
    print("  ✓ _get_file_info 测试通过")

    # 测试 _matches_pattern
    print("\n[测试 2] _matches_pattern")
    assert _matches_pattern("test.txt", "*.txt") == True, "应该匹配 *.txt"
    assert _matches_pattern("image.png", "*.txt") == False, "不应该匹配 *.txt"
    assert _matches_pattern("test.png", "test.*") == True, "应该匹配 test.*"
    assert _matches_pattern("data.json", "data.*") == True, "应该匹配 data.*"
    print("  ✓ _matches_pattern 测试通过")

    # 测试 get_file_info
    print("\n[测试 3] get_file_info")
    info = get_file_info(test_file)
    assert info is not None, "get_file_info 应该返回信息"
    print(f"  文件信息: {info.get('name', 'N/A')}")
    print("  ✓ get_file_info 测试通过")

    # 测试 get_file_category
    print("\n[测试 4] get_file_category")
    category = get_file_category(test_file)
    assert category is not None, "应该返回分类"
    print(f"  文件分类: {category}")
    print("  ✓ get_file_category 测试通过")

    # 测试 get_file_category - 目录应该返回 unknown（因为没有扩展名）
    print("\n[测试 5] get_file_category (目录)")
    dir_category = get_file_category(test_subdir)
    # 目录没有扩展名，所以返回 unknown
    assert dir_category == "unknown", f"目录应该分类为 unknown（无扩展名），实际为 {dir_category}"
    print(f"  目录分类: {dir_category}")
    print("  ✓ get_file_category (目录) 测试通过")

    # 清理
    shutil.rmtree(test_dir)

    print("\n✓ info 模块测试全部通过")
    return True


# ============================================================================
# 测试 formatters.py
# ============================================================================

def test_formatters():
    """测试 formatters 模块"""
    print("\n" + "="*60)
    print("测试 formatters 模块")
    print("="*60)

    formatters = dm_utils.formatters

    # 测试 human_readable_size
    print("\n[测试 1] human_readable_size")
    result = formatters.human_readable_size(1024 * 1024 * 2.5)
    assert result is not None, "应该返回格式化的大小"
    assert isinstance(result, str), "应该返回字符串"
    assert "MB" in result or "2.5" in result, f"应该包含 MB 或 2.5: {result}"
    print(f"  格式化大小: {result}")
    print("  ✓ human_readable_size 测试通过")

    print("\n✓ formatters 模块测试全部通过")
    return True


# ============================================================================
# 主函数
# ============================================================================

def main():
    print("\n" + "="*60)
    print("Utils 模块测试")
    print("="*60)

    results = []

    results.append(("path_utils", test_path_utils()))
    results.append(("file_ops", test_file_ops()))
    results.append(("info", test_info()))
    results.append(("formatters", test_formatters()))

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
        print("✓ 所有 Utils 模块测试通过")
    else:
        print("✗ 部分测试失败")
    print("="*60)

    return all_passed


if __name__ == "__main__":
    import sys
    success = main()
    sys.exit(0 if success else 1)
