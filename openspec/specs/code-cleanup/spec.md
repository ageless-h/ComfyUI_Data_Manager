# code-cleanup Specification

## Purpose
TBD - created by archiving change remove-unused-code. Update Purpose after archive.
## Requirements
### Requirement: Unused Backend Code MUST Be Removed

未使用的后端代码 MUST 被移除。

#### Scenario: Identifying unused modules

- **GIVEN** backend/ 目录中的 Python 模块
- **WHEN** 分析代码引用
- **THEN** 必须识别未被其他模块导入的模块
- **AND** 必须确认模块不是动态加载的

#### Scenario: Identifying unused functions

- **GIVEN** Python 模块中的函数
- **WHEN** 搜索函数引用
- **THEN** 必须识别未被调用的公共函数
- **AND** 私有函数（_前缀）可以被保留

#### Scenario: Safe deletion verification

- **GIVEN** 标记为未使用的代码
- **WHEN** 删除前
- **THEN** 必须验证代码确实未被引用
- **AND** 必须运行测试确保没有破坏功能

### Requirement: Unused Frontend Code MUST Be Removed

未使用的前端代码 MUST 被移除。

#### Scenario: Identifying unused exports

- **GIVEN** frontend/src/ 目录中的 TypeScript/JavaScript 文件
- **WHEN** 分析导出（export）
- **THEN** 必须识别未被其他文件导入的导出
- **AND** 必须区分默认导出和命名导出

#### Scenario: Identifying unused imports

- **GIVEN** 前端文件中的导入语句
- **WHEN** 分析导入使用情况
- **THEN** 必须识别已导入但未使用的变量和函数
- **AND** 必须移除未使用的导入

### Requirement: Tests MUST Pass After Cleanup

清理后所有测试 MUST 通过。

#### Scenario: Backend tests after cleanup

- **GIVEN** 删除未使用代码后的代码库
- **WHEN** 运行后端测试
- **THEN** 所有测试必须通过
- **AND** 测试数量不应减少（除非删除的是测试本身）

#### Scenario: Frontend tests after cleanup

- **GIVEN** 删除未使用代码后的代码库
- **WHEN** 运行前端测试
- **THEN** 所有测试必须通过
- **AND** 代码必须能正常编译

### Requirement: Cleanup MUST Be Documented

清理操作 MUST 被记录。

#### Scenario: Deleted code inventory

- **GIVEN** 代码清理完成
- **WHEN** 创建清理报告
- **THEN** 必须列出所有删除的文件
- **AND** 必须说明删除原因
- **AND** 必须记录删除的代码行数

