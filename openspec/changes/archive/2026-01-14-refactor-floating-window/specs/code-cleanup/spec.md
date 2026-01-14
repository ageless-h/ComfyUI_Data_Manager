## ADDED Requirements

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
