# -*- coding: utf-8 -*-
"""分析非测试代码真正未使用的导出（模块内部分析）"""
import ast
import sys
from pathlib import Path
from collections import defaultdict


def get_module_internal_usage(file_path):
    """分析模块内部定义的名称是否在模块内被使用"""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            tree = ast.parse(f.read(), filename=str(file_path))
    except:
        return None

    # 收集顶层定义的名称
    defined = set()
    for node in ast.walk(tree):
        if not hasattr(node, "col_offset") or node.col_offset != 0:
            continue
        if isinstance(node, (ast.FunctionDef, ast.ClassDef)):
            if not node.name.startswith("_"):
                defined.add((node.name, type(node).__name__))
        elif isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name) and not target.id.startswith("_"):
                    defined.add((target.id, "Assign"))
        elif isinstance(node, ast.AnnAssign):
            if isinstance(node.target, ast.Name) and not node.target.id.startswith("_"):
                defined.add((node.target.id, "Assign"))

    # 收集所有名称引用
    referenced = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Name):
            referenced.add(node.id)

    # 找出未使用的
    unused = set()
    used = set()
    for name, kind in defined:
        if name in referenced:
            used.add((name, kind))
        else:
            unused.add((name, kind))

    return {"defined": defined, "used": used, "unused": unused, "total_referenced": referenced}


def main():
    backend_dir = Path("backend")
    py_files = list(backend_dir.rglob("*.py"))
    py_files = [f for f in py_files if "__pycache__" not in str(f) and "test" not in str(f)]

    print("=" * 70)
    print("非测试模块内部使用分析")
    print("=" * 70)
    print()

    total_defined = 0
    total_unused = 0
    total_used = 0

    for py_file in sorted(py_files):
        result = get_module_internal_usage(py_file)
        if not result:
            continue

        module_name = str(py_file).replace("\\", "/").replace("/", ".")

        if result["unused"]:
            print(f"\n{module_name}:")
            print(
                f"  定义: {len(result['defined'])} | 使用: {len(result['used'])} | 未使用: {len(result['unused'])}"
            )

            if result["unused"]:
                print("  未使用的导出:")
                for name, kind in sorted(result["unused"]):
                    # 排除一些特殊情况
                    if kind == "class" and name in ["Exception", "Error"]:
                        continue
                    print(f"    ✗ {name} [{kind}]")
                    total_unused += 1
                print()

        total_defined += len(result["defined"])
        total_used += len(result["used"])

    print()
    print("=" * 70)
    print("汇总统计")
    print("=" * 70)
    print(f"总定义: {total_defined}")
    print(f"内部使用: {total_used}")
    print(f"真正未使用: {total_unused}")
    print()

    # 现在检查这些未使用的项是否被其他模块引用
    print("=" * 70)
    print("检查未使用项是否被其他模块引用")
    print("=" * 70)
    print()

    # 收集所有导入
    all_imports = defaultdict(set)
    for py_file in py_files:
        try:
            with open(py_file, "r", encoding="utf-8") as f:
                tree = ast.parse(f.read(), filename=str(py_file))
        except:
            continue

        module_name = str(py_file).replace("\\", "/")
        for node in ast.walk(tree):
            if isinstance(node, ast.ImportFrom):
                if node.module:
                    for alias in node.names:
                        if alias.name != "*":
                            all_imports[module_name].add(f"{node.module}.{alias.name}")
            elif isinstance(node, ast.Import):
                for alias in node.names:
                    all_imports[module_name].add(alias.name)

    # 重新分析每个模块
    truly_unused = defaultdict(list)
    needs_review = []

    for py_file in sorted(py_files):
        result = get_module_internal_usage(py_file)
        if not result or not result["unused"]:
            continue

        module_name = str(py_file).replace("\\", "/")
        module_dot = str(py_file.with_suffix("")).replace("\\", ".").replace("/", ".")

        for name, kind in result["unused"]:
            full_name = f"{module_dot}.{name}"

            # 检查是否被其他模块导入
            is_imported = False
            for importer, imports in all_imports.items():
                if importer == module_name:
                    continue
                for imp in imports:
                    if imp == full_name or imp.endswith(f".{name}"):
                        is_imported = True
                        break
                if is_imported:
                    break

            if not is_imported:
                # 特殊检查：logger 可能是用于调试，可以保留
                if name == "logger":
                    needs_review.append((module_dot, name, kind, "logger (调试用途)"))
                elif name in ["ComfyExtension"]:
                    needs_review.append((module_dot, name, kind, "可能需要继承"))
                else:
                    truly_unused[module_dot].append((name, kind))

    if truly_unused:
        print("确认未使用的导出（可安全删除）:\n")
        for module, items in sorted(truly_unused.items()):
            if items:
                print(f"{module}:")
                for name, kind in items:
                    print(f"  - {name} [{kind}]")
                print()

    if needs_review:
        print("\n需要人工确认的导出:\n")
        for module, name, kind, reason in needs_review:
            print(f"  ? {module}.{name} [{kind}]")
            print(f"      原因: {reason}")
        print()


if __name__ == "__main__":
    main()
