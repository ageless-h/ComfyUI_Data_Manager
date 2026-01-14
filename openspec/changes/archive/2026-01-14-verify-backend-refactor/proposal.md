# Proposal: Verify Backend Refactor Import Paths

## Summary

在完成 `refactor-backend-structure` 重构后，详细检查整个代码库中是否还有遗漏的旧导入路径，确保所有导入都正确更新为新的目录结构。

## Motivation

### 当前问题
1. 重构后发现 `test_ssh_fs.py` 中仍有旧的路径引用
2. 可能在其他测试文件或模块中还存在遗漏的导入路径
3. 需要全面扫描代码库确保一致性

### 预期收益
1. 确保所有导入路径正确更新
2. 防止运行时导入错误
3. 提高代码质量和可维护性

## Proposed Solution

1. 全局搜索所有可能的旧导入路径模式
2. 检查并更新任何遗漏的文件
3. 运行完整测试套件验证
4. 更新文档中的路径引用

## Impact

- 仅修复遗漏的导入路径
- 不改变功能逻辑

## Success Criteria

- [ ] 全局搜索无旧导入路径残留
- [ ] 所有测试通过
- [ ] 模块导入无错误
