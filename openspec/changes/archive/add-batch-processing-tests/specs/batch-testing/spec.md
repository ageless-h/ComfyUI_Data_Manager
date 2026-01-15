# batch-testing Specification

## Purpose

定义批量处理功能的测试规范，确保批量文件处理（Match 模式和 Batch 模式）的正确性和可靠性。

## ADDED Requirements

### Requirement: 测试环境 MUST 提供可重复的测试数据

测试框架 MUST 提供可重复使用的测试数据集，包括预生成的测试文件和测试工作流配置。

#### Scenario: 生成测试图像集
- **GIVEN** 测试环境已初始化
- **WHEN** 执行测试数据生成脚本
- **THEN** MUST 在 `fixtures/batch_test_images/` 目录生成 100 张编号的测试图像
- **AND** 每张图像 MUST 包含可识别的编号（01-100）
- **AND** 图像格式 MUST 为 PNG
- **AND** 图像尺寸 MUST 为 512x512 像素

#### Scenario: 创建测试工作流
- **GIVEN** 需要测试批量处理工作流
- **WHEN** 生成 API 工作流 JSON
- **THEN** MUST 包含完整的节点配置（OutputPathConfig → ImageResize → InputPathConfig）
- **AND** MUST 配置 Match 模式参数（pattern: `*.png`）
- **AND** MUST 配置 Batch 模式参数（naming_rule: `resized_{index:04d}`）

### Requirement: 测试 MUST 验证 Match 模式的文件扫描功能

测试套件 MUST 验证 OutputPathConfig 节点的 Match 模式能正确扫描和返回文件路径列表。

#### Scenario: 验证通配符扫描
- **GIVEN** 测试目录包含 100 张 PNG 图像
- **WHEN** 使用 pattern `*.png` 扫描目录
- **THEN** MUST 返回 100 个文件路径
- **AND** 所有路径 MUST 以 `.png` 结尾
- **AND** 路径 MUST 按文件名排序

#### Scenario: 验证递归扫描
- **GIVEN** 测试目录包含子目录和文件
- **WHEN** 使用 pattern `**/*.png` 扫描
- **THEN** MUST 返回所有子目录中的 PNG 文件
- **AND** 返回的路径 MUST 保持相对目录结构

### Requirement: 测试 MUST 验证 Batch 模式的批量保存功能

测试套件 MUST 验证 InputPathConfig 节点的 Batch 模式能正确接收迭代数据并使用命名规则批量保存。

#### Scenario: 验证按索引命名
- **GIVEN** Batch 模式启用，naming_rule 为 `resized_{index:04d}`
- **WHEN** 接收 100 个迭代的图像数据
- **THEN** MUST 生成 100 个输出文件
- **AND** 文件名 MUST 为 `resized_0001.png` 到 `resized_0100.png`

#### Scenario: 验证保留原文件名
- **GIVEN** Batch 模式启用，naming_rule 为 `{original_name}_resized`
- **WHEN** 输入文件来自 Match 模式
- **THEN** 输出文件名 MUST 保留原文件名
- **AND** MUST 添加 `_resized` 后缀

### Requirement: 测试 MUST 验证端到端批量处理工作流

测试套件 MUST 提供端到端测试，验证从批量加载、处理到批量保存的完整流程。

#### Scenario: 完整批量处理工作流
- **GIVEN** 100 张源图像在输入目录
- **WHEN** 执行工作流：OutputPathConfig (Match) → ImageResize → InputPathConfig (Batch)
- **THEN** MUST 在输出目录生成 100 张处理后的图像
- **AND** 每张图像 MUST 缩小到原尺寸的 1/10
- **AND** 原始图像 MUST 保持不变

#### Scenario: 验证处理结果
- **GIVEN** 批量处理工作流已完成
- **WHEN** 验证脚本检查输出目录
- **THEN** 输出文件数量 MUST 等于输入文件数量（100）
- **AND** 每个输出文件的尺寸 MUST 约为 51x51 像素（512/10）
- **AND** 文件命名 MUST 符合指定的命名规则

### Requirement: 测试 MUST 验证内存安全

测试套件 MUST 验证批量处理不会导致内存堆积，确保 ComfyUI 的自动迭代机制正常工作。

#### Scenario: 验证内存不堆积
- **GIVEN** 批量处理 100 个文件
- **WHEN** 监控内存使用情况
- **THEN** 内存峰值 MUST 不超过处理单个文件所需内存的 2 倍
- **AND** 处理完成后内存 MUST 释放

#### Scenario: 验证串行执行
- **GIVEN** OutputPathConfig 返回 100 个文件路径
- **WHEN** 连接到单文件处理的下游节点
- **THEN** 下游节点 MUST 执行 100 次
- **AND** 每次执行 MUST 只处理一个文件

### Requirement: 测试结果 MUST 可验证和可报告

测试框架 MUST 提供清晰的测试报告，包括通过/失败状态、详细错误信息和覆盖率统计。

#### Scenario: 生成测试报告
- **GIVEN** 所有测试已执行
- **WHEN** 生成测试报告
- **THEN** MUST 显示每个测试的通过/失败状态
- **AND** 失败的测试 MUST 包含详细的错误信息和堆栈跟踪
- **AND** 报告 MUST 显示测试覆盖率（功能覆盖、文件数量验证）

#### Scenario: 验证脚本输出
- **GIVEN** 端到端测试完成
- **WHEN** 运行验证脚本
- **THEN** MUST 输出验证摘要：
  - 输入文件数量
  - 输出文件数量
  - 文件尺寸验证结果
  - 命名规则验证结果
- **AND** 所有验证通过 MUST 返回退出码 0
