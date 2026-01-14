# Change: Add SSH Remote Connection Testing

## Why

当前 SSH 远程连接功能已实现但缺少完整的测试覆盖：

1. **后端测试缺失**: `utils/ssh_fs.py` 和 `api/routes/ssh.py` 没有对应的单元测试
2. **前端测试缺失**: `frontend/src/api/ssh.ts` 和 SSH 相关 UI 组件没有测试
3. **集成测试缺失**: 缺少端到端的 SSH 连接测试流程
4. **测试环境问题**: 用户提供的测试服务器 (`wp08.unicorn.org.cn:19269`) 需要在测试中考虑

SSH 连接功能涉及网络操作和外部依赖，需要专门的测试策略来确保：
- 连接管理的正确性（连接、断开、重连）
- 文件操作的可靠性（上传、下载、列表、删除）
- 错误处理的健壮性（认证失败、网络超时、权限问题）
- 凭据存储的安全性

## What Changes

- **新增后端测试**: 使用 pytest 测试 `utils/ssh_fs.py` 和 `api/routes/ssh.py`
- **新增前端测试**: 使用 Vitest 测试 `frontend/src/api/ssh.ts` 和 SSH UI 组件
- **测试基础设施**: 创建 SSH 测试服务器配置和 mock 策略
- **集成测试**: 端到端测试 SSH 连接和文件操作流程

## Impact

- **Affected specs**: 新建 `specs/ssh-remote-connection/spec.md`
- **Affected code**:
  - `utils/ssh_fs.py` - 新增单元测试
  - `api/routes/ssh.py` - 新增 API 测试
  - `frontend/src/api/ssh.ts` - 新增 API 客户端测试
  - `frontend/src/ui/components/settings.ts` - 新增 UI 测试
- **Breaking changes**: 无
- **Dependencies**: 新增测试相关依赖（pytest-mock 用于后端，已有 Vitest 用于前端）
- **Testing**: 需要访问测试 SSH 服务器或使用 mock

## Notes

- 用户提供的测试服务器: `pzXtQg@wp08.unicorn.org.cn:19269` (密码: `voIXAEVYjn`)
- 测试策略应同时支持真实连接测试和 mock 测试
- CI/CD 环境中应使用 mock，本地测试可选择真实连接
