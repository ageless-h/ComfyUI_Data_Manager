# Design: SSH Remote Connection Testing

## Architecture Overview

SSH 测试分为三个层次：

```
┌─────────────────────────────────────────────────────────────┐
│                      Integration Tests                       │
│                    (真实 SSH 服务器连接)                      │
│  测试完整的连接流程、文件操作、错误恢复                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Unit Tests                            │
│                    (Mock SSH 服务器)                         │
│  测试各模块的独立功能：连接管理、文件操作、API 端点            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Component Tests                          │
│                  (前端 UI 组件测试)                            │
│  测试 SSH 设置面板、连接表单、状态显示                         │
└─────────────────────────────────────────────────────────────┘
```

## Testing Strategy

### 1. 后端测试 (Python + pytest)

**文件结构**:
```
tests/
├── test_ssh_fs.py          # SSH 文件系统操作测试
├── test_ssh_routes.py      # SSH API 路由测试
└── fixtures/
    └── ssh_mock.py         # SSH 连接 mock 工具
```

**Mock 策略**:
- 使用 `unittest.mock.Mock` 模拟 `paramiko.SSHClient`
- 测试正常流程和异常情况（认证失败、连接超时、权限错误）
- 测试连接池管理（并发连接、连接清理）

### 2. 前端测试 (TypeScript + Vitest)

**文件结构**:
```
frontend/src/
├── api/ssh.test.ts         # SSH API 客户端测试
└── ui/components/settings.test.ts  # SSH 设置面板测试
```

**Mock 策略**:
- 使用 `vi.fn()` 模拟 fetch API
- 测试 API 调用参数和响应处理
- 测试 UI 交互和状态更新

### 3. 集成测试

**测试环境配置**:
```yaml
# tests/config.yaml
ssh_test_server:
  host: wp08.unicorn.org.cn
  port: 19269
  username: pzXtQg
  password: voIXAEVYjn  # 仅用于本地测试，CI 中使用环境变量
```

**测试覆盖场景**:
1. 连接成功 → 列出目录 → 下载文件 → 断开连接
2. 认证失败处理
3. 网络超时重试
4. 文件上传/下载进度回调
5. 并发连接管理

## Trade-offs

### Mock vs 真实连接

| 方案 | 优点 | 缺点 |
|------|------|------|
| 全部 Mock | 快速、稳定、无需外部依赖 | 可能遗漏真实环境问题 |
| 真实连接 | 测试真实场景 | 依赖外部服务、较慢 |
| 混合方案 | 兼顾速度和覆盖率 | 需要维护两套测试 |

**选择**: 混合方案
- 单元测试使用 Mock（快速反馈）
- 集成测试使用真实连接（可选，通过环境变量控制）

### 凭据管理

- 密码通过环境变量 `SSH_TEST_PASSWORD` 传递
- CI 环境中跳过需要真实密码的测试
- 本地开发时可以选择运行真实连接测试

## Implementation Notes

1. **paramiko 可选依赖**: 测试需要处理 paramiko 未安装的情况
2. **线程安全**: SSH 连接池使用线程锁，测试需要验证并发安全性
3. **连接清理**: 每个测试后确保断开所有连接，避免状态泄漏
4. **超时设置**: 测试使用较短的超时时间，快速失败

## Dependencies

### 后端
- `pytest` - 测试框架
- `pytest-mock` - Mock 支持
- `pytest-asyncio` - 异步测试支持（已有）

### 前端
- `vitest` - 已配置
- `happy-dom` - 已配置

## Success Criteria

1. 后端 SSH 模块测试覆盖率 ≥ 80%
2. 前端 SSH API 测试覆盖率 ≥ 80%
3. 所有 SSH 相关 UI 组件有基础测试
4. 集成测试可以连接到真实服务器并执行基本操作
5. CI/CD 中所有测试通过（使用 Mock）
