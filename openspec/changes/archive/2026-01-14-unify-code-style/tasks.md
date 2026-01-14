# Tasks: Unify Code Style

## Phase 1: Python 代码风格配置

- [x] 1.1 创建 `pyproject.toml` 配置文件
- [x] 1.2 配置 Black 格式化规则
- [x] 1.3 配置 isort 导入排序规则
- [x] 1.4 配置 flake8 代码检查规则
- [x] 1.5 运行 `black --check .` 验证配置
- [x] 1.6 运行 `black .` 格式化所有 Python 代码

## Phase 2: TypeScript 代码风格配置

- [x] 2.1 创建 `.eslintrc.cjs` 配置文件
- [x] 2.2 创建 `.prettierrc` 配置文件
- [x] 2.3 创建 `.prettierignore` 文件
- [x] 2.4 配置 ESLint + Prettier 协作
- [x] 2.5 更新 `package.json` 添加 lint 和 format 脚本
- [x] 2.6 运行 `npm run format:check` 验证配置
- [x] 2.7 运行 `npm run format:fix` 格式化所有 TypeScript 代码

## Phase 3: Pre-commit Hooks 配置

- [x] 3.1 安装 pre-commit
- [x] 3.2 创建 `.pre-commit-config.yaml`
- [x] 3.3 配置 Python hooks (black, isort, flake8)
- [x] 3.4 配置 TypeScript hooks (eslint, prettier)
- [x] 3.5 配置 trailing whitespace 和 end-of-file fixer
- [x] 3.6 测试 pre-commit hooks

## Phase 4: VS Code 配置

- [x] 4.1 创建 `.vscode/settings.json`
- [x] 4.2 配置 Python 默认格式化工具
- [x] 4.3 配置 TypeScript 默认格式化工具
- [x] 4.4 启用保存时自动格式化
- [x] 4.5 配置推荐的扩展列表

## Phase 5: 文档和验证

- [x] 5.1 更新 README.md 添加代码风格章节
- [x] 5.2 更新 CONTRIBUTING.md 说明开发流程
- [x] 5.3 在 CI/CD 中添加代码风格检查
- [x] 5.4 验证所有配置正常工作
- [x] 5.5 提交变更到 Git
