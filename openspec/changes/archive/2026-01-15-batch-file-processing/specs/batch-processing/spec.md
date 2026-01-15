## ADDED Requirements

### Requirement: OutputPathConfig 节点 MUST 支持 Match 模式

OutputPathConfig 节点 MUST 支持通过 `enable_match` 参数启用 Match 模式，允许使用通配符批量加载文件。

#### Scenario: 启用 Match 模式
- **GIVEN** 用户在工作流中添加 OutputPathConfig 节点
- **WHEN** 用户设置 `enable_match` 为 `true`
- **AND** 提供 `pattern` 参数（如 `*.png`）
- **THEN** 节点 MUST 进入 Match 模式
- **AND** MUST 返回匹配的文件路径列表

#### Scenario: 使用通配符匹配文件
- **GIVEN** 用户在 Match 模式下设置 `pattern` 为 `input/*.png`
- **WHEN** 节点执行
- **THEN** MUST 使用 Python glob 模式匹配文件
- **AND** MUST 只返回 `.png` 扩展名的文件路径

#### Scenario: 递归匹配子目录
- **GIVEN** 用户在 Match 模式下设置 `pattern` 为 `**/*.jpg`
- **WHEN** 节点执行
- **THEN** MUST 递归扫描所有子目录
- **AND** MUST 返回所有匹配的文件路径

### Requirement: OutputPathConfig MUST 返回路径列表而非数据列表

为了避免内存堆积，OutputPathConfig 在 Match 模式下 MUST 返回文件路径字符串列表，而非加载后的数据列表。

#### Scenario: 返回路径列表
- **GIVEN** OutputPathConfig 在 Match 模式下执行
- **WHEN** 匹配到 N 个文件
- **THEN** MUST 返回包含 N 个路径字符串的列表
- **AND** MUST 不返回实际的 IMAGE/VIDEO/VIDEO 数据

#### Scenario: 触发自动迭代
- **GIVEN** OutputPathConfig 返回路径列表
- **WHEN** 连接到只接受单个文件的下游节点
- **THEN** ComfyUI MUST 自动为每个路径执行一次下游节点
- **AND** 每次执行只处理一个文件

#### Scenario: 内存安全保证
- **GIVEN** 匹配到 1000 个文件
- **WHEN** OutputPathConfig 执行
- **THEN** MUST 不会一次性加载所有文件到内存
- **AND** 下游节点 MUST 串行执行，每次只处理一个文件

### Requirement: InputPathConfig 节点 MUST 支持批量保存模式

InputPathConfig 节点 MUST 支持通过 `enable_batch` 参数启用批量保存模式，允许接收迭代数据并批量保存。

#### Scenario: 启用批量保存模式
- **GIVEN** 用户在工作流中添加 InputPathConfig 节点
- **WHEN** 用户设置 `enable_batch` 为 `true`
- **AND** 提供 `naming_rule` 参数
- **THEN** 节点 MUST 进入批量保存模式
- **AND** MUST 准备接收迭代的数据

#### Scenario: 按索引命名保存
- **GIVEN** 用户在批量保存模式下设置 `naming_rule` 为 `result_{:04d}`
- **WHEN** 接收到迭代的数据
- **THEN** MUST 自动命名为 `result_0001.png`, `result_0002.png`, ...
- **AND** MUST 使用迭代索引作为编号

#### Scenario: 保留原文件名
- **GIVEN** 用户设置 `naming_rule` 为 `{original_name}`
- **WHEN** 接收到来自 Match 模式的数据
- **THEN** MUST 保持原始文件名
- **AND** MUST 只更改扩展名（如果需要）

#### Scenario: 保持目录结构
- **GIVEN** 用户设置 `naming_rule` 为 `{original_path}/{original_name}`
- **WHEN** 从子目录加载文件并保存
- **THEN** MUST 在输出目录中创建相同的子目录结构

### Requirement: 通配符语法 MUST 符合 Python glob 标准

Match 模式使用的通配符语法 MUST 符合 Python glob 模块的标准，确保用户能够使用熟悉的通配符语法。

#### Scenario: 支持基本通配符
- **GIVEN** 用户输入 `*.png`
- **THEN** MUST 匹配当前目录所有 `.png` 文件

#### Scenario: 支持路径通配符
- **GIVEN** 用户输入 `input/*.jpg`
- **THEN** MUST 匹配 `input/` 目录下所有 `.jpg` 文件

#### Scenario: 支持递归通配符
- **GIVEN** 用户输入 `**/*.png` 或 `input/**/*.jpg`
- **THEN** MUST 递归匹配所有子目录中的文件

### Requirement: UI MUST 提供批量配置选项

节点配置界面 MUST 提供批量模式的配置选项，包括通配符输入、命名规则配置和预览功能。

#### Scenario: 显示批量模式选项
- **GIVEN** 用户打开 OutputPathConfig 或 InputPathConfig 节点配置
- **THEN** MUST 显示 `enable_match` 或 `enable_batch` 选项

#### Scenario: 通配符输入提示
- **GIVEN** 用户在 Match 模式下输入 `pattern`
- **THEN** MUST 显示通配符语法提示
- **AND** MUST 显示匹配的文件数量预览

#### Scenario: 命名规则配置界面
- **GIVEN** 用户在批量保存模式下
- **THEN** MUST 提供命名规则配置界面
- **AND** MUST 显示命名规则示例（如 `{:04d}`, `{original_name}`）

### Requirement: 批量处理 MUST 与现有工作流兼容

批量处理功能 MUST 与现有的单文件工作流兼容，不破坏现有用户的工作流。

#### Scenario: 向后兼容单文件模式
- **GIVEN** 用户现有的工作流使用单文件模式
- **WHEN** 不启用批量选项
- **THEN** 节点 MUST 保持现有行为不变

#### Scenario: 与 Core 节点配合
- **GIVEN** 用户使用 DataManagerCore 选择文件
- **WHEN** 连接到 OutputPathConfig
- **THEN** MUST 正常工作
- **AND** Match 模式 MUST 可与 Core 配合使用

#### Scenario: 与标准节点配合
- **GIVEN** OutputPathConfig 返回路径列表
- **WHEN** 连接到标准 ComfyUI 节点（如 Image Resize）
- **THEN** 标准节点 MUST 对每个路径执行一次
- **AND** MUST 不需要修改标准节点
