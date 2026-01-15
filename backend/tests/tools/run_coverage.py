# -*- coding: utf-8 -*-
"""run_coverage.py - 代码覆盖率报告生成脚本

运行测试并生成代码覆盖率报告。

使用方法:
    python run_coverage.py              # 生成终端和 HTML 报告
    python run_coverage.py --term       # 只生成终端报告
    python run_coverage.py --html       # 只生成 HTML 报告
    python run_coverage.py --xml        # 只生成 XML 报告（CI）
"""

import argparse
import os
import subprocess
import sys
from pathlib import Path


def run_command(cmd, cwd=None):
    """运行命令并返回结果"""
    print(f"\n▶ 运行: {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=cwd, capture_output=False)
    return result.returncode


def main():
    parser = argparse.ArgumentParser(description="运行测试并生成覆盖率报告")
    parser.add_argument(
        "--term", action="store_true", help="只生成终端覆盖率报告"
    )
    parser.add_argument(
        "--html", action="store_true", help="只生成 HTML 覆盖率报告"
    )
    parser.add_argument(
        "--xml", action="store_true", help="只生成 XML 覆盖率报告（CI）"
    )
    parser.add_argument(
        "--no-coverage",
        action="store_true",
        help="运行测试但不生成覆盖率报告",
    )
    parser.add_argument(
        "--target",
        default="80",
        help="最低覆盖率目标百分比（默认: 80）",
    )

    args = parser.parse_args()

    # 切换到测试目录
    tests_dir = Path(__file__).parent
    os.chdir(tests_dir)

    # 构建 pytest 命令
    cmd = ["python", "-m", "pytest"]

    # 添加覆盖率选项
    if not args.no_coverage:
        cmd.extend(["--cov=backend", "--cov-context=test"])

        # 确定报告格式
        if args.term or not (args.html or args.xml):
            cmd.append("--cov-report=term-missing")
        if args.html or not (args.term or args.xml):
            cmd.append("--cov-report=html:htmlcov")
        if args.xml or not (args.term or args.html):
            cmd.append("--cov-report=xml:coverage.xml")

    # 添加详细输出
    cmd.extend(["-v", "--durations=10"])

    # 添加测试路径
    cmd.extend(["unit", "integration"])

    # 运行测试
    print("=" * 60)
    print("运行测试并生成覆盖率报告")
    print("=" * 60)

    exit_code = run_command(cmd)

    # 检查覆盖率
    if exit_code == 0 and not args.no_coverage:
        print("\n" + "=" * 60)
        print("覆盖率报告")
        print("=" * 60)

        # 读取覆盖率数据并显示摘要
        try:
            import coverage

            cov = coverage.Coverage()
            cov.load()

            # 获取总体覆盖率
            total = cov.report(file=None)
            target = float(args.target)

            print(f"\n总体覆盖率: {total:.1f}%")
            print(f"目标覆盖率: {target:.1f}%")

            if total >= target:
                print(f"\n✅ 覆盖率达标！({total:.1f}% >= {target:.1f}%)")
            else:
                print(f"\n⚠️  覆盖率未达标！({total:.1f}% < {target:.1f}%)")
                print(f"   差距: {target - total:.1f}%")

            # 显示各模块覆盖率
            print("\n模块覆盖率:")
            print("-" * 40)
            for module in [
                "backend/core/nodes_v3",
                "backend/helpers/batch_namer",
                "backend/helpers/batch_scanner",
                "backend/helpers/file_ops",
                "backend/helpers/path_utils",
                "backend/api/routes/files",
                "backend/api/routes/ssh",
            ]:
                try:
                    module_cov = cov.report(file=[module])
                    print(f"  {module}: {module_cov:.1f}%")
                except Exception:
                    pass

        except ImportError:
            print("\n⚠️  coverage 模块未安装，无法显示详细报告")
            print("   安装: pip install coverage")

        # 显示报告位置
        if not args.term:
            html_path = tests_dir / "htmlcov" / "index.html"
            if html_path.exists():
                print(f"\nHTML 报告: {html_path}")
                print(f"在浏览器中打开查看详细报告")

        if not args.html:
            xml_path = tests_dir / "coverage.xml"
            if xml_path.exists():
                print(f"\nXML 报告: {xml_path}")

    sys.exit(exit_code)


if __name__ == "__main__":
    main()
