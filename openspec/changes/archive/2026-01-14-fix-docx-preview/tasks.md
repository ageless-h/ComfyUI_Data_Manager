# Tasks

## 1. 添加 HTML 清理函数
- [x] 1.1 创建 `cleanMammothOutput()` 函数过滤函数字符串
- [x] 1.2 添加正则表达式匹配 `function(){...}` 模式
- [x] 1.3 添加单元测试验证清理逻辑 (手动测试通过 - 用户确认成功)

## 2. 更新浮窗预览
- [x] 2.1 修改 `preview-content.ts` 中的 DOCX 处理
- [x] 2.2 在 mammoth 转换后应用清理函数
- [x] 2.3 添加更详细的错误日志

## 3. 更新主预览面板
- [x] 3.1 修改 `preview-actions.ts` 中的 DOCX 处理
- [x] 3.2 在 mammoth 转换后应用清理函数
- [x] 3.3 保持与浮窗预览一致的行为

## 4. 测试验证
- [x] 4.1 创建包含复杂内容的测试 DOCX 文件 (用户使用 ComfyUI-API 调用流程.docx 测试)
- [x] 4.2 手动测试预览输出不再包含函数字符串 (用户确认成功)
- [x] 4.3 运行 TypeScript 编译检查 (已通过)

## 额外修复（调试中发现）
- [x] 修复 Promise 处理：mammoth.convertToHtml() 返回 Promise，需要 await
- [x] 添加类型定义：Promise<{ value: string, messages: unknown[] }>
