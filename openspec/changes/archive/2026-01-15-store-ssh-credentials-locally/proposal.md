# Change: 将 SSH 连接凭证保存到服务器本地

## Why
当前 SSH 连接凭证保存在浏览器的 localStorage 中，存在以下问题：
1. **不安全**：浏览器存储可被恶意脚本访问
2. **不持久**：清除浏览器数据会丢失凭证
3. **不共享**：不同浏览器/设备无法共享凭证
4. **不便管理**：无法在服务器端统一管理

## What Changes
- 在后端添加 SSH 凭证存储 API（保存、加载、删除、列表）
- 将加密的 SSH 凭证保存到服务器本地文件（`~/.comfyui/datamanager/ssh_credentials.json`）
- 前端改用后端 API 存储和加载凭证
- 添加凭证管理界面（查看、删除已保存的凭证）
- 支持凭证同步功能（自动从服务器加载已保存的凭证）

## Impact
- 影响的 specs: `ssh-testing`
- 影响的代码:
  - `backend/api/routes/ssh.py` - 添加凭证 CRUD API
  - `backend/helpers/ssh_credentials.py` - 凭证存储逻辑
  - `frontend/src/api/ssh.ts` - 添加凭证 API 调用
  - `frontend/src/ui/components/ssh-dialog.ts` - 改用后端存储
  - `frontend/src/ui/components/settings.ts` - 添加凭证管理界面
- **BREAKING**: 无（向后兼容，localStorage 作为备选）
