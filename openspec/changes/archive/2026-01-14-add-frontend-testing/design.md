# Design: Frontend Testing Infrastructure

## Context

ComfyUI Data Manager 是一个 ComfyUI 扩展，提供文件管理功能。前端使用 TypeScript + Vite 构建，与 ComfyUI 的沙箱环境紧密集成。

**约束**：
- 必须与 ComfyUI 的 app.js 沙箱环境兼容
- 前端构建产物输出到 `web/` 目录
- 无服务端渲染，纯客户端应用

**利益相关者**：
- 开发者：需要快速验证修改是否破坏现有功能
- 用户：需要稳定的 UI 体验

## Goals / Non-Goals

**Goals**:
- 为核心工具函数提供单元测试覆盖
- 为 API 端点提供模拟测试
- 为状态管理提供测试
- 建立自动化 CI/CD 流程
- 测试覆盖率目标：70%+

**Non-Goals**:
- 端到端浏览器测试（初期不包含）
- 视觉回归测试
- 性能基准测试
- 后端 Python 代码测试（已有独立方案）

## Decisions

### 1. 测试框架选择：Vitest

**Decision**: 使用 Vitest 而非 Jest

**理由**：
- 与 Vite 生态无缝集成
- 更快的 TypeScript 类型检查
- ESM 原生支持，无需配置转换
- 兼容 Jest API，迁移成本低

**替代方案**：
- Jest：需要额外配置才能与 Vite ESM 兼容
- Mocha：配置更复杂，API 集成度低

### 2. 测试环境：Happy DOM

**Decision**: 使用 happy-dom 作为 DOM 环境

**理由**：
- 轻量级，比 JSDOM 快 10-100 倍
- 更好的标准兼容性
- 与 Vitest 集成良好

**替代方案**：
- JSDOM：速度慢，内存占用高
- Puppeteer/Playwright：适合 E2E，单元测试过重

### 3. 覆盖率工具：V8 (Vitest 内置)

**Decision**: 使用 V8 内置覆盖率，不使用 Istanbul

**理由**：
- 零配置，开箱即用
- 更准确的实际覆盖率
- 性能更好

### 4. 测试组织结构

```
frontend/src/
├── api/
│   └── endpoints/
│       └── file.test.ts          # API 端点测试
├── core/
│   ├── state.test.ts              # 状态管理测试
│   └── constants.test.ts          # 常量测试
├── ui/
│   ├── components/
│   │   └── *.test.ts              # 组件测试
│   └── floating/
│       └── window.test.ts         # 浮动窗口测试
└── utils/
    ├── format.test.ts             # 格式化工具测试
    ├── file-type.test.ts          # 文件类型测试
    └── drag.test.ts               # 拖拽工具测试
```

### 5. Mock 策略

**Decision**: 使用 Vitest 的 vi.mock() 进行模块 mock

**Mock 层级**：
- `fetch`: 全局 mock，模拟 API 响应
- ComfyUI API: mock app.js 和 comfy_api
- DOM: 使用 happy-dom，不需要 mock

### 6. CI/CD 配置

**Decision**: 使用 GitHub Actions，仅在 PR 时运行完整测试

**工作流**：
```yaml
on: [pull_request]
steps:
  - npm install
  - npm run test:ci
  - npm run test:coverage
```

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| ComfyUI 沙箱环境兼容性问题 | 使用 mock 隔离 ComfyUI API 依赖 |
| 测试运行时间过长 | 使用单元测试为主，避免重度 DOM 测试 |
| Mock 维护成本 | 保持 mock 简单，优先测试纯函数 |
| 覆盖率目标过高导致测试质量下降 | 聚焦核心路径，接受 70% 覆盖率 |

## Migration Plan

**阶段 1: 基础设施** (1-2 天)
1. 安装 vitest、happy-dom、@vitest/ui
2. 创建 vitest.config.ts
3. 配置 package.json 测试脚本
4. 创建第一个示例测试

**阶段 2: 单元测试** (3-5 天)
1. 工具函数测试 (utils/)
2. API 端点测试 (api/)
3. 状态管理测试 (core/)
4. 验证覆盖率 > 70%

**阶段 3: 组件测试** (2-3 天)
1. UI 组件基础测试
2. 浮动窗口测试
3. 设置测试

**阶段 4: CI/CD** (1 天)
1. 创建 GitHub Actions workflow
2. 配置覆盖率报告
3. 设置 PR 检查

**回滚计划**：
- 删除 `frontend/vitest.config.ts`
- 删除所有 `*.test.ts` 文件
- 移除 package.json 中的测试依赖

## Open Questions

1. **是否需要 @testing-library 库？**
   - 决定：初期不使用，直接操作 DOM 更轻量
   - 后续如果组件复杂度增加可引入

2. **是否需要测试 ComfyUI 集成？**
   - 决定：不测试真实集成，使用 mock 隔离
   - 集成测试留给手动 QA

3. **是否需要可视化测试？**
   - 决定：不包含在初期范围
   - 如果 UI 复杂度增加可考虑添加

4. **CI 失败是否阻止合并？**
   - 决定：初期设置为警告，稳定后改为阻止
