# Tasks

## 1. 后端凭证存储实现
- [ ] 1.1 创建 `backend/helpers/ssh_credentials.py` 模块
- [ ] 1.2 实现凭证加密存储（使用 base64 或更安全的加密）
- [ ] 1.3 实现凭证 CRUD 操作（保存、加载、删除、列表）
- [ ] 1.4 添加凭证文件路径配置

## 2. 后端 API 端点
- [ ] 2.1 添加 `POST /dm/ssh/credentials/save` 保存凭证
- [ ] 2.2 添加 `GET /dm/ssh/credentials/list` 获取凭证列表
- [ ] 2.3 添加 `DELETE /dm/ssh/credentials/delete` 删除凭证
- [ ] 2.4 添加错误处理和日志记录

## 3. 前端 API 集成
- [ ] 3.1 在 `frontend/src/api/ssh.ts` 添加凭证 API 调用函数
- [ ] 3.2 定义 TypeScript 接口类型
- [ ] 3.3 添加错误处理逻辑

## 4. 前端 UI 更新
- [ ] 4.1 修改 `ssh-dialog.ts` 使用后端 API 保存凭证
- [ ] 4.2 修改 `settings.ts` 添加凭证管理界面
- [ ] 4.3 添加"已保存的凭证"列表和删除功能

## 5. 测试验证
- [ ] 5.1 测试凭证保存和加载
- [ ] 5.2 测试凭证删除功能
- [ ] 5.3 测试跨浏览器凭证同步
- [ ] 5.4 运行现有 SSH 测试确保兼容性

## 6. 文档更新
- [ ] 6.1 更新 README 说明新的凭证存储方式
- [ ] 6.2 添加凭证文件位置说明
- [ ] 6.3 添加安全注意事项
