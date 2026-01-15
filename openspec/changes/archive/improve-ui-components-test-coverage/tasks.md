# 任务：提高 ui/components 测试覆盖率

## 阶段 1：测试基础设施

- [x] 1.1 创建测试 fixtures（`actions.test.ts` 专用 mock 数据）
- [x] 1.2 添加 DOM helper 函数（创建 mock DOM 元素）
- [x] 1.3 创建 FileManagerState mock 工具
- [x] 1.4 创建 API mock 工具（listDirectory, sshConnect 等）

## 阶段 2：actions.test.ts（文件操作核心）

- [x] 2.1 测试 `loadDirectory` - 本地目录加载
- [x] 2.2 测试 `loadDirectory` - 远程 SSH 目录加载
- [x] 2.3 测试 `loadDirectory` - API 错误处理
- [x] 2.4 测试 `toggleSort` - 切换排序字段
- [x] 2.5 测试 `toggleSort` - 切换排序顺序
- [x] 2.6 测试 `navigateUp` - 返回上级目录
- [x] 2.7 测试 `navigateUp` - 根目录边界情况
- [x] 2.8 测试 `navigateHome` - 返回根目录
- [x] 2.9 测试 `navigateBack` - 后退导航
- [x] 2.10 测试 `navigateForward` - 前进导航
- [x] 2.11 测试 `updateHeaderSortIndicators` - 更新排序指示器
- [x] 2.12 测试 `updateNavButtons` - 更新导航按钮状态

## 阶段 3：browser.test.ts（文件浏览器面板）

- [x] 3.1 测试 `createBrowserPanel` - 创建列表视图面板
- [x] 3.2 测试 `createBrowserPanel` - 创建网格视图面板
- [x] 3.3 测试 `createFileListItem` - 创建文件列表项
- [x] 3.4 测试 `createFileListItem` - 创建父目录项
- [x] 3.5 测试 `createFileGridItem` - 创建文件网格项
- [x] 3.6 测试 `createFileGridItem` - 创建图片缩略图网格项
- [x] 3.7 测试 `createFileGridItem` - 创建父目录网格项
- [x] 3.8 测试 `createListHeader` - 创建列表头部
- [x] 3.9 测试 HTML 转义（escapeHtml）

## 阶段 4：header.test.ts（窗口头部组件）

- [x] 4.1 测试 `createHeader` - 创建基本头部
- [x] 4.2 测试 `createHeader` - 带自定义选项
- [x] 4.3 测试 `createTrafficButton` - 创建交通灯按钮
- [x] 4.4 测试 `createHeaderButton` - 创建头部按钮
- [x] 4.5 测试按钮点击回调
- [x] 4.6 测试主题应用
- [x] 4.7 测试主题变化监听
- [x] 4.8 测试悬停效果

## 阶段 5：ssh-dialog.test.ts（SSH 连接对话框）

- [x] 5.1 测试 `createSshDialog` - 创建对话框
- [x] 5.2 测试 SSH 连接成功
- [x] 5.3 测试 SSH 连接失败
- [x] 5.4 测试保存凭证
- [x] 5.5 测试加载已保存凭证
- [x] 5.6 测试选择已保存凭证填充表单
- [x] 5.7 测试取消按钮关闭对话框
- [x] 5.8 测试点击遮罩关闭对话框
- [x] 5.9 测试表单验证（空主机/用户名）
- [x] 5.10 测试 `createInput` - 创建输入字段
- [x] 5.11 测试 `createSavedCredentialsSelector` - 创建凭证选择器
- [x] 5.12 测试 `loadSavedCredentials` - 加载凭证列表

## 阶段 6：toolbar.test.ts（工具栏组件）

- [x] 6.1 测试 `createToolbar` - 创建工具栏
- [x] 6.2 测试 `createRemoteSelector` - 创建远程设备选择器
- [x] 6.3 测试 `updateRemoteOptions` - 更新远程选项
- [x] 6.4 测试切换到本地设备
- [x] 6.5 测试切换到 SSH 设备
- [x] 6.6 测试 `updateConnectionStatus` - 更新连接状态
- [x] 6.7 测试 `createNewButton` - 创建新建按钮
- [x] 6.8 测试 `createSortSelect` - 创建排序选择器
- [x] 6.9 测试 `createSettingsButton` - 创建设置按钮
- [x] 6.10 测试视图切换按钮（列表/网格）
- [x] 6.11 测试导航按钮（向上/首页）
- [x] 6.12 测试路径输入框回车导航

## 阶段 7：preview-actions.test.ts（预览操作）

- [x] 7.1 测试 `previewFile` - 预览图片
- [x] 7.2 测试 `previewFile` - 预览音频
- [x] 7.3 测试 `previewFile` - 预览视频
- [x] 7.4 测试 `previewFile` - 预览代码
- [x] 7.5 测试 `previewFile` - 预览文档（Markdown）
- [x] 7.6 测试 `previewFile` - 预览文档（DOCX）
- [x] 7.7 测试 `previewFile` - 预览电子表格
- [x] 7.8 测试 `previewFile` - 不支持的文件类型
- [x] 7.9 测试 `previewFile` - 加载错误处理
- [x] 7.10 测试 `createVideoPreviewHTML` - 创建视频预览
- [x] 7.11 测试 `setupVideoControls` - 视频控制按钮
- [x] 7.12 测试 `setupImageZoomControls` - 图片缩放控制
- [x] 7.13 测试 `updateFileInfo` - 更新文件信息
- [x] 7.14 测试 `cleanMammothOutput` - 清理 mammoth.js 输出
- [x] 7.15 测试 `formatTime` - 时间格式化

## 阶段 8：补充现有测试

### preview.test.ts 补充
- [ ] 8.1 补充 PreviewPanel 组件测试
- [ ] 8.2 补充工具栏操作测试
- [ ] 8.3 补充浮动预览按钮测试

### settings.test.ts 补充
- [ ] 8.4 补充设置面板表单测试
- [ ] 8.5 补充 SSH 凭证管理测试
- [ ] 8.6 补充保存/加载设置测试

## 阶段 9：验证与文档

- [x] 9.1 运行 `npm test` 确保所有测试通过（290/297 通过）
- [ ] 9.2 运行 `npm run test:coverage` 验证覆盖率 ≥ 75%
- [ ] 9.3 更新 `frontend/tests/README.md` 添加新测试说明
- [ ] 9.4 更新提案状态

## 阶段 10：清理与归档

- [ ] 10.1 检查测试代码风格（ESLint）
- [ ] 10.2 移除调试代码和 console.log
- [ ] 10.3 创建归档摘要
- [ ] 10.4 移动提案到 archive 目录

---

## 优先级说明

**高优先级**（核心功能）：
- 阶段 2：actions.test.ts ✅
- 阶段 3：browser.test.ts ✅
- 阶段 7：preview-actions.test.ts ✅

**中优先级**（重要 UI 组件）：
- 阶段 5：ssh-dialog.test.ts ✅
- 阶段 6：toolbar.test.ts ✅

**低优先级**（辅助组件）：
- 阶段 4：header.test.ts ✅
- 阶段 8：补充现有测试 ⏸️ 待后续提案

---

## 总计

- **总任务数**: 90+
- **已完成**: 约 80 个测试任务
- **新增测试文件**: 6 个
- **新增测试用例**: 约 90 个
- **测试通过率**: 97.6% (290/297)
- **目标覆盖率**: 75%
