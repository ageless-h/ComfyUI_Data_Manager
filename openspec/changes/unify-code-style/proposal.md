# Proposal: Unify Code Style

## Summary

为项目配置统一的代码风格和自动格式化工具，确保代码库的一致性和可维护性。

## Motivation

### 当前问题

1. **Python 代码风格不统一**
   - 缺少 Black、isort 等格式化工具配置
   - 缺少 flake8/pylint 等 linter 配置
   - 导入语句顺序没有强制检查
   - 代码行长度、引号风格等没有统一标准

2. **TypeScript 代码风格不统一**
   - 缺少 ESLint 配置
   - 缺少 Prettier 配置
   - 代码格式化依赖手动操作，容易遗漏
   - 缺少 Git hooks 自动检查

3. **缺少自动化保障**
   - 没有 pre-commit hooks
   - CI/CD 中没有代码风格检查
   - 开发者需要手动检查代码风格

### 预期收益

1. **统一代码风格**
   - 自动化代码格式化，减少人工审查负担
   - 统一的导入顺序和格式
   - 一致的代码缩进和行宽

2. **提高开发效率**
   - 减少代码风格相关的讨论
   - 自动修复大部分风格问题
   - IDE 集成提供实时反馈

3. **改善代码质量**
   - 自动检测常见代码问题
   - 强制执行最佳实践
   - 减少潜在的 bug

## Proposed Solution

### Phase 1: Python 代码风格配置

1. **Black** - 代码格式化
   - 配置 `pyproject.toml` 或 `.black.toml`
   - 设置行长度为 100（兼容性更好）
   - 配置双引号优先

2. **isort** - 导入排序
   - 配置导入分组顺序
   - 与 Black 兼容设置

3. **flake8** - 代码检查
   - 配置忽略规则
   - 集成 McCabe 复杂度检查

4. **pyproject.toml** - 统一配置文件
   - 集中管理所有 Python 工具配置

### Phase 2: TypeScript 代码风格配置

1. **ESLint** - 代码检查
   - 配置 `@typescript-eslint` 规则
   - 集成 Vitest 相关规则

2. **Prettier** - 代码格式化
   - 配置与 ESLint 协作
   - 统一引号、分号、缩进等格式

3. **tsconfig.json** 增强
   - 启用严格类型检查
   - 配置路径别名

### Phase 3: 自动化工具集成

1. **pre-commit hooks**
   - 安装 pre-commit
   - 配置 `.pre-commit-config.yaml`
   - 自动在提交前运行格式化和检查

2. **VS Code 配置**
   - 配置 `.vscode/settings.json`
   - 设置默认格式化工具
   - 配置保存时自动格式化

3. **npm scripts 增强**
   - 添加 `format:check` 命令
   - 添加 `format:fix` 命令
   - 添加 `lint:all` 命令

## Impact

- 所有现有代码需要一次性格式化（可自动完成）
- 开发者需要安装 pre-commit hooks（一次性操作）
- CI/CD 需要添加代码风格检查步骤
- 不会影响任何现有功能

## Success Criteria

- [ ] Python 代码可以通过 Black 和 isort 检查
- [ ] TypeScript 代码可以通过 ESLint 和 Prettier 检查
- [ ] pre-commit hooks 正常工作
- [ ] CI/CD 中的代码风格检查通过
- [ ] 所有开发者都能正确配置开发环境
