# -*- coding: utf-8 -*-
"""分析后端代码导出和引用的工具脚本"""
import ast
import sys
from pathlib import Path
from collections import defaultdict


def get_module_name(file_path, base_dir):
    """将文件路径转换为模块名"""
    rel_path = file_path.relative_to(base_dir).with_suffix('')
    return str(rel_path).replace('/', '.').replace('\\', '.')


def parse_file(file_path):
    """解析 Python 文件，提取导出和导入"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return ast.parse(content, filename=str(file_path))
    except Exception as e:
        return None


def get_exports(tree):
    """获取文件导出的函数、类和变量"""
    exports = {
        'functions': set(),
        'classes': set(),
        'variables': set(),
    }

    for node in ast.walk(tree):
        # 只处理顶层节点
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


def get_imports(tree):
    """获取文件的所有导入"""
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


def analyze_backend():
    """分析后端代码"""
    backend_dir = Path('backend')
    py_files = list(backend_dir.rglob('*.py'))

    # 排除缓存文件
    py_files = [f for f in py_files if '__pycache__' not in str(f)]

    print(f'找到 {len(py_files)} 个 Python 文件\n')

    # 分析每个文件
    modules = {}
    all_exports = defaultdict(set)
    all_imports = set()

    for py_file in py_files:
        tree = parse_file(py_file)
        if not tree:
            continue

        module_name = get_module_name(py_file, Path('.'))

        exports = get_exports(tree)
        imports = get_imports(tree)

        modules[module_name] = {
            'file': py_file,
            'exports': exports,
            'imports': imports,
        }

        # 收集所有导出
        for func in exports['functions']:
            all_exports[f'{module_name}.{func}'].add('function')
        for cls in exports['classes']:
            all_exports[f'{module_name}.{cls}'].add('class')
        for var in exports['variables']:
            all_exports[f'{module_name}.{var}'].add('variable')

        # 收集所有导入
        all_imports |= imports

    return modules, all_exports, all_imports


def find_unused_references(modules, all_exports):
    """查找未引用的导出"""
    # 获取所有项目内的导入
    project_imports = set()
    for module_data in modules.values():
        project_imports.update(module_data['imports'])

    unused = []
    potentially_unused = []

    for export_name, export_types in sorted(all_exports.items()):
        module_part = '.'.join(export_name.split('.')[:-1])
        name_part = export_name.split('.')[-1]

        # 检查是否被引用
        is_referenced = False
        for imp in project_imports:
            if imp == export_name or imp == module_part or imp.endswith(f'.{name_part}'):
                is_referenced = True
                break

        if not is_referenced:
            # 检查是否可能是动态加载或入口点
            if any(keyword in export_name.lower() for keyword in ['main', 'entry', 'register', 'init', 'setup']):
                potentially_unused.append((export_name, export_types))
            else:
                unused.append((export_name, export_types))

    return unused, potentially_unused


def main():
    print('=' * 60)
    print('后端 Python 代码导出分析')
    print('=' * 60)
    print()

    modules, all_exports, all_imports = analyze_backend()

    print(f'总模块数: {len(modules)}')
    print(f'总导出数: {len(all_exports)}')
    print()

    # 按模块显示导出
    print('=' * 60)
    print('模块导出详情')
    print('=' * 60)
    print()

    for module_name, data in sorted(modules.items()):
        exports = data['exports']
        items = []
        if exports['functions']:
            items.append(f"{len(exports['functions'])} 函数")
        if exports['classes']:
            items.append(f"{len(exports['classes'])} 类")
        if exports['variables']:
            items.append(f"{len(exports['variables'])} 变量")

        if items:
            print(f'{module_name}: {", ".join(items)}')

            # 显示详细导出列表
            for func in sorted(exports['functions']):
                print(f'  - {func}() [function]')
            for cls in sorted(exports['classes']):
                print(f'  - {cls} [class]')
            for var in sorted(exports['variables']):
                print(f'  - {var} [variable]')
            print()

    # 查找未引用的导出
    print('=' * 60)
    print('未引用分析')
    print('=' * 60)
    print()

    unused, potentially_unused = find_unused_references(modules, all_exports)

    print(f'可能未使用的导出: {len(unused)}')
    for name, types in sorted(unused):
        print(f'  - {name} [{", ".join(types)}]')

    print()
    print(f'需要人工确认的导出 (可能是入口点): {len(potentially_unused)}')
    for name, types in sorted(potentially_unused):
        print(f'  - {name} [{", ".join(types)}]')


if __name__ == '__main__':
    main()
