# Tasks

## 1. 代码分析与准备
- [ ] 1.1 阅读 `frontend/src/ui/floating/window.ts` 完整代码
- [ ] 1.2 确认所有重复代码位置
- [ ] 1.3 列出所有魔法数字

## 2. 提取配置常量
- [ ] 2.1 创建 `FLOATING_WINDOW_CONSTANTS` 配置对象
- [ ] 2.2 提取尺寸相关常量（width, height, fontSize 等）
- [ ] 2.3 提取图标路径和 CSS 类名常量

## 3. 重构字体大小控制
- [ ] 3.1 合并 `addDocumentFontSizeControls()` 和 `addCodeFontSizeControls()` 为单一函数
- [ ] 3.2 使用参数区分文档和代码字体控制
- [ ] 3.3 验证功能一致性

## 4. 简化函数参数
- [ ] 4.1 为 `openFloatingPreview()` 定义选项接口
- [ ] 4.2 重构函数签名使用选项对象
- [ ] 4.3 更新所有调用点

## 5. 缓存优化
- [ ] 5.1 创建主题变量缓存函数
- [ ] 5.2 替换重复的 `getComputedStyle` 调用

## 6. 提取可复用组件
- [ ] 6.1 创建通用按钮创建函数
- [ ] 6.2 重构工具栏按钮使用通用函数
- [ ] 6.3 提取事件处理器为命名函数

## 7. 状态管理优化
- [ ] 7.1 创建模块级状态对象
- [ ] 7.2 迁移 `window.floatingPreviewState` 到模块状态
- [ ] 7.3 更新所有状态访问点

## 8. 验证与测试
- [ ] 8.1 运行 TypeScript 编译检查
- [ ] 8.2 运行 Prettier 格式化
- [ ] 8.3 手动测试浮窗功能
- [ ] 8.4 运行 ESLint 检查
