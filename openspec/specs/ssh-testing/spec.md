# ssh-testing Specification

## Purpose
TBD - created by archiving change add-ssh-testing. Update Purpose after archive.
## Requirements
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

### Requirement: SSH 凭证 MUST 保存到服务器本地加密文件

SSH 连接凭证 MUST 保存到服务器的本地加密文件中，而非浏览器存储。

#### Scenario: 保存凭证到服务器
- **GIVEN** 用户勾选"保存凭证"选项并成功建立 SSH 连接
- **WHEN** 连接建立后
- **THEN** 凭证 MUST 加密后保存到服务器本地文件
- **AND** 文件路径为 `~/.comfyui/datamanager/ssh_credentials.json`
- **AND** 密码 MUST 使用 base64 编码加密

#### Scenario: 从服务器加载凭证列表
- **GIVEN** 用户打开 SSH 连接对话框
- **WHEN** 对话框初始化时
- **THEN** MUST 自动从服务器加载已保存的凭证列表
- **AND** 凭证列表 MUST 显示为可选择的下拉菜单

#### Scenario: 删除已保存的凭证
- **GIVEN** 用户在设置中查看已保存的凭证
- **WHEN** 用户点击删除某个凭证
- **THEN** 该凭证 MUST 从服务器文件中移除
- **AND** 前端界面 MUST 更新显示剩余凭证

### Requirement: 凭证存储 MUST 支持多用户隔离

凭证存储 MUST 支持不同用户/环境之间的隔离。

#### Scenario: 凭证文件路径配置
- **GIVEN** 系统初始化时
- **WHEN** 确定凭证存储路径
- **THEN** 路径 SHOULD 可通过环境变量配置
- **AND** 默认路径为 `~/.comfyui/datamanager/ssh_credentials.json`
- **AND** 目录不存在时 MUST 自动创建

#### Scenario: 凭证文件不存在时的处理
- **GIVEN** 凭证文件不存在
- **WHEN** 尝试加载凭证
- **THEN** MUST 返回空凭证列表
- **AND** 不应抛出错误

### Requirement: 凭证管理界面 MUST 提供完整的管理功能

用户 MUST 能够通过设置界面管理已保存的 SSH 凭证。

#### Scenario: 查看已保存的凭证
- **GIVEN** 用户打开设置页面
- **WHEN** SSH 设置部分加载完成
- **THEN** MUST 显示所有已保存的凭证列表
- **AND** 每个凭证 MUST 显示：名称、主机、端口、用户名、保存时间

#### Scenario: 删除不需要的凭证
- **GIVEN** 用户在设置页面查看已保存凭证
- **WHEN** 用户点击某个凭证的删除按钮
- **THEN** MUST 显示确认对话框
- **AND** 确认后从服务器删除该凭证
- **AND** 界面 MUST 移除该凭证的显示

### Requirement: 凭证存储 MUST 向后兼容浏览器存储

为了平滑过渡，系统 MUST 支持浏览器存储作为备选方案。

#### Scenario: 优先使用服务器存储
- **GIVEN** 服务器存储 API 可用
- **WHEN** 保存或加载凭证
- **THEN** MUST 优先使用服务器存储
- **AND** 服务器存储失败时才降级到 localStorage

#### Scenario: 浏览器存储迁移
- **GIVEN** localStorage 中有旧凭证
- **WHEN** 用户首次使用新版本
- **THEN** SHOULD 提示是否迁移到服务器存储
- **AND** 迁移后清除 localStorage 中的凭证

