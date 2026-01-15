# Change: 添加批量处理功能的端到端测试

## Why

批量文件处理功能（`OutputPathConfig` Match 模式和 `InputPathConfig` Batch 模式）已实现，但缺乏验证其正确性的端到端测试。需要创建测试来验证批量处理是否真正完成，确保：
1. Match 模式能正确扫描和返回文件列表
2. Batch 模式能正确接收迭代数据并批量保存
3. ComfyUI 的自动迭代机制正常工作
4. 批量处理不会导致内存堆积

## What Changes

- **新增**：批量处理测试套件，包含完整的端到端测试工作流
- **新增**：API 工作流 JSON 文件，用于 ComfyUI 执行批量图像处理（100张图像缩小10倍）
- **新增**：测试验证脚本，检查批量处理的输出结果
- **测试范围**：
  - OutputPathConfig Match 模式：通配符扫描文件
  - InputPathConfig Batch 模式：命名规则批量保存
  - 完整工作流：批量加载 → 处理 → 批量保存
  - 内存安全：验证不会一次性加载所有文件

## Impact

- Affected specs: `batch-testing` (新 capability)
- Affected code:
  - `backend/tests/test_batch_processing.py` (新增)
  - `backend/tests/fixtures/batch_test_workflow.json` (新增)
  - `backend/tests/fixtures/batch_test_images/` (新增，100张测试图像)
- Dependencies: ComfyUI API (用于执行工作流)
