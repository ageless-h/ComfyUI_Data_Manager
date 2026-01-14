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

### Requirement: 代码重复 MUST 被消除

相同的逻辑 MUST 被提取为可复用的函数或组件。

#### Scenario: 识别重复代码
- **GIVEN** 两个或多个函数包含 80% 以上相同代码
- **WHEN** 分析代码结构
- **THEN** 必须提取公共逻辑为单一函数
- **AND** 使用参数化处理差异部分

#### Scenario: 验证重构结果
- **GIVEN** 重构后的代码
- **WHEN** 运行测试
- **THEN** 功能行为必须保持一致
- **AND** 代码行数应减少

### Requirement: 魔法数字 MUST 被替换为命名常量

代码中的魔法数字 MUST 被替换为有语义名称的常量。

#### Scenario: 识别魔法数字
- **GIVEN** 源代码中的数字字面量
- **WHEN** 数字出现超过一次
- **THEN** 必须提取为命名常量
- **AND** 常量名称应描述其用途

#### Scenario: 配置对象组织
- **GIVEN** 多个相关的配置常量
- **WHEN** 组织常量
- **THEN** 相关常量应分组到配置对象中
- **AND** 使用 TypeScript 类型定义确保类型安全

### Requirement: 函数参数 MUST 保持可维护性

函数参数过多（超过 5 个）时 MUST 使用选项对象模式。

#### Scenario: 识别复杂函数签名
- **GIVEN** 具有 5 个以上参数的函数
- **WHEN** 参数主要是相同类型（如多个布尔值）
- **THEN** 必须使用选项对象重构
- **AND** 选项接口应定义明确的类型

#### Scenario: 保持向后兼容
- **GIVEN** 重构后的函数
- **WHEN** 现有代码调用该函数
- **THEN** 行为必须保持一致
- **AND** 类型检查必须通过

### Requirement: 重复计算 MUST 被缓存

重复的昂贵操作（如 DOM 查询）结果 MUST 被缓存。

#### Scenario: 识别重复查询
- **GIVEN** 在同一执行上下文中多次调用相同查询
- **WHEN** 查询结果不会改变
- **THEN** 必须缓存查询结果
- **AND** 使用变量存储缓存值

#### Scenario: 缓存失效
- **GIVEN** 缓存的值
- **WHEN** 底层数据可能改变
- **THEN** 必须提供清除缓存的方法
- **AND** 在适当时机清除缓存

