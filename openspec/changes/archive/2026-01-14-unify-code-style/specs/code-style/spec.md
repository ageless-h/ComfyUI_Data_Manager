# code-style Specification

## Purpose

定义项目的统一代码风格标准，确保代码库的一致性和可维护性。

## ADDED Requirements

### Requirement: Python Code MUST Follow PEP 8 and Black Formatting

Python 代码 MUST 遵循 PEP 8 规范并使用 Black 格式化。

#### Scenario: Black configuration

- **GIVEN** Python 代码文件
- **WHEN** 运行 Black 格式化
- **THEN** 代码 MUST 符合 Black 默认配置
- **AND** 行长度 MUST 不超过 100 字符
- **AND** MUST 使用双引号优先

#### Scenario: Import ordering

- **GIVEN** Python 文件中的导入语句
- **WHEN** 运行 isort 排序
- **THEN** 导入 MUST 按标准库、第三方、本地模块分组
- **AND** 每组之间 MUST 有空行分隔
- **AND** MUST 与 Black 配置兼容

#### Scenario: Code quality checks

- **GIVEN** Python 代码
- **WHEN** 运行 flake8 检查
- **THEN** MUST 不报告风格错误
- **AND** 复杂度 MUST 不超过 15 (McCabe)

### Requirement: TypeScript Code MUST Follow Project Style Guide

TypeScript 代码 MUST 遵循项目制定的风格指南。

#### Scenario: ESLint compliance

- **GIVEN** TypeScript/JavaScript 文件
- **WHEN** 运行 ESLint 检查
- **THEN** MUST 不报告错误
- **AND** MUST 遵循 `@typescript-eslint` 推荐规则

#### Scenario: Prettier formatting

- **GIVEN** TypeScript/JavaScript 文件
- **WHEN** 运行 Prettier 格式化
- **THEN** 代码 MUST 符合配置的格式规则
- **AND** MUST 使用单引号优先
- **AND** MUST 使用 2 空格缩进
- **AND** 行长度 MUST 不超过 100 字符

#### Scenario: Import organization

- **GIVEN** TypeScript 文件
- **WHEN** 组织导入语句
- **THEN** 导入 MUST 按类型分组（外部、内部、类型）
- **AND** 每组之间 MUST 有空行
- **AND** 未使用的导入 MUST 被移除

### Requirement: Pre-commit Hooks MUST Enforce Code Style

pre-commit hooks MUST 在代码提交前自动检查和修复代码风格。

#### Scenario: Automatic formatting on commit

- **GIVEN** 开发者执行 git commit
- **WHEN** pre-commit hooks 运行
- **THEN** MUST 自动运行 Black 和 Prettier
- **AND** MUST 自动修复可修复的风格问题
- **AND** 如果有无法自动修复的问题，MUST 阻止提交

#### Scenario: Trailing whitespace and newlines

- **GIVEN** 任何文本文件
- **WHEN** 提交到 Git
- **THEN** 文件 MUST 没有尾随空格
- **AND** 文件 MUST 以换行符结尾

#### Scenario: Hook installation

- **GIVEN** 新开发者克隆仓库
- **WHEN** 运行安装脚本
- **THEN** pre-commit hooks MUST 自动安装
- **AND** hooks MUST 在每次提交时运行

### Requirement: IDE Configuration MUST Be Provided

项目 MUST 提供 VS Code 配置以确保开发者体验一致。

#### Scenario: Format on save

- **GIVEN** 开发者使用 VS Code
- **WHEN** 保存文件
- **THEN** Python 文件 MUST 自动使用 Black 格式化
- **AND** TypeScript 文件 MUST 自动使用 Prettier 格式化

#### Scenario: Recommended extensions

- **GIVEN** 开发者打开项目
- **WHEN** VS Code 检测到项目配置
- **THEN** MUST 推荐安装必要的扩展
- **AND** 扩展列表 MUST 包含 Python、ESLint、Prettier 等
