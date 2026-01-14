# Change: 重构前端预览浮窗代码

## Why
前端预览浮窗 (`frontend/src/ui/floating/window.ts`, 979 行) 存在多处代码重复和可维护性问题：
1. `addDocumentFontSizeControls()` 和 `addCodeFontSizeControls()` 函数有 90% 的代码重复
2. 大量魔法数字散布在代码中（如 `18`、`24`、`30`、`400` 等）
3. `openFloatingPreview()` 函数有 10 个参数（其中 8 个是布尔类型），难以维护
4. 重复调用主题变量查询而非缓存
5. 内联事件处理器不利于代码复用和测试

## What Changes
- 合并重复的字体大小控制函数为单一参数化函数
- 提取魔法数字为命名常量配置
- 使用选项对象简化函数参数
- 缓存主题变量查询结果
- 提取可复用的按钮组件创建逻辑
- 使用模块级状态替代全局 `window.floatingPreviewState`

## Impact
- 影响的 specs: `code-cleanup`
- 影响的代码: `frontend/src/ui/floating/window.ts`
- **BREAKING**: 无（仅内部重构，不改变外部 API）
