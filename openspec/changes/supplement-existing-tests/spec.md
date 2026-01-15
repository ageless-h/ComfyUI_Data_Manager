# 规范: 补充现有组件测试

> **提案 ID**: `supplement-existing-tests`

---

## 测试文件结构

```
frontend/src/ui/components/
├── preview.test.ts         # 扩展现有测试
└── settings.test.ts        # 扩展现有测试
```

---

## 测试套件组织

### preview.test.ts 新增测试套件

```typescript
describe('checkNodeConnectionAndUpdateFormat', () => {
  // 测试节点连接检测
})

describe('detectTypeFromSourceNode', () => {
  // 测试类型检测逻辑（间接测试）
})

describe('createPreviewPanel - enhanced', () => {
  // 补充现有测试
})

describe('createStatusBar - enhanced', () => {
  // 补充现有测试
})
```

### settings.test.ts 新增测试套件

```typescript
describe('createSettingsInput', () => {
  // 测试输入字段创建
})

describe('showConnectionForm', () => {
  // 测试连接表单
})

describe('connection flow', () => {
  // 测试连接流程
})

describe('renderSavedCredentialsList', () => {
  // 测试凭证列表渲染
})

describe('delete credential', () => {
  // 测试删除凭证
})

describe('settings interactions', () => {
  // 测试面板交互
})
```

---

## Mock 策略

### Window.app Mock

用于测试节点连接检测：

```typescript
interface MockNode {
  comfyClass?: string
  type?: string
  inputs?: Array<{ name?: string; link?: { origin_id?: number } }>
  outputs?: Array<{ type?: string }>
}

interface MockGraph {
  _nodes: MockNode[]
  getNodeById?: (id: number) => MockNode | undefined
}

vi.stubGlobal('window', {
  ...globalThis.window,
  app: {
    graph: {
      _nodes: [],
      getNodeById: vi.fn(),
    } as MockGraph
  }
})
```

### Alert/Prompt/Confirm Mock

```typescript
const mockAlert = vi.fn()
const mockPrompt = vi.fn(() => 'password')
const mockConfirm = vi.fn(() => true)

global.alert = mockAlert
global.prompt = mockPrompt
global.confirm = mockConfirm
```

### SSH API Mock

```typescript
vi.mock('../../api/ssh.js', () => ({
  sshConnect: vi.fn(),
  sshSaveCredential: vi.fn(),
  sshListCredentials: vi.fn(() => Promise.resolve({
    success: true,
    credentials: []
  })),
  sshDeleteCredential: vi.fn(),
}))
```

---

## 覆盖率目标

| 文件 | Statements | Branches | Functions | Lines |
|------|-----------|----------|-----------|-------|
| preview.ts | 75% | 70% | 80% | 75% |
| settings.ts | 60% | 55% | 65% | 60% |

---

## 测试命名规范

### Should 格式

```typescript
it('should [expected behavior]', () => {
  // 测试正常行为
})

it('should [expected behavior] when [condition]', () => {
  // 测试条件行为
})

it('should handle [edge case]', () => {
  // 测试边界情况
})

it('should throw error when [invalid condition]', () => {
  // 测试错误处理
})
```

### 测试场景示例

- ✅ `should detect IMAGE type from LoadImage node`
- ✅ `should show alert when validation fails`
- ✅ `should handle missing window.app gracefully`
- ✅ `should close panel on overlay click`
