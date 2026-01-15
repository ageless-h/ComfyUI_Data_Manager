# -*- coding: utf-8 -*-
"""批量处理输出验证脚本

验证批量处理工作流的输出结果：
- 输出文件数量等于输入文件数量
- 文件尺寸正确（缩小 10 倍）
- 命名规则符合要求
"""

import os
import sys
from pathlib import Path
from PIL import Image

# 项目路径
project_root = Path(__file__).parent.parent.parent
INPUT_DIR = project_root / "backend" / "tests" / "fixtures" / "batch_test_images"
OUTPUT_DIR = project_root / "backend" / "tests" / "fixtures" / "batch_test_output"


class BatchOutputVerifier:
    """批量处理输出验证器"""

    def __init__(self, input_dir: Path, output_dir: Path):
        self.input_dir = input_dir
        self.output_dir = output_dir
        self.errors = []
        self.warnings = []
        self.results = {}

    def verify_all(self) -> bool:
        """执行所有验证

        Returns:
            所有验证是否通过
        """
        print("\n" + "=" * 70)
        print("批量处理输出验证")
        print("=" * 70)

        all_passed = True

        # 1. 检查输出文件数量
        if not self._verify_file_count():
            all_passed = False

        # 2. 验证文件尺寸
        if not self._verify_file_sizes():
            all_passed = False

        # 3. 验证命名规则
        if not self._verify_naming_rules():
            all_passed = False

        # 打印摘要
        self._print_summary()

        return all_passed

    def _verify_file_count(self) -> bool:
        """验证输出文件数量"""
        print("\n[1] 验证输出文件数量...")

        # 统计输入文件
        input_files = list(self.input_dir.glob("*.png"))
        input_count = len(input_files)

        # 统计输出文件
        if not self.output_dir.exists():
            self.errors.append(f"输出目录不存在: {self.output_dir}")
            print(f"  ✗ 输出目录不存在")
            return False

        output_files = list(self.output_dir.glob("*.png"))
        output_count = len(output_files)

        self.results["input_count"] = input_count
        self.results["output_count"] = output_count

        print(f"  输入文件数量: {input_count}")
        print(f"  输出文件数量: {output_count}")

        if input_count == output_count:
            print(f"  ✓ 文件数量匹配")
            return True
        else:
            self.errors.append(f"文件数量不匹配: 输入 {input_count}, 输出 {output_count}")
            print(f"  ✗ 文件数量不匹配")
            return False

    def _verify_file_sizes(self) -> bool:
        """验证文件尺寸（缩小 10 倍）"""
        print("\n[2] 验证文件尺寸...")

        output_files = list(self.output_dir.glob("*.png"))
        if not output_files:
            self.errors.append("没有输出文件可以验证尺寸")
            print(f"  ✗ 没有输出文件")
            return False

        # 输入文件原始尺寸 (512x512)
        expected_size = (51, 51)  # 512/10 ≈ 51

        size_errors = []
        verified_count = 0

        for filepath in output_files[:10]:  # 只检查前 10 个文件作为样本
            try:
                with Image.open(filepath) as img:
                    actual_size = img.size

                    if actual_size == expected_size:
                        verified_count += 1
                    else:
                        size_errors.append(f"{filepath.name}: {actual_size} (期望: {expected_size})")
            except Exception as e:
                size_errors.append(f"{filepath.name}: 无法读取 ({e})")

        self.results["size_verified_count"] = verified_count
        self.results["size_sample_count"] = min(10, len(output_files))

        print(f"  检查样本: {verified_count}/{self.results['size_sample_count']} 个文件")
        print(f"  期望尺寸: {expected_size[0]}x{expected_size[1]} (512/10)")

        if not size_errors:
            print(f"  ✓ 所有样本文件尺寸正确")
            return True
        else:
            self.errors.extend(size_errors[:3])  # 只记录前 3 个错误
            print(f"  ✗ 发现尺寸错误:")
            for err in size_errors[:3]:
                print(f"    - {err}")
            return False

    def _verify_naming_rules(self) -> bool:
        """验证命名规则"""
        print("\n[3] 验证命名规则...")

        output_files = list(self.output_dir.glob("*.png"))
        if not output_files:
            self.errors.append("没有输出文件可以验证命名")
            print(f"  ✗ 没有输出文件")
            return False

        # 预期命名规则: resized_{index:04d}.png
        expected_pattern = "resized_"
        naming_errors = []
        correct_count = 0

        for filepath in output_files:
            filename = filepath.name

            if filename.startswith(expected_pattern) and filename.endswith(".png"):
                # 检查索引格式 (0001-0100)
                index_part = filename[len(expected_pattern):-4]
                if index_part.isdigit() and 1 <= int(index_part) <= 100:
                    correct_count += 1
                else:
                    naming_errors.append(f"{filename}: 索引格式错误")
            else:
                naming_errors.append(f"{filename}: 命名格式错误")

        self.results["naming_correct_count"] = correct_count
        self.results["naming_total_count"] = len(output_files)

        print(f"  预期格式: resized_{{index:04d}}.png (resized_0001.png 到 resized_0100.png)")
        print(f"  正确命名: {correct_count}/{len(output_files)} 个文件")

        if not naming_errors:
            print(f"  ✓ 所有文件命名正确")
            return True
        else:
            self.errors.extend(naming_errors[:3])
            print(f"  ✗ 发现命名错误:")
            for err in naming_errors[:3]:
                print(f"    - {err}")
            return False

    def _print_summary(self):
        """打印验证摘要"""
        print("\n" + "=" * 70)
        print("验证摘要")
        print("=" * 70)

        print(f"\n输入文件数量: {self.results.get('input_count', 0)}")
        print(f"输出文件数量: {self.results.get('output_count', 0)}")
        print(f"尺寸验证: {self.results.get('size_verified_count', 0)}/{self.results.get('size_sample_count', 0)} 通过")
        print(f"命名验证: {self.results.get('naming_correct_count', 0)}/{self.results.get('naming_total_count', 0)} 正确")

        if self.warnings:
            print(f"\n警告 ({len(self.warnings)}):")
            for warning in self.warnings[:5]:
                print(f"  ⚠ {warning}")

        if self.errors:
            print(f"\n错误 ({len(self.errors)}):")
            for error in self.errors[:5]:
                print(f"  ✗ {error}")

        print("\n" + "=" * 70)

        if not self.errors:
            print("✓ 所有验证通过")
            print("=" * 70)
        else:
            print("✗ 验证失败")
            print("=" * 70)


def main():
    """主函数"""
    import argparse

    parser = argparse.ArgumentParser(description="验证批量处理输出")
    parser.add_argument(
        "--input-dir",
        type=str,
        default=str(INPUT_DIR),
        help=f"输入目录 (默认: {INPUT_DIR})"
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default=str(OUTPUT_DIR),
        help=f"输出目录 (默认: {OUTPUT_DIR})"
    )

    args = parser.parse_args()

    verifier = BatchOutputVerifier(Path(args.input_dir), Path(args.output_dir))
    success = verifier.verify_all()

    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
