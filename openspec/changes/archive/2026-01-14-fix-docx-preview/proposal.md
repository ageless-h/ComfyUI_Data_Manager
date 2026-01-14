# Change: 修复 DOCX 预览中内部函数泄露问题

## Why
DOCX 文件预览时，mammoth.js 库在某些情况下会将内部对象引用（如 `function(){return value.call(this._target())}`）直接输出到 HTML 中，导致预览内容显示异常。这通常发生在 docx 文件包含复杂样式、图片、表格或特殊格式时。

## What Changes
- 添加 HTML 输出清理函数，过滤掉函数类型的字符串表示
- 在 mammoth 转换后对输出进行后处理
- 改进错误处理和日志记录
- 添加 DOCX 预览测试用例

## Impact
- 影响的 specs: `frontend-testing`
- 影响的代码:
  - `frontend/src/ui/floating/preview-content.ts`
  - `frontend/src/ui/components/preview-actions.ts`
- **BREAKING**: 无（仅修复 bug）
