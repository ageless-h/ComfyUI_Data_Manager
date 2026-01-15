## ADDED Requirements

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
