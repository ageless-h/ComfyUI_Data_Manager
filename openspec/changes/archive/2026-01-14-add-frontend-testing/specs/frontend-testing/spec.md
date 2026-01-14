# Frontend Testing Specification

## ADDED Requirements

### Requirement: Test Framework Configuration MUST Support Vitest

系统 MUST 配置 Vitest 测试框架，支持 TypeScript、Happy DOM 环境和覆盖率报告。

#### Scenario: Valid configuration file exists

- **GIVEN** 项目使用 Vite 构建
- **WHEN** 开发者运行测试命令
- **THEN** vitest.config.ts 必须存在于 `frontend/` 目录
- **AND** 配置必须包含 happy-dom 环境和覆盖率设置

#### Scenario: Test scripts are available

- **GIVEN** package.json 包含测试脚本
- **WHEN** 开发者运行 `npm run test`
- **THEN** 必须执行所有测试文件
- **AND** 必须以人类可读的格式输出结果

### Requirement: Unit Test Coverage for Utilities MUST Achieve 70%

工具函数 MUST 有单元测试覆盖，覆盖率至少达到 70%。

#### Scenario: Format utility tests

- **GIVEN** utils/format.ts 包含格式化函数
- **WHEN** 运行测试套件
- **THEN** 必须测试 formatSize() 函数
- **AND** 必须测试 escapeHtml() 函数
- **AND** 必须包含边界情况（0 字节、负数等）

#### Scenario: File-type utility tests

- **GIVEN** utils/file-type.ts 包含文件类型检测
- **WHEN** 运行测试套件
- **THEN** 必须测试 getFileType() 函数
- **AND** 必须覆盖所有已知文件扩展名
- **AND** 必须测试未知扩展名的默认行为

#### Scenario: Drag utility tests

- **GIVEN** utils/drag.ts 包含拖拽功能
- **WHEN** 运行测试套件
- **THEN** 必须测试 setupWindowDrag() 函数
- **AND** 必须模拟鼠标事件验证拖拽行为

### Requirement: API Endpoint Testing MUST Use Mocks

API 端点 MUST 有模拟测试，验证请求格式和错误处理。

#### Scenario: File API endpoint tests

- **GIVEN** api/endpoints/file.ts 包含 API 函数
- **WHEN** 运行测试套件
- **THEN** 必须测试 listDirectory() 函数
- **AND** 必须测试 getFileInfo() 函数
- **AND** 必须使用 vi.fn.mockGlobal('fetch') 模拟网络请求
- **AND** 必须测试成功和错误两种情况

#### Scenario: Error handling tests

- **GIVEN** API 调用可能失败
- **WHEN** 模拟 404、403、500 等错误响应
- **THEN** 必须验证正确的错误抛出
- **AND** 必须验证错误消息格式

### Requirement: State Management Testing MUST Ensure Correct Data Flow

状态管理 MUST 有测试确保数据流正确。

#### Scenario: FileManagerState tests

- **GIVEN** core/state.ts 包含状态管理
- **WHEN** 运行测试套件
- **THEN** 必须测试状态初始化
- **AND** 必须测试状态更新方法
- **AND** 必须测试订阅/通知机制

#### Scenario: State persistence tests

- **GIVEN** 状态支持 localStorage 持久化
- **WHEN** 状态发生变化
- **THEN** 必须验证 localStorage 正确更新
- **AND** 必须测试重新加载后状态恢复

### Requirement: Component Testing MUST Cover Basic Functionality

UI 组件 MUST 有基本的功能测试。

#### Scenario: Component rendering tests

- **GIVEN** 一个 UI 组件
- **WHEN** 组件被渲染
- **THEN** 必须验证生成的 DOM 结构正确
- **AND** 必须验证事件处理器正确绑定

#### Scenario: Component interaction tests

- **GIVEN** 一个交互式组件
- **WHEN** 用户触发交互（点击、输入等）
- **THEN** 必须验证组件状态正确更新
- **AND** 必须验证 DOM 正确反映状态变化

### Requirement: CI/CD Automation MUST Run Tests Automatically

CI/CD 流程 MUST 自动运行测试并报告结果。

#### Scenario: Pull Request testing

- **GIVEN** 开发者创建 Pull Request
- **WHEN** GitHub Actions 工作流触发
- **THEN** 必须运行完整测试套件
- **AND** 必须在 PR 页面显示测试结果
- **AND** 必须包含覆盖率报告

#### Scenario: Coverage threshold

- **GIVEN** 配置了覆盖率阈值
- **WHEN** 运行测试
- **THEN** 如果覆盖率低于 70%，必须返回失败状态
- **AND** 必须在日志中显示实际覆盖率

### Requirement: Mock Strategy MUST Isolate External Dependencies

MUST 正确 mock 外部依赖以隔离测试。

#### Scenario: ComfyUI API mocking

- **GIVEN** 测试需要与 ComfyUI API 交互
- **WHEN** 编写测试
- **THEN** 必须使用 vi.mock() mock app.js
- **AND** 必须提供符合 API 的 mock 数据

#### Scenario: Fetch API mocking

- **GIVEN** 测试需要网络请求
- **WHEN** API 函数调用 fetch
- **THEN** 必须使用 vi.stubGlobal('fetch', vi.fn()) 模拟
- **AND** 必须在测试后恢复原始实现

### Requirement: Test File Organization MUST Mirror Source Structure

测试文件 MUST 与源代码文件组织一致。

#### Scenario: Co-location test files

- **GIVEN** 源代码文件位于 frontend/src/
- **WHEN** 创建测试文件
- **THEN** 测试文件必须与源文件同名并添加 .test.ts 后缀
- **AND** 必须位于同一目录下
- **例如**: utils/format.ts → utils/format.test.ts

#### Scenario: Test file structure

- **GIVEN** 一个测试文件
- **WHEN** 编写测试
- **THEN** 必须使用 describe() 分组相关测试
- **AND** 必须使用 it() 定义单个测试场景
- **AND** 必须使用 describe() 按功能模块组织

### Requirement: Development Experience MUST Support Watch and Debug

测试 MUST 提供良好的开发体验。

#### Scenario: Watch mode

- **GIVEN** 开发者修改代码
- **WHEN** 运行 `npm run test:watch`
- **THEN** 必须自动重新运行相关测试
- **AND** 必须在终端显示实时结果

#### Scenario: Debugging support

- **GIVEN** 测试失败需要调试
- **WHEN** 使用 Vitest UI 或调试器
- **THEN** 必须支持断点调试
- **AND** 必须显示变量状态
