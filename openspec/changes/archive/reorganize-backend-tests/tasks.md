# 任务：重组后端测试结构并提高覆盖率

## 阶段 1：目录结构重组

- [x] 1.1 创建新的测试目录结构（unit/, integration/, e2e/, tools/）
- [x] 1.2 迁移核心节点测试到 `unit/core/`
- [x] 1.3 迁移辅助模块测试到 `unit/helpers/`
- [x] 1.4 迁移 API 路由测试到 `unit/api/`
- [x] 1.5 迁移工作流测试到 `integration/`
- [x] 1.6 移动工具脚本到 `tools/`
- [x] 1.7 更新所有导入路径
- [x] 1.8 验证所有测试通过

## 阶段 2：补充核心模块测试

- [ ] 2.1 补充 `nodes_v3.py` 单元测试（覆盖所有节点类型）
- [ ] 2.2 补充 `batch_namer.py` 单元测试（边界情况）
- [ ] 2.3 补充 `batch_scanner.py` 单元测试（模式匹配）
- [ ] 2.4 补充 `file_ops.py` 单元测试（异常处理）
- [ ] 2.5 补充 `path_utils.py` 单元测试（UNC/SSH 路径）
- [ ] 2.6 补充 `ssh_credentials.py` 单元测试
- [ ] 2.7 补充 `formatters.py` 单元测试

## 阶段 3：补充 API 测试

- [ ] 3.1 创建 `test_files_routes.py`（/dm/list, /dm/info）
- [ ] 3.2 创建 `test_operations_routes.py`（/dm/create, /dm/delete）
- [ ] 3.3 创建 `test_metadata_routes.py`（/dm/preview）
- [ ] 3.4 补充 `test_ssh_routes.py`（缺失的端点）

## 阶段 4：配置与文档

- [x] 4.1 创建 `.coveragerc` 配置文件
- [x] 4.2 创建 `pytest.ini` 配置文件
- [x] 4.3 更新 `README.md` 测试文档
- [x] 4.4 创建覆盖率报告脚本
- [ ] 4.5 运行完整测试套件并验证覆盖率

## 阶段 5：验证与清理

- [ ] 5.1 运行 coverage 生成报告
- [ ] 5.2 确认总体覆盖率 ≥ 80%
- [ ] 5.3 确认各模块覆盖率达标
- [ ] 5.4 清理临时文件
- [ ] 5.5 更新项目文档
