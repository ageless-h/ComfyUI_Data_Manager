# e2e-testing Specification

## Purpose

定义使用 Playwright 进行端到端测试的规范，确保前端应用在真实浏览器环境中的正确性和稳定性。

## ADDED Requirements

### Requirement: Playwright MUST Be Configured for E2E Testing

系统 MUST 配置 Playwright 测试框架，支持多浏览器和并行执行。

#### Scenario: Playwright 配置文件存在

- **GIVEN** 项目使用 Vite 构建
- **WHEN** 开发者运行 E2E 测试
- **THEN** playwright.config.ts MUST 存在于 `frontend/` 目录
- **AND** 配置 MUST 指定测试目录为 `e2e/`
- **AND** 配置 MUST 支持 Chromium, Firefox, WebKit 浏览器

#### Scenario: 浏览器安装完成

- **GIVEN** Playwright 已安装
- **WHEN** 运行 `npx playwright install`
- **THEN** MUST 下载所有支持的浏览器
- **AND** MUST 安装成功无错误

### Requirement: E2E Tests MUST Cover Core User Workflows

E2E 测试 MUST 覆盖核心用户操作流程，验证完整的用户体验。

#### Scenario: 文件管理器操作流程

- **GIVEN** ComfyUI 已启动并加载 Data Manager 扩展
- **WHEN** 用户打开文件管理器
- **THEN** MUST 能够浏览目录
- **AND** MUST 能够搜索文件
- **AND** MUST 能够预览文件
- **AND** MUST 能够关闭文件管理器

#### Scenario: 设置面板操作流程

- **GIVEN** 文件管理器已打开
- **WHEN** 用户点击设置按钮
- **THEN** MUST 显示设置面板
- **AND** MUST 能够修改配置
- **AND** MUST 能够保存设置
- **AND** 设置 MUST 持久化

#### Scenario: 文件预览功能

- **GIVEN** 文件列表包含可预览文件
- **WHEN** 用户点击文件预览
- **THEN** MUST 显示预览面板
- **AND** MUST 正确渲染文件内容
- **AND** MUST 支持关闭预览

### Requirement: E2E Tests MUST Achieve 100% Success Rate

所有 E2E 测试 MUST 稳定运行，成功率达到 100%。

#### Scenario: 测试稳定性

- **GIVEN** E2E 测试套件配置完成
- **WHEN** 运行所有 E2E 测试
- **THEN** MUST 100% 测试通过
- **AND** MUST 无超时错误
- **AND** MUST 无选择性错误

#### Scenario: 测试重试机制

- **GIVEN** 测试可能偶尔失败
- **WHEN** 配置测试重试
- **THEN** MUST 设置合理的重试次数（1-2 次）
- **AND** MUST 记录重试详情
- **AND** 最终结果 MUST 反映真实稳定性

### Requirement: Test Selectors MUST Be Stable and Reliable

测试选择器 MUST 稳定可靠，避免脆弱的选择策略。

#### Scenario: 使用数据属性选择器

- **GIVEN** 需要选择 UI 元素
- **WHEN** 编写测试选择器
- **THEN** MUST 优先使用 `data-testid` 属性
- **AND** MUST 避免使用 CSS 类名（可能变化）
- **AND** MUST 避免使用文本内容（可能国际化）

#### Scenario: 等待策略

- **GIVEN** 元素需要时间加载
- **WHEN** 测试等待元素
- **THEN** MUST 使用 `waitForSelector` 或 `waitFor`
- **AND** MUST 设置合理的超时时间
- **AND** MUST 提供清晰的等待失败消息

### Requirement: Test Data Management MUST Isolate Test State

测试数据管理 MUST 隔离测试状态，确保测试独立性。

#### Scenario: 测试前后清理

- **GIVEN** 每个测试需要独立环境
- **WHEN** 测试开始前
- **THEN** MUST 重置应用状态
- **WHEN** 测试结束后
- **THEN** MUST 清理测试数据
- **AND** MUST 不影响其他测试

#### Scenario: Mock 数据使用

- **GIVEN** 测试需要特定数据
- **WHEN** 准备测试数据
- **THEN** MUST 使用 fixtures 提供测试数据
- **AND** MUST 数据包含边界情况
- **AND** MUST 数据包含错误场景

### Requirement: Coverage Reporting MUST Include E2E Tests

覆盖率报告 MUST 包含 E2E 测试的贡献。

#### Scenario: 覆盖率收集

- **GIVEN** E2E 测试运行
- **WHEN** 测试执行完成
- **THEN** MUST 收集代码覆盖率数据
- **AND** MUST 合并到总覆盖率报告中
- **AND** MUST 区分单元测试和 E2E 测试的贡献

#### Scenario: 覆盖率目标验证

- **GIVEN** 总体覆盖率目标为 80%
- **WHEN** 运行完整测试套件
- **THEN** 单元测试 + E2E 测试覆盖率 MUST ≥ 80%
- **AND** MUST 报告各模块的覆盖率
- **AND** MUST 标记未达标的模块

### Requirement: Test Directory Structure MUST Be Clear and Organized

测试目录结构 MUST 清晰有序，便于维护和扩展。

#### Scenario: E2E 测试目录

- **GIVEN** E2E 测试文件
- **WHEN** 组织测试文件
- **THEN** MUST 存放在 `frontend/e2e/` 目录
- **AND** 文件名 MUST 以 `.spec.ts` 结尾
- **AND** MUST 按功能模块组织

#### Scenario: 测试文档

- **GIVEN** 测试目录结构
- **WHEN** 查看测试文档
- **THEN** MUST 包含 `frontend/e2e/README.md`
- **AND** MUST 说明如何运行 E2E 测试
- **AND** MUST 说明测试场景和覆盖范围
