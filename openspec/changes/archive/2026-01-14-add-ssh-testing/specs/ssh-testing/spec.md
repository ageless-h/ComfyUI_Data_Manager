# SSH Testing Specification

## ADDED Requirements

### Requirement: SSH Backend Tests MUST Cover Core Functions

后端 SSH 模块 MUST 有完整的单元测试覆盖核心功能。

#### Scenario: SSH connection management tests

- **GIVEN** tests/test_ssh_fs.py 测试文件存在
- **WHEN** 运行 pytest 测试
- **THEN** 必须测试 connect() 函数
- **AND** 必须测试 disconnect() 函数
- **AND** 必须测试 get_connected_hosts() 函数
- **AND** 必须测试 is_connected() 函数

#### Scenario: SSH file operation tests

- **GIVEN** tests/test_ssh_fs.py 测试文件存在
- **WHEN** 运行 pytest 测试
- **THEN** 必须测试 list_remote_files() 函数
- **AND** 必须测试 download_remote_file() 函数
- **AND** 必须测试 upload_local_file() 函数
- **AND** 必须测试 delete_remote_file() 函数

#### Scenario: SSH error handling tests

- **GIVEN** SSH 操作可能失败
- **WHEN** 模拟错误场景
- **THEN** 必须测试认证失败场景
- **AND** 必须测试网络超时场景
- **AND** 必须测试路径不存在场景
- **AND** 必须测试权限不足场景

### Requirement: SSH Route Tests MUST Validate API Endpoints

SSH API 路由 MUST 有测试验证每个端点的行为。

#### Scenario: SSH connect endpoint tests

- **GIVEN** tests/test_ssh_routes.py 测试文件存在
- **WHEN** 测试 POST /dm/ssh/connect 端点
- **THEN** 必须测试成功连接响应
- **AND** 必须测试认证失败响应 (401)
- **AND** 必须测试参数缺失响应 (400)
- **AND** 必须测试 paramiko 未安装响应 (500)

#### Scenario: Other SSH endpoint tests

- **GIVEN** tests/test_ssh_routes.py 测试文件存在
- **WHEN** 测试其他 SSH 端点
- **THEN** 必须测试 /dm/ssh/disconnect
- **AND** 必须测试 /dm/ssh/list
- **AND** 必须测试 /dm/ssh/download
- **AND** 必须测试 /dm/ssh/upload
- **AND** 必须测试 /dm/ssh/delete
- **AND** 必须测试 /dm/ssh/hosts

### Requirement: SSH Frontend API Tests MUST Use Fetch Mock

前端 SSH API MUST 有测试使用 mock 验证行为。

#### Scenario: SSH API client tests

- **GIVEN** frontend/src/api/ssh.test.ts 测试文件存在
- **WHEN** 运行 Vitest 测试
- **THEN** 必须测试 sshConnect() 函数
- **AND** 必须测试 sshDisconnect() 函数
- **AND** 必须测试 sshList() 函数
- **AND** 必须使用 vi.fn() mock fetch API

#### Scenario: SSH API error handling tests

- **GIVEN** SSH API 可能返回错误
- **WHEN** 模拟错误响应
- **THEN** 必须测试 401 认证失败
- **AND** 必须测试 500 服务器错误
- **AND** 必须验证错误消息正确抛出

### Requirement: SSH UI Component Tests MUST Cover Basic Interactions

SSH 设置面板 MUST 有测试覆盖基本交互。

#### Scenario: SSH settings panel tests

- **GIVEN** frontend/src/ui/components/settings.test.ts 存在
- **WHEN** 运行 Vitest 测试
- **THEN** 必须测试连接表单渲染
- **AND** 必须测试保存连接功能
- **AND** 必须测试删除连接功能
- **AND** 必须测试连接按钮点击事件

### Requirement: SSH Mock Tools MUST Provide Test Utilities

测试工具 MUST 提供 SSH 相关的 mock 辅助函数。

#### Scenario: Backend mock fixtures

- **GIVEN** tests/fixtures/ssh_mock.py 文件存在
- **WHEN** 编写后端测试
- **THEN** 必须提供 Mock SSH 客户端
- **AND** 必须提供 Mock SFTP 客户端
- **AND** 必须提供测试用文件列表

#### Scenario: Frontend mock helpers

- **GIVEN** frontend/src/tests/utils/test-helpers.ts 存在
- **WHEN** 编写前端测试
- **THEN** 必须提供模拟的 SSH 连接响应
- **AND** 必须提供模拟的文件列表数据
- **AND** 必须提供模拟的错误响应

### Requirement: SSH Integration Tests MUST Support Conditional Real Server Testing

集成测试 MUST 支持通过环境变量控制的真实 SSH 服务器测试。

#### Scenario: Optional integration tests

- **GIVEN** 可访问的测试 SSH 服务器
- **WHEN** 运行集成测试
- **THEN** 必须测试完整的连接流程
- **AND** 必须测试文件上传和下载
- **AND** 必须通过环境变量控制是否运行
- **AND** CI 环境必须跳过（使用 mock）

### Requirement: SSH Test Coverage MUST Meet Threshold

SSH 测试覆盖率 MUST 达到指定阈值。

#### Scenario: Backend coverage threshold

- **GIVEN** 后端 SSH 模块测试完成
- **WHEN** 运行 pytest --cov
- **THEN** utils/ssh_fs.py 覆盖率必须 ≥ 80%
- **AND** api/routes/ssh.py 覆盖率必须 ≥ 80%

#### Scenario: Frontend coverage threshold

- **GIVEN** 前端 SSH 模块测试完成
- **WHEN** 运行 npm run test:coverage
- **THEN** frontend/src/api/ssh.ts 覆盖率必须 ≥ 80%
- **AND** SSH UI 组件必须有基本测试覆盖

### Requirement: SSH Test Documentation MUST Guide Developers

测试文档 MUST 说明如何运行和编写 SSH 测试。

#### Scenario: Testing documentation

- **GIVEN** docs/testing.md 文件存在
- **WHEN** 开发者需要了解 SSH 测试
- **THEN** 必须说明如何运行后端 SSH 测试
- **AND** 必须说明如何运行前端 SSH 测试
- **AND** 必须说明 mock 策略
- **AND** 必须说明如何配置测试服务器
