# Tasks: 批量处理测试实现

## 1. 测试环境准备
- [x] 1.1 创建测试目录结构 `backend/tests/fixtures/batch_test_images/`
- [x] 1.2 生成 100 张测试图像（512x512 PNG，带编号）
- [x] 1.3 创建 API 工作流 JSON 文件 `batch_test_workflow.json`

## 2. 测试代码实现
- [x] 2.1 创建 `backend/tests/test_batch_processing.py`
- [x] 2.2 实现 `test_match_mode()` - 测试 OutputPathConfig Match 模式
- [x] 2.3 实现 `test_batch_mode()` - 测试 InputPathConfig Batch 模式
- [x] 2.4 实现 `test_end_to_end_workflow()` - 测试完整工作流

## 3. 验证脚本
- [x] 3.1 创建 `backend/tests/verify_batch_output.py` 验证脚本
- [x] 3.2 实现输出文件数量检查
- [x] 3.3 实现文件尺寸验证（缩小10倍）
- [x] 3.4 实现命名规则验证

## 4. 测试执行与清理
- [x] 4.1 运行测试并收集结果
- [x] 4.2 通知用户检验结果
- [x] 4.3 用户确认通过后保留测试代码
- [x] 4.4 删除测试图像文件
- [x] 4.5 归档变更到 `openspec/changes/archive/`
