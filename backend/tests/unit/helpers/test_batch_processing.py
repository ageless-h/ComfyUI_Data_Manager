# -*- coding: utf-8 -*-
"""批量处理功能测试

测试 OutputPathConfig Match 模式和 InputPathConfig Batch 模式
"""

import os
import sys
import json
import pytest
from pathlib import Path

# 添加项目根目录到路径
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from backend.helpers.batch_scanner import scan_files, scan_files_absolute, validate_glob_pattern
from backend.helpers.batch_namer import generate_name, validate_naming_rule


# ============================================================================
# 测试配置
# ============================================================================

TEST_IMAGE_DIR = project_root / "backend" / "tests" / "fixtures" / "batch_test_images"
TEST_OUTPUT_DIR = project_root / "backend" / "tests" / "fixtures" / "batch_test_output"


# ============================================================================
# Match 模式测试
# ============================================================================

class TestMatchMode:
    """测试 OutputPathConfig Match 模式的文件扫描功能"""

    def test_wildcard_scan_png_files(self):
        """测试通配符扫描 PNG 文件"""
        # GIVEN: 测试目录包含 100 张 PNG 图像
        assert TEST_IMAGE_DIR.exists(), "测试图像目录不存在"

        # WHEN: 使用 pattern *.png 扫描目录
        pattern = "*.png"
        result = scan_files(str(TEST_IMAGE_DIR), pattern, recursive=False)

        # THEN: 必须返回 100 个文件路径
        assert len(result) == 100, f"期望扫描到 100 个文件，实际得到 {len(result)} 个"

        # AND: 所有路径必须以 .png 结尾
        for filepath in result:
            assert filepath.endswith(".png"), f"文件 {filepath} 不是 PNG 格式"

        # AND: 路径必须按文件名排序
        sorted_result = sorted(result, key=lambda x: x.lower())
        assert result == sorted_result, "文件路径未按文件名排序"

    def test_recursive_scan(self):
        """测试递归扫描"""
        # 创建包含子目录的测试结构
        import tempfile
        import shutil

        with tempfile.TemporaryDirectory() as tmpdir:
            # 创建子目录和文件
            subdir = Path(tmpdir) / "subdir"
            subdir.mkdir()
            (Path(tmpdir) / "root.png").touch()
            (subdir / "sub.png").touch()

            # WHEN: 使用 **/*.png 扫描
            pattern = "**/*.png"
            result = scan_files(tmpdir, pattern, recursive=True)

            # THEN: 必须返回所有子目录中的 PNG 文件
            assert len(result) == 2, f"递归扫描应该找到 2 个文件，实际找到 {len(result)} 个"

            # AND: 返回的路径必须保持相对目录结构
            assert any("subdir" in p for p in result), "应该包含子目录中的文件"

    def test_validate_glob_pattern(self):
        """测试通配符模式验证"""
        # 有效模式
        valid_patterns = ["*.png", "*.jpg", "**/*.png", "test/*.jpg", "input/**/*.*"]
        for pattern in valid_patterns:
            is_valid, error = validate_glob_pattern(pattern)
            assert is_valid, f"模式 '{pattern}' 应该有效，但报错: {error}"

        # 无效模式
        invalid_patterns = ["", "../../../etc/passwd", "file|.png"]
        for pattern in invalid_patterns:
            is_valid, error = validate_glob_pattern(pattern)
            assert not is_valid, f"模式 '{pattern}' 应该无效"


# ============================================================================
# Batch 模式测试
# ============================================================================

class TestBatchMode:
    """测试 InputPathConfig Batch 模式的批量保存功能"""

    def test_naming_rule_index_format(self):
        """测试按索引命名"""
        # GIVEN: Batch 模式启用，naming_rule 为 resized_{index:04d}
        naming_rule = "resized_{index:04d}"

        # WHEN: 生成文件名
        names = []
        for i in range(100):
            name = generate_name(naming_rule, index=i, output_ext="png")
            names.append(name)

        # THEN: 必须生成 100 个不同的文件名
        assert len(names) == 100, "必须生成 100 个文件名"
        assert len(set(names)) == 100, "所有文件名必须唯一"

        # AND: 文件名必须为 resized_0001.png 到 resized_0100.png
        assert names[0] == "resized_0001.png", f"第一个文件名应为 resized_0001.png，实际为 {names[0]}"
        assert names[99] == "resized_0100.png", f"最后一个文件名应为 resized_0100.png，实际为 {names[99]}"

    def test_naming_rule_preserve_original(self):
        """测试保留原文件名"""
        # GIVEN: Batch 模式启用，naming_rule 为 {original_name}_resized
        naming_rule = "{original_name}_resized"

        # WHEN: 使用原始路径生成文件名
        original_path = "backend/tests/fixtures/batch_test_images/test_image_001.png"
        name = generate_name(naming_rule, original_path=original_path, output_ext="png")

        # THEN: 输出文件名必须保留原文件名
        assert "test_image_001" in name, f"文件名应包含原文件名，实际为 {name}"

        # AND: 必须添加 _resized 后缀
        assert name.endswith("_resized.png"), f"文件名应以 _resized.png 结尾，实际为 {name}"

    def test_validate_naming_rule(self):
        """测试命名规则验证"""
        # 有效规则
        valid_rules = [
            "result_{index:04d}",
            "{original_name}",
            "{original_name}_resized",
            "{original_path}/{original_name}",
            "output_{datetime}",
        ]
        for rule in valid_rules:
            is_valid, error = validate_naming_rule(rule)
            assert is_valid, f"规则 '{rule}' 应该有效，但报错: {error}"

        # 无效规则
        invalid_rules = ["", "../../../etc/passwd", "file|.png", "test<>name"]
        for rule in invalid_rules:
            is_valid, error = validate_naming_rule(rule)
            assert not is_valid, f"规则 '{rule}' 应该无效"


# ============================================================================
# 端到端测试
# ============================================================================

class TestEndToEndWorkflow:
    """测试完整的批量处理工作流"""

    def test_workflow_file_exists(self):
        """测试工作流文件存在"""
        workflow_file = project_root / "backend" / "tests" / "fixtures" / "batch_test_workflow.json"

        # GIVEN: 工作流文件应该存在
        assert workflow_file.exists(), f"工作流文件不存在: {workflow_file}"

        # WHEN: 读取工作流文件
        with open(workflow_file, "r", encoding="utf-8") as f:
            workflow = json.load(f)

        # THEN: 必须包含完整的节点配置
        assert "3" in workflow, "工作流缺少 OutputPathConfig 节点"
        assert "4" in workflow, "工作流缺少 ImageResize 节点"
        assert "5" in workflow, "工作流缺少 InputPathConfig 节点"

        # AND: 必须配置 Match 模式参数
        node_3 = workflow["3"]
        assert node_3["class_type"] == "OutputPathConfig"
        assert node_3["inputs"]["enable_match"] == True
        assert node_3["inputs"]["pattern"] == "*.png"

        # AND: 必须配置 Batch 模式参数
        node_5 = workflow["5"]
        assert node_5["class_type"] == "InputPathConfig"
        assert node_5["inputs"]["enable_batch"] == True
        assert node_5["inputs"]["naming_rule"] == "resized_{index:04d}"

    def test_input_images_count(self):
        """测试输入图像数量"""
        # GIVEN: 测试图像目录应该存在
        assert TEST_IMAGE_DIR.exists(), "测试图像目录不存在"

        # WHEN: 统计 PNG 文件数量
        png_files = list(TEST_IMAGE_DIR.glob("*.png"))

        # THEN: 必须有 100 张输入图像
        assert len(png_files) == 100, f"期望 100 张输入图像，实际有 {len(png_files)} 张"


# ============================================================================
# 内存安全测试
# ============================================================================

class TestMemorySafety:
    """测试批量处理的内存安全"""

    def test_return_paths_not_data(self):
        """测试 Match 模式返回路径列表而非数据列表"""
        # GIVEN: 测试目录包含 100 张图像
        assert TEST_IMAGE_DIR.exists()

        # WHEN: 使用 Match 模式扫描
        paths = scan_files_absolute(str(TEST_IMAGE_DIR), "*.png", recursive=False)

        # THEN: 必须返回文件路径字符串列表
        assert isinstance(paths, list), "扫描结果必须是列表"
        assert len(paths) > 0, "扫描结果不应为空"
        assert all(isinstance(p, str) for p in paths), "所有元素必须是字符串"

        # AND: 路径必须指向存在的文件
        for p in paths:
            assert os.path.isfile(p), f"路径 {p} 不是有效文件"

    def test_serial_execution_simulation(self):
        """模拟串行执行验证"""
        # GIVEN: 100 个文件路径
        paths = scan_files_absolute(str(TEST_IMAGE_DIR), "*.png", recursive=False)

        # WHEN: 模拟串行处理（每次处理一个）
        execution_count = 0
        for path in paths:
            # 模拟单个文件处理
            execution_count += 1

        # THEN: 必须执行 100 次
        assert execution_count == 100, f"应该执行 100 次，实际执行 {execution_count} 次"


# ============================================================================
# 主测试运行
# ============================================================================

def run_tests():
    """运行所有测试并返回结果"""
    print("\n" + "=" * 60)
    print("批量处理功能测试")
    print("=" * 60)

    # 运行 pytest 并收集结果
    import subprocess
    result = subprocess.run(
        [sys.executable, "-m", "pytest", __file__, "-v", "--tb=short"],
        cwd=str(project_root),
        capture_output=False,
    )

    print("\n" + "=" * 60)
    if result.returncode == 0:
        print("✓ 所有测试通过")
    else:
        print("✗ 部分测试失败")
    print("=" * 60)

    return result.returncode == 0


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
