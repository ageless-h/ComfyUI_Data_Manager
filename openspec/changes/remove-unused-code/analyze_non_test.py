# -*- coding: utf-8 -*-
"""分析非测试代码的未使用导出"""
import ast
import sys
from pathlib import Path
from collections import defaultdict


def normalize_module_name(file_path):
    """将文件路径转换为模块名"""
    return str(file_path.with_suffix('')).replace('\\', '.').replace('/', '.')


def get_exports_from_file(file_path):
    """从文件中获取导出"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            tree = ast.parse(f.read(), filename=str(file_path))
    except:
        return None

    exports = {
        'functions': set(),
        'classes': set(),
        'variables': set(),
    }

    for node in ast.walk(tree):
        if not hasattr(node, 'col_offset') or node.col_offset != 0:
            continue

        if isinstance(node, ast.FunctionDef):
            if not node.name.startswith('_'):
                exports['functions'].add(node.name)
        elif isinstance(node, ast.ClassDef):
            if not node.name.startswith('_'):
                exports['classes'].add(node.name)
        elif isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name):
                    if not target.id.startswith('_'):
                        exports['variables'].add(target.id)
        elif isinstance(node, ast.AnnAssign):
            if isinstance(node.target, ast.Name):
                if not node.target.id.startswith('_'):
                    exports['variables'].add(node.target.id)

    return exports


def get_imports_from_file(file_path):
    """从文件中获取导入"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            tree = ast.parse(f.read(), filename=str(file_path))
    except:
        return set()

    imports = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                imports.add(alias.name)
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                for alias in node.names:
                    if alias.name != '*':
                        imports.add(f'{node.module}.{alias.name}')

    return imports


def main():
    backend_dir = Path('backend')
    py_files = list(backend_dir.rglob('*.py'))
    py_files = [f for f in py_files if '__pycache__' not in str(f)]

    # 分离测试和非测试模块
    non_test_files = []
    test_files = []

    for py_file in py_files:
        if 'test' in str(py_file):
            test_files.append(py_file)
        else:
            non_test_files.append(py_file)

    print('=' * 60)
    print('非测试模块未使用导出分析')
    print('=' * 60)
    print(f'\n非测试文件: {len(non_test_files)}')
    print(f'测试文件: {len(test_files)}')
    print()

    # 获取所有模块的导入（包括测试文件，因为测试会引用非测试代码）
    all_imports = set()
    for py_file in py_files:
        all_imports.update(get_imports_from_file(py_file))

    # 分析非测试文件
    unused_exports = defaultdict(list)
    used_exports = defaultdict(list)

    for py_file in non_test_files:
        module_name = normalize_module_name(py_file)
        exports = get_exports_from_file(py_file)

        if not exports:
            continue

        # 检查每个导出是否被使用
        for func in exports['functions']:
            full_name = f'{module_name}.{func}'
            is_used = any(
                imp == full_name or
                imp == module_name or
                imp.endswith(f'.{func}') or
                f'.{func}' in imp
                for imp in all_imports
            )

            if is_used:
                used_exports[module_name].append((func, 'function'))
            else:
                unused_exports[module_name].append((func, 'function'))

        for cls in exports['classes']:
            full_name = f'{module_name}.{cls}'
            is_used = any(
                imp == full_name or
                imp == module_name or
                imp.endswith(f'.{cls}') or
                f'.{cls}' in imp
                for imp in all_imports
            )

            if is_used:
                used_exports[module_name].append((cls, 'class'))
            else:
                unused_exports[module_name].append((cls, 'class'))

        for var in exports['variables']:
            full_name = f'{module_name}.{var}'
            is_used = any(
                imp == full_name or
                imp == module_name or
                imp.endswith(f'.{var}') or
                f'.{var}' in imp
                for imp in all_imports
            )

            if is_used:
                used_exports[module_name].append((var, 'variable'))
            else:
                unused_exports[module_name].append((var, 'variable'))

    # 打印结果
    total_used = sum(len(v) for v in used_exports.values())
    total_unused = sum(len(v) for v in unused_exports.values())

    print(f'总计: {total_used} 个被使用, {total_unused} 个未使用\n')

    if unused_exports:
        print('=' * 60)
        print('未使用的导出')
        print('=' * 60)
        print()

        for module, items in sorted(unused_exports.items()):
            if items:
                print(f'{module}:')
                for name, kind in sorted(items):
                    print(f'  ✗ {name} [{kind}]')
                print()

    # 特殊检查：可能是入口点的导出
    print('=' * 60)
    print('需要人工确认的导出 (可能是入口点或特殊用途)')
    print('=' * 60)
    print()

    keywords = ['main', 'entry', 'register', 'init', 'setup', 'logger']
    needs_review = []

    for module, items in unused_exports.items():
        for name, kind in items:
            if any(keyword in name.lower() for keyword in keywords):
                needs_review.append((module, name, kind))

    if needs_review:
        for module, name, kind in sorted(needs_review):
            print(f'  ? {module}.{name} [{kind}]')
            print(f'      原因: 名称包含入口点关键字')
    else:
        print('  无')


if __name__ == '__main__':
    main()
