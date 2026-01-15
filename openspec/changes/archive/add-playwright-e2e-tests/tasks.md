# 任务：添加 Playwright E2E 测试并提高覆盖率

## 阶段 1：Playwright 设置

- [x] 1.1 安装 Playwright 和依赖
- [x] 1.2 创建 playwright.config.ts 配置文件
- [x] 1.3 配置测试浏览器（Chromium, Firefox, WebKit）
- [x] 1.4 添加 E2E 测试脚本到 package.json
- [ ] 1.5 验证 Playwright 安装成功

## 阶段 2：测试目录结构重组

- [x] 2.1 创建 `frontend/tests/` 目录结构
- [x] 2.2 创建 `frontend/tests/unit/` 子目录
- [x] 2.3 创建 `frontend/tests/components/` 子目录
- [x] 2.4 创建 `frontend/tests/fixtures/` 测试数据目录
- [ ] 2.5 迁移现有单元测试到新目录
- [ ] 2.6 更新 vitest.config.ts 中的测试路径
- [x] 2.7 创建测试文档 README.md

## 阶段 3：E2E 测试实现

- [x] 3.1 创建 `file-manager.spec.ts`（文件管理器操作）
- [x] 3.2 创建 `settings.spec.ts`（设置面板）
- [x] 3.3 创建 `preview.spec.ts`（文件预览）
- [x] 3.4 添加测试数据和 fixtures
- [x] 3.5 配置测试超时和重试
- [ ] 3.6 验证所有 E2E 测试通过（100% 成功率）

## 阶段 4：补充单元测试

- [ ] 4.1 补充 `api/` 模块单元测试（目标 85%）
- [ ] 4.2 补充 `utils/` 模块单元测试（目标 90%）
- [ ] 4.3 补充 `core/` 模块单元测试（目标 80%）
- [ ] 4.4 补充 `ui/components/` 组件测试（目标 75%）
- [ ] 4.5 添加边界情况和错误处理测试

## 阶段 5：配置与文档

- [x] 5.1 更新 vitest.config.ts 覆盖率阈值为 80%
- [x] 5.2 创建 `frontend/tests/README.md` 文档
- [x] 5.3 创建 `frontend/e2e/README.md` 文档
- [x] 5.4 更新项目 README.md 测试说明
- [ ] 5.5 添加 CI/CD 工作流配置

## 阶段 6：验证与清理

- [ ] 6.1 运行完整测试套件（Vitest + Playwright）
- [ ] 6.2 生成覆盖率报告并验证 ≥ 80%
- [ ] 6.3 确认所有测试通过（100% 成功率）
- [ ] 6.4 清理临时文件和旧测试文件
- [ ] 6.5 更新提案状态
