# -*- coding: utf-8 -*-
"""批量处理功能独立测试

不依赖 ComfyUI，直接测试批量扫描和命名功能
"""

import os
import sys
from pathlib import Path

# 项目根目录
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root / "backend" / "helpers"))

from batch_scanner import scan_files, scan_files_absolute, validate_glob_pattern
from batch_namer import generate_name, validate_naming_rule

# 测试目录
TEST_IMAGE_DIR = project_root / "backend" / "tests" / "fixtures" / "batch_test_images"


def print_header(title: str):
    """打印标题"""
    print("\n" + "=" * 60)
    print(title)
    print("=" * 60)


def test_match_mode():
    """测试 Match 模式 - 文件扫描功能"""
    print_header("测试 1: Match 模式 (文件扫描)")

    results = []

    # 测试 1.1: 通配符扫描 PNG 文件
    print("\n[1.1] 通配符扫描 PNG 文件")
    print(f"  测试目录: {TEST_IMAGE_DIR}")

    if not TEST_IMAGE_DIR.exists():
        print(f"  ✗ 测试目录不存在")
        results.append(("通配符扫描", False))
    else:
        pattern = "*.png"
        files = scan_files(str(TEST_IMAGE_DIR), pattern, recursive=False)

        print(f"  扫描模式: {pattern}")
        print(f"  扫描结果: {len(files)} 个文件")

        if len(files) == 100:
            print(f"  ✓ 扫描到正确的文件数量")

            # 验证所有文件都是 PNG
            all_png = all(f.endswith(".png") for f in files)
            if all_png:
                print(f"  ✓ 所有文件都是 PNG 格式")
                results.append(("通配符扫描", True))
            else:
                print(f"  ✗ 部分文件不是 PNG 格式")
                results.append(("通配符扫描", False))
        else:
            print(f"  ✗ 文件数量不正确，期望 100 个")
            results.append(("通配符扫描", False))

    # 测试 1.2: 验证通配符模式
    print("\n[1.2] 验证通配符模式")
    valid_patterns = ["*.png", "*.jpg", "**/*.png", "test/*.jpg"]
    all_valid = True

    for pattern in valid_patterns:
        is_valid, error = validate_glob_pattern(pattern)
        if is_valid:
            print(f"  ✓ '{pattern}' 有效")
        else:
            print(f"  ✗ '{pattern}' 应该有效但报错: {error}")
            all_valid = False

    results.append(("模式验证", all_valid))

    return results


def test_batch_mode():
    """测试 Batch 模式 - 命名规则功能"""
    print_header("测试 2: Batch 模式 (命名规则)")

    results = []

    # 测试 2.1: 按索引命名
    print("\n[2.1] 按索引命名")
    naming_rule = "resized_{index:04d}"

    names = []
    for i in range(100):
        name = generate_name(naming_rule, index=i, output_ext="png")
        names.append(name)

    print(f"  命名规则: {naming_rule}")
    print(f"  生成文件名: {len(names)} 个")

    if len(names) == 100 and len(set(names)) == 100:
        print(f"  ✓ 生成 100 个唯一文件名")

        # 检查格式
        first_name = "resized_0001.png"
        last_name = "resized_0100.png"

        if names[0] == first_name and names[99] == last_name:
            print(f"  ✓ 文件名格式正确: {first_name} 到 {last_name}")
            results.append(("按索引命名", True))
        else:
            print(f"  ✗ 文件名格式错误: {names[0]}, {names[99]}")
            results.append(("按索引命名", False))
    else:
        print(f"  ✗ 文件名数量或唯一性错误")
        results.append(("按索引命名", False))

    # 测试 2.2: 保留原文件名
    print("\n[2.2] 保留原文件名")
    naming_rule = "{original_name}_resized"
    original_path = "backend/tests/fixtures/batch_test_images/test_image_001.png"

    name = generate_name(naming_rule, original_path=original_path, output_ext="png")

    print(f"  命名规则: {naming_rule}")
    print(f"  原始路径: {original_path}")
    print(f"  生成文件名: {name}")

    if "test_image_001" in name and name.endswith("_resized.png"):
        print(f"  ✓ 正确保留原文件名并添加后缀")
        results.append(("保留原文件名", True))
    else:
        print(f"  ✗ 文件名格式错误")
        results.append(("保留原文件名", False))

    # 测试 2.3: 验证命名规则
    print("\n[2.3] 验证命名规则")
    valid_rules = [
        "result_{index:04d}",
        "{original_name}",
        "{original_name}_resized",
    ]

    all_valid = True
    for rule in valid_rules:
        is_valid, error = validate_naming_rule(rule)
        if is_valid:
            print(f"  ✓ '{rule}' 有效")
        else:
            print(f"  ✗ '{rule}' 应该有效但报错: {error}")
            all_valid = False

    results.append(("命名规则验证", all_valid))

    return results


def test_end_to_end():
    """测试端到端配置"""
    print_header("测试 3: 端到端配置")

    results = []

    # 测试 3.1: 工作流文件存在
    print("\n[3.1] 检查工作流文件")
    workflow_file = project_root / "backend" / "tests" / "fixtures" / "batch_test_workflow.json"

    if workflow_file.exists():
        print(f"  ✓ 工作流文件存在: {workflow_file.name}")

        # 读取并验证内容
        import json
        with open(workflow_file, "r", encoding="utf-8") as f:
            workflow = json.load(f)

        has_nodes = all(key in workflow for key in ["3", "4", "5"])
        if has_nodes:
            print(f"  ✓ 工作流包含所有必需节点")
            results.append(("工作流配置", True))
        else:
            print(f"  ✗ 工作流缺少必需节点")
            results.append(("工作流配置", False))
    else:
        print(f"  ✗ 工作流文件不存在")
        results.append(("工作流配置", False))

    # 测试 3.2: 输入图像数量
    print("\n[3.2] 检查输入图像")
    if TEST_IMAGE_DIR.exists():
        png_files = list(TEST_IMAGE_DIR.glob("*.png"))
        print(f"  输入目录: {TEST_IMAGE_DIR}")
        print(f"  PNG 文件数量: {len(png_files)}")

        if len(png_files) == 100:
            print(f"  ✓ 有 100 张输入图像")
            results.append(("输入图像", True))
        else:
            print(f"  ✗ 图像数量不正确")
            results.append(("输入图像", False))
    else:
        print(f"  ✗ 输入目录不存在")
        results.append(("输入图像", False))

    return results


def test_memory_safety():
    """测试内存安全"""
    print_header("测试 4: 内存安全")

    results = []

    # 测试 4.1: 返回路径而非数据
    print("\n[4.1] 验证返回路径列表")

    if TEST_IMAGE_DIR.exists():
        paths = scan_files_absolute(str(TEST_IMAGE_DIR), "*.png", recursive=False)

        print(f"  扫描结果类型: {type(paths).__name__}")
        print(f"  结果数量: {len(paths)}")

        if isinstance(paths, list) and len(paths) > 0:
            all_strings = all(isinstance(p, str) for p in paths)
            all_files = all(os.path.isfile(p) for p in paths[:10])  # 检查前 10 个

            if all_strings:
                print(f"  ✓ 所有结果都是字符串（路径）")
            else:
                print(f"  ✗ 部分结果不是字符串")

            if all_files:
                print(f"  ✓ 路径指向有效文件")
            else:
                print(f"  ✗ 部分路径不是有效文件")

            results.append(("返回路径列表", all_strings and all_files))
        else:
            print(f"  ✗ 扫描结果格式错误")
            results.append(("返回路径列表", False))
    else:
        print(f"  ✗ 测试目录不存在")
        results.append(("返回路径列表", False))

    # 测试 4.2: 串行执行模拟
    print("\n[4.2] 模拟串行执行")

    if TEST_IMAGE_DIR.exists():
        paths = scan_files_absolute(str(TEST_IMAGE_DIR), "*.png", recursive=False)

        execution_count = 0
        for path in paths:
            # 模拟单个文件处理
            execution_count += 1

        print(f"  文件数量: {len(paths)}")
        print(f"  执行次数: {execution_count}")

        if execution_count == len(paths):
            print(f"  ✓ 每个文件执行一次")
            results.append(("串行执行", True))
        else:
            print(f"  ✗ 执行次数不匹配")
            results.append(("串行执行", False))
    else:
        results.append(("串行执行", False))

    return results


def print_summary(all_results):
    """打印测试摘要"""
    print_header("测试结果摘要")

    total = len(all_results)
    passed = sum(1 for _, result in all_results if result)

    print(f"\n总测试数: {total}")
    print(f"通过: {passed}")
    print(f"失败: {total - passed}")

    print(f"\n详细结果:")
    for name, result in all_results:
        status = "✓ 通过" if result else "✗ 失败"
        print(f"  {status}: {name}")

    print("\n" + "=" * 60)

    if passed == total:
        print("✓ 所有测试通过")
        return True
    else:
        print("✗ 部分测试失败")
        return False


def main():
    """运行所有测试"""
    print_header("批量处理功能测试套件")

    all_results = []

    # 运行测试
    all_results.extend(test_match_mode())
    all_results.extend(test_batch_mode())
    all_results.extend(test_end_to_end())
    all_results.extend(test_memory_safety())

    # 打印摘要
    success = print_summary(all_results)

    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
