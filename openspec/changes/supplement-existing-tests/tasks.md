# 任务列表: 补充现有组件测试

> **提案 ID**: `supplement-existing-tests`

---

## Phase 1: 补充 preview.test.ts 测试

### 1.1 添加 `checkNodeConnectionAndUpdateFormat` 测试

- [x] `should detect InputPathConfig nodes`
- [x] `should find file_input connection`
- [x] `should call detectTypeFromSourceNode when connected`
- [x] `should update format selector with detected type`
- [x] `should handle missing window.app gracefully`
- [x] `should handle missing graph gracefully`
- [x] `should log error on exception`

### 1.2 添加 `detectTypeFromSourceNode` 测试

> 注: 这是内部函数，需要间接测试或导出测试

- [x] `should detect IMAGE type from LoadImage node`
- [x] `should detect VIDEO type from LoadVideo node`
- [x] `should detect AUDIO type from LoadAudio node`
- [x] `should detect LATENT type from EmptyLatentImage`
- [x] `should detect type from output ports`
- [x] `should return default IMAGE type for unknown nodes`
- [x] `should handle node with no outputs`
- [x] `should handle node with type property`
- [x] `should handle node with comfyClass property`

### 1.3 增强 `createPreviewPanel` 测试

- [x] `should create preview with placeholder content`
- [x] `should create file info section`
- [x] `should create format section with initial hidden state`
- [x] `should apply theme colors correctly`
- [x] `should have all action buttons with correct IDs`

### 1.4 增强 `createStatusBar` 测试

- [x] `should create dock element`
- [x] `should create bottom area container`
- [x] `should update connection indicator for active state`
- [x] `should update connection indicator for inactive state`
- [x] `should display SSH connection status when active`
- [x] `should handle setTimeout delayed update`

---

## Phase 2: 补充 settings.test.ts 测试

### 2.1 添加 `createSettingsInput` 测试

- [x] `should create input with label`
- [x] `should create text input field`
- [x] `should create number input field`
- [x] `should create password input field`
- [x] `should apply correct placeholder`
- [x] `should apply theme styles`

### 2.2 添加 `showConnectionForm` 测试

- [x] `should create form with all input fields`
- [x] `should create back button`
- [x] `should create save credentials checkbox`
- [x] `should create connect button`
- [x] `should navigate back to list on back button click`
- [x] `should validate host and username before connect`
- [x] `should show alert on validation failure`

### 2.3 添加连接流程测试

- [x] `should call sshConnect on button click`
- [x] `should save credentials when checkbox checked`
- [x] `should call onConnect callback on success`
- [x] `should close panel on successful connection`
- [x] `should show alert on connection failure`
- [x] `should re-enable button on failure`
- [x] `should handle invalid port number`

### 2.4 添加 `renderSavedCredentialsList` 测试

- [x] `should show loading message initially`
- [x] `should render empty state when no credentials`
- [x] `should render credential items`
- [x] `should display credential name and host info`
- [x] `should display creation date if available`
- [x] `should prompt for password on credential click`
- [x] `should call sshConnect with saved credentials`
- [x] `should handle API errors gracefully`

### 2.5 添加删除凭证测试

- [x] `should show delete button for each credential`
- [x] `should show confirm dialog before delete`
- [x] `should call sshDeleteCredential on confirm`
- [x] `should reload list after successful delete`
- [x] `should show alert on delete failure`
- [x] `should stop event propagation on delete click`

### 2.6 添加交互测试

- [x] `should handle hover effect on credential items`
- [x] `should close panel on close button click`
- [x] `should close panel on overlay click`
- [x] `should not close when clicking panel content`

---

## Phase 3: 验证和文档

- [x] 运行 `npm test` 验证所有测试通过
- [x] 运行 `npm run test:coverage` 生成覆盖率报告
- [x] 验证 preview.test.ts 覆盖率 >= 75%
- [x] 验证 settings.test.ts 覆盖率 >= 60%
- [x] 更新测试文档记录新增测试模式
- [x] 提交代码变更

---

## 测试结果

### 测试通过率
- **357 个测试通过** (100% 通过率)
- 0 个测试失败

### 新增测试用例
- preview.test.ts: 新增 ~34 个测试
- settings.test.ts: 新增 ~30 个测试

### 修复记录
- 修复了 browser.test.ts 中文件类型检测 mock 的问题
- 修复了 preview.test.ts 中错误日志测试的 mock 对象问题
- 修复了 actions.test.ts 中导航测试的异步等待和 SSH 状态清理问题

### 测试模式参考

#### Mock window.app 图结构

```typescript
vi.stubGlobal('window', {
  ...globalThis.window,
  app: {
    graph: {
      _nodes: [
        { comfyClass: 'InputPathConfig', inputs: [
          { name: 'file_input', link: { origin_id: 1 } }
        ]}
      ],
      getNodeById: (id: number) => ({ type: 'LoadImage', outputs: [{ type: 'IMAGE' }] })
    }
  }
})
```

#### Mock prompt/alert

```typescript
const mockPrompt = vi.fn(() => 'password')
global.prompt = mockPrompt

const mockAlert = vi.fn()
global.alert = mockAlert
```

#### Mock confirm

```typescript
const mockConfirm = vi.fn(() => true)
global.confirm = mockConfirm
```
