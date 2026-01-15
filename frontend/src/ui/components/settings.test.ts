// -*- coding: utf-8 -*-
/**
 * Tests for Settings Panel Component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock window state
interface MockRemoteConnection {
  id?: string
  name?: string
  host?: string
  port?: number
  username?: string
  password?: string
  connection_id?: string
}

interface MockRemoteState {
  saved: MockRemoteConnection[]
  active: MockRemoteConnection | null
}

const mockRemoteState: MockRemoteState = {
  saved: [],
  active: null,
}

vi.stubGlobal('window', {
  ...globalThis.window,
  _remoteConnectionsState: mockRemoteState,
})

// Mock dependencies
vi.mock('../../utils/theme.js', () => ({
  getComfyTheme: () => ({
    bgPrimary: '#1e1e1e',
    bgSecondary: '#252526',
    bgTertiary: '#2d2d30',
    borderColor: '#3e3e42',
    textPrimary: '#cccccc',
    textSecondary: '#858585',
    inputText: '#cccccc',
    inputBg: '#3c3c3c',
    inputBorder: '#555555',
    buttonBg: '#0e639c',
    buttonHover: '#1177bb',
    dangerColor: '#f48771',
    successColor: '#4ec9b0',
    isLight: false,
  }),
}))

vi.mock('../../utils/helpers.js', () => ({
  updateStatus: vi.fn(),
}))

vi.mock('../../api/endpoints/file.js', () => ({
  listDirectory: vi.fn(() => Promise.resolve([])),
}))

// Mock SSH API
vi.mock('../../api/ssh.js', () => ({
  sshConnect: vi.fn(),
  sshSaveCredential: vi.fn(),
  sshListCredentials: vi.fn(),
  sshDeleteCredential: vi.fn(),
}))

// Mock globals
const mockAlert = vi.fn()
const mockPrompt = vi.fn(() => 'test_password')
const mockConfirm = vi.fn(() => true)

global.alert = mockAlert
global.prompt = mockPrompt
global.confirm = mockConfirm

describe('openSettingsPanel (dynamic import)', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.clearAllMocks()
    mockRemoteState.saved = []
    mockRemoteState.active = null
  })

  it('should be able to import the module', async () => {
    const settingsModule = await import('./settings.js')
    expect(settingsModule.openSettingsPanel).toBeDefined()
  })

  it('should create a panel without throwing', async () => {
    const { openSettingsPanel } = await import('./settings.js')
    expect(() => openSettingsPanel()).not.toThrow()
  })

  it('should return an HTMLElement', async () => {
    const { openSettingsPanel } = await import('./settings.js')
    const panel = openSettingsPanel()

    expect(panel).toBeInstanceOf(HTMLElement)
  })

  it('should add panel to document body', async () => {
    const { openSettingsPanel } = await import('./settings.js')
    const panel = openSettingsPanel()

    expect(document.body.contains(panel)).toBe(true)
  })

  it('should accept callbacks in options', async () => {
    const { openSettingsPanel } = await import('./settings.js')
    const onConnect = vi.fn()
    const onDisconnect = vi.fn()

    expect(() => openSettingsPanel({ onConnect, onDisconnect })).not.toThrow()
  })

  it('should handle missing options gracefully', async () => {
    const { openSettingsPanel } = await import('./settings.js')
    expect(() => openSettingsPanel()).not.toThrow()
  })

  it('should create DOM elements', async () => {
    const { openSettingsPanel } = await import('./settings.js')
    openSettingsPanel()

    // Verify DOM was modified
    expect(document.body.children.length).toBeGreaterThan(0)
  })

  it('should handle window state changes', async () => {
    mockRemoteState.saved = [
      { id: '1', name: 'Test Server', host: '192.168.1.1', port: 22, username: 'user' },
    ]

    const { openSettingsPanel } = await import('./settings.js')
    expect(() => openSettingsPanel()).not.toThrow()
  })

  it('should handle empty state', async () => {
    mockRemoteState.saved = []
    mockRemoteState.active = null

    const { openSettingsPanel } = await import('./settings.js')
    expect(() => openSettingsPanel()).not.toThrow()
  })
})

describe('Settings Panel - multiple instances', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.clearAllMocks()
    mockRemoteState.saved = []
    mockRemoteState.active = null
  })

  it('should handle creating panel multiple times', async () => {
    const { openSettingsPanel } = await import('./settings.js')

    openSettingsPanel()
    const initialCount = document.body.children.length

    openSettingsPanel()
    expect(document.body.children.length).toBeGreaterThanOrEqual(initialCount)
  })
})

describe('SSH Connection Features', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.clearAllMocks()
    mockRemoteState.saved = []
    mockRemoteState.active = null
  })

  it('should display SSH connection title', async () => {
    const { openSettingsPanel } = await import('./settings.js')
    openSettingsPanel()

    const title = document.getElementById('dm-settings-title')
    expect(title).toBeTruthy()
    expect(title?.textContent).toContain('SSH')
  })

  it('should display saved connections list', async () => {
    mockRemoteState.saved = [
      { id: 'conn1', name: 'Test Server', host: '192.168.1.1', port: 22, username: 'user' },
    ]

    const { openSettingsPanel } = await import('./settings.js')
    openSettingsPanel()

    const list = document.getElementById('dm-saved-connections-list')
    expect(list).toBeTruthy()
  })

  it('should show empty connections message when no saved connections', async () => {
    mockRemoteState.saved = []

    const { openSettingsPanel } = await import('./settings.js')
    openSettingsPanel()

    const list = document.getElementById('dm-saved-connections-list')
    expect(list).toBeTruthy()
  })

  it('should have new connection button', async () => {
    const { openSettingsPanel } = await import('./settings.js')
    openSettingsPanel()

    const buttons = document.querySelectorAll('button.comfy-btn')
    const newButton = Array.from(buttons).find((btn) => btn.textContent?.includes('新建连接'))
    expect(newButton).toBeTruthy()
  })
})

// ==================== createSettingsInput Tests ====================
// Note: This is a private function, tested indirectly through other tests

describe('createSettingsInput - indirect tests', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.clearAllMocks()
    mockRemoteState.saved = []
    mockRemoteState.active = null
  })

  it('should create text input in connection form', async () => {
    const { openSettingsPanel } = await import('./settings.js')
    openSettingsPanel()

    // Click new connection button to show form
    const buttons = document.querySelectorAll('button.comfy-btn')
    const newButton = Array.from(buttons).find((btn) => btn.textContent?.includes('新建连接'))
    newButton?.click()

    // Wait for DOM update
    await new Promise((resolve) => setTimeout(resolve, 0))

    const hostInput = document.getElementById('dm-ssh-host') as HTMLInputElement
    expect(hostInput?.type).toBe('text')
  })

  it('should create number input for port', async () => {
    const { openSettingsPanel } = await import('./settings.js')
    openSettingsPanel()

    const buttons = document.querySelectorAll('button.comfy-btn')
    const newButton = Array.from(buttons).find((btn) => btn.textContent?.includes('新建连接'))
    newButton?.click()

    await new Promise((resolve) => setTimeout(resolve, 0))

    const portInput = document.getElementById('dm-ssh-port') as HTMLInputElement
    expect(portInput?.type).toBe('number')
  })

  it('should create password input for password field', async () => {
    const { openSettingsPanel } = await import('./settings.js')
    openSettingsPanel()

    const buttons = document.querySelectorAll('button.comfy-btn')
    const newButton = Array.from(buttons).find((btn) => btn.textContent?.includes('新建连接'))
    newButton?.click()

    await new Promise((resolve) => setTimeout(resolve, 0))

    const passwordInput = document.getElementById('dm-ssh-password') as HTMLInputElement
    expect(passwordInput?.type).toBe('password')
  })

  it('should apply correct placeholder values', async () => {
    const { openSettingsPanel } = await import('./settings.js')
    openSettingsPanel()

    const buttons = document.querySelectorAll('button.comfy-btn')
    const newButton = Array.from(buttons).find((btn) => btn.textContent?.includes('新建连接'))
    newButton?.click()

    await new Promise((resolve) => setTimeout(resolve, 0))

    const hostInput = document.getElementById('dm-ssh-host') as HTMLInputElement
    const portInput = document.getElementById('dm-ssh-port') as HTMLInputElement

    expect(hostInput?.placeholder).toBe('192.168.1.100')
    expect(portInput?.placeholder).toBe('22')
  })

  it('should have input labels', async () => {
    const { openSettingsPanel } = await import('./settings.js')
    openSettingsPanel()

    const buttons = document.querySelectorAll('button.comfy-btn')
    const newButton = Array.from(buttons).find((btn) => btn.textContent?.includes('新建连接'))
    newButton?.click()

    await new Promise((resolve) => setTimeout(resolve, 0))

    // Check for labels in the form
    const formContainer = document.querySelector('#dm-settings-panel-overlay')
    expect(formContainer?.innerHTML).toContain('主机地址')
    expect(formContainer?.innerHTML).toContain('端口')
    expect(formContainer?.innerHTML).toContain('用户名')
    expect(formContainer?.innerHTML).toContain('密码')
  })
})

// ==================== showConnectionForm Tests ====================

describe('showConnectionForm', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.clearAllMocks()
    mockRemoteState.saved = []
    mockRemoteState.active = null
  })

  it('should create form with all input fields', async () => {
    const { openSettingsPanel } = await import('./settings.js')
    openSettingsPanel()

    const buttons = document.querySelectorAll('button.comfy-btn')
    const newButton = Array.from(buttons).find((btn) => btn.textContent?.includes('新建连接'))
    newButton?.click()

    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(document.getElementById('dm-ssh-host')).toBeTruthy()
    expect(document.getElementById('dm-ssh-port')).toBeTruthy()
    expect(document.getElementById('dm-ssh-username')).toBeTruthy()
    expect(document.getElementById('dm-ssh-password')).toBeTruthy()
  })

  it('should create back button', async () => {
    const { openSettingsPanel } = await import('./settings.js')
    openSettingsPanel()

    const buttons = document.querySelectorAll('button.comfy-btn')
    const newButton = Array.from(buttons).find((btn) => btn.textContent?.includes('新建连接'))
    newButton?.click()

    await new Promise((resolve) => setTimeout(resolve, 0))

    const buttonsAfter = Array.from(document.querySelectorAll('button.comfy-btn'))
    const backButton = buttonsAfter.find((btn) => btn.textContent?.includes('返回'))
    expect(backButton).toBeTruthy()
  })

  it('should create save credentials checkbox', async () => {
    const { openSettingsPanel } = await import('./settings.js')
    openSettingsPanel()

    const buttons = document.querySelectorAll('button.comfy-btn')
    const newButton = Array.from(buttons).find((btn) => btn.textContent?.includes('新建连接'))
    newButton?.click()

    await new Promise((resolve) => setTimeout(resolve, 0))

    const saveCheckbox = document.getElementById('dm-ssh-save-creds') as HTMLInputElement
    expect(saveCheckbox?.type).toBe('checkbox')
  })

  it('should create connect button', async () => {
    const { openSettingsPanel } = await import('./settings.js')
    openSettingsPanel()

    const buttons = document.querySelectorAll('button.comfy-btn')
    const newButton = Array.from(buttons).find((btn) => btn.textContent?.includes('新建连接'))
    newButton?.click()

    await new Promise((resolve) => setTimeout(resolve, 0))

    const buttonsAfter = Array.from(document.querySelectorAll('button'))
    const connectButton = buttonsAfter.find((btn) => btn.textContent === '连接')
    expect(connectButton).toBeTruthy()
  })
})

// ==================== Connection Flow Tests ====================

describe('connection flow', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.clearAllMocks()
    mockRemoteState.saved = []
    mockRemoteState.active = null
  })

  it('should validate host and username before connect', async () => {
    const { sshConnect } = await import('../../api/ssh.js')

    const { openSettingsPanel } = await import('./settings.js')
    openSettingsPanel()

    const buttons = document.querySelectorAll('button.comfy-btn')
    const newButton = Array.from(buttons).find((btn) => btn.textContent?.includes('新建连接'))
    newButton?.click()

    await new Promise((resolve) => setTimeout(resolve, 0))

    // Leave form empty and click connect
    const buttonsAfter = Array.from(document.querySelectorAll('button'))
    const connectButton = buttonsAfter.find((btn) => btn.textContent === '连接')
    connectButton?.click()

    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(sshConnect).not.toHaveBeenCalled()
    expect(mockAlert).toHaveBeenCalledWith('请填写主机地址和用户名')
  })

  it('should show alert on validation failure', async () => {
    const { sshConnect } = await import('../../api/ssh.js')

    const { openSettingsPanel } = await import('./settings.js')
    openSettingsPanel()

    const buttons = document.querySelectorAll('button.comfy-btn')
    const newButton = Array.from(buttons).find((btn) => btn.textContent?.includes('新建连接'))
    newButton?.click()

    await new Promise((resolve) => setTimeout(resolve, 0))

    // Fill only username, not host
    const usernameInput = document.getElementById('dm-ssh-username') as HTMLInputElement
    usernameInput.value = 'testuser'

    const buttonsAfter = Array.from(document.querySelectorAll('button'))
    const connectButton = buttonsAfter.find((btn) => btn.textContent === '连接')
    connectButton?.click()

    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(sshConnect).not.toHaveBeenCalled()
    expect(mockAlert).toHaveBeenCalledWith('请填写主机地址和用户名')
  })

  it('should call sshConnect with correct parameters', async () => {
    const { sshConnect } = await import('../../api/ssh.js')
    vi.mocked(sshConnect).mockResolvedValue({
      success: true,
      connection_id: 'test_conn_123',
    })

    const { openSettingsPanel } = await import('./settings.js')
    const onConnect = vi.fn()
    openSettingsPanel({ onConnect })

    const buttons = document.querySelectorAll('button.comfy-btn')
    const newButton = Array.from(buttons).find((btn) => btn.textContent?.includes('新建连接'))
    newButton?.click()

    await new Promise((resolve) => setTimeout(resolve, 0))

    // Fill form
    ;(document.getElementById('dm-ssh-host') as HTMLInputElement).value = '192.168.1.100'
    ;(document.getElementById('dm-ssh-port') as HTMLInputElement).value = '22'
    ;(document.getElementById('dm-ssh-username') as HTMLInputElement).value = 'admin'
    ;(document.getElementById('dm-ssh-password') as HTMLInputElement).value = 'password123'

    const buttonsAfter = Array.from(document.querySelectorAll('button'))
    const connectButton = buttonsAfter.find((btn) => btn.textContent === '连接')
    connectButton?.click()

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(sshConnect).toHaveBeenCalledWith('192.168.1.100', 22, 'admin', 'password123')
  })

  it('should save credentials when checkbox checked', async () => {
    const { sshConnect, sshSaveCredential } = await import('../../api/ssh.js')
    vi.mocked(sshConnect).mockResolvedValue({
      success: true,
      connection_id: 'test_conn_123',
    })
    vi.mocked(sshSaveCredential).mockResolvedValue({ success: true })

    const { openSettingsPanel } = await import('./settings.js')
    openSettingsPanel()

    const buttons = document.querySelectorAll('button.comfy-btn')
    const newButton = Array.from(buttons).find((btn) => btn.textContent?.includes('新建连接'))
    newButton?.click()

    await new Promise((resolve) => setTimeout(resolve, 0))

    // Fill form and check save checkbox
    ;(document.getElementById('dm-ssh-host') as HTMLInputElement).value = '192.168.1.100'
    ;(document.getElementById('dm-ssh-port') as HTMLInputElement).value = '22'
    ;(document.getElementById('dm-ssh-username') as HTMLInputElement).value = 'admin'
    ;(document.getElementById('dm-ssh-password') as HTMLInputElement).value = 'password123'
    ;(document.getElementById('dm-ssh-save-creds') as HTMLInputElement).checked = true

    const buttonsAfter = Array.from(document.querySelectorAll('button'))
    const connectButton = buttonsAfter.find((btn) => btn.textContent === '连接')
    connectButton?.click()

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(sshSaveCredential).toHaveBeenCalled()
  })

  it('should show alert on connection failure', async () => {
    const { sshConnect } = await import('../../api/ssh.js')
    vi.mocked(sshConnect).mockRejectedValue(new Error('Connection refused'))

    const { openSettingsPanel } = await import('./settings.js')
    openSettingsPanel()

    const buttons = document.querySelectorAll('button.comfy-btn')
    const newButton = Array.from(buttons).find((btn) => btn.textContent?.includes('新建连接'))
    newButton?.click()

    await new Promise((resolve) => setTimeout(resolve, 0))

    // Fill form
    ;(document.getElementById('dm-ssh-host') as HTMLInputElement).value = '192.168.1.100'
    ;(document.getElementById('dm-ssh-username') as HTMLInputElement).value = 'admin'

    const buttonsAfter = Array.from(document.querySelectorAll('button'))
    const connectButton = buttonsAfter.find((btn) => btn.textContent === '连接')
    connectButton?.click()

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining('连接失败'))
  })

  it('should handle invalid port number', async () => {
    const { sshConnect } = await import('../../api/ssh.js')
    vi.mocked(sshConnect).mockResolvedValue({
      success: true,
      connection_id: 'test_conn_123',
    })

    const { openSettingsPanel } = await import('./settings.js')
    openSettingsPanel()

    const buttons = document.querySelectorAll('button.comfy-btn')
    const newButton = Array.from(buttons).find((btn) => btn.textContent?.includes('新建连接'))
    newButton?.click()

    await new Promise((resolve) => setTimeout(resolve, 0))

    // Fill form with invalid port
    ;(document.getElementById('dm-ssh-host') as HTMLInputElement).value = '192.168.1.100'
    ;(document.getElementById('dm-ssh-port') as HTMLInputElement).value = 'invalid'
    ;(document.getElementById('dm-ssh-username') as HTMLInputElement).value = 'admin'
    ;(document.getElementById('dm-ssh-password') as HTMLInputElement).value = 'password'

    const buttonsAfter = Array.from(document.querySelectorAll('button'))
    const connectButton = buttonsAfter.find((btn) => btn.textContent === '连接')
    connectButton?.click()

    await new Promise((resolve) => setTimeout(resolve, 100))

    // Should default to port 22 when parseInt fails
    expect(sshConnect).toHaveBeenCalledWith('192.168.1.100', 22, 'admin', 'password')
  })

  it('should call onConnect callback on success', async () => {
    const { sshConnect } = await import('../../api/ssh.js')
    vi.mocked(sshConnect).mockResolvedValue({
      success: true,
      connection_id: 'test_conn_123',
    })

    const onConnect = vi.fn()
    const { openSettingsPanel } = await import('./settings.js')
    openSettingsPanel({ onConnect })

    const buttons = document.querySelectorAll('button.comfy-btn')
    const newButton = Array.from(buttons).find((btn) => btn.textContent?.includes('新建连接'))
    newButton?.click()

    await new Promise((resolve) => setTimeout(resolve, 0))

    // Fill form
    ;(document.getElementById('dm-ssh-host') as HTMLInputElement).value = '192.168.1.100'
    ;(document.getElementById('dm-ssh-username') as HTMLInputElement).value = 'admin'

    const buttonsAfter = Array.from(document.querySelectorAll('button'))
    const connectButton = buttonsAfter.find((btn) => btn.textContent === '连接')
    connectButton?.click()

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(onConnect).toHaveBeenCalled()
  })
})

// ==================== renderSavedCredentialsList Tests ====================

describe('renderSavedCredentialsList', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.clearAllMocks()
    mockRemoteState.saved = []
    mockRemoteState.active = null
  })

  it('should show loading message initially', async () => {
    const { sshListCredentials } = await import('../../api/ssh.js')
    vi.mocked(sshListCredentials).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ success: true, credentials: [] }), 100)
        })
    )

    const { openSettingsPanel } = await import('./settings.js')
    openSettingsPanel()

    const list = document.getElementById('dm-saved-connections-list')
    // Initially shows loading
    expect(list?.innerHTML).toContain('加载中')
  })

  it('should render empty state when no credentials', async () => {
    const { sshListCredentials } = await import('../../api/ssh.js')
    vi.mocked(sshListCredentials).mockResolvedValue({
      success: true,
      credentials: [],
    })

    const { openSettingsPanel } = await import('./settings.js')
    openSettingsPanel()

    // Wait for async load
    await new Promise((resolve) => setTimeout(resolve, 150))

    const list = document.getElementById('dm-saved-connections-list')
    expect(list?.innerHTML).toContain('暂无保存的凭证')
  })

  it('should render credential items', async () => {
    const { sshListCredentials } = await import('../../api/ssh.js')
    vi.mocked(sshListCredentials).mockResolvedValue({
      success: true,
      credentials: [
        {
          id: 'cred1',
          name: 'Test Server',
          host: '192.168.1.100',
          port: 22,
          username: 'admin',
        },
      ],
    })

    const { openSettingsPanel } = await import('./settings.js')
    openSettingsPanel()

    // Wait for async load
    await new Promise((resolve) => setTimeout(resolve, 150))

    const list = document.getElementById('dm-saved-connections-list')
    expect(list?.innerHTML).toContain('Test Server')
  })

  it('should display credential name and host info', async () => {
    const { sshListCredentials } = await import('../../api/ssh.js')
    vi.mocked(sshListCredentials).mockResolvedValue({
      success: true,
      credentials: [
        {
          id: 'cred1',
          name: 'Production Server',
          host: 'server.example.com',
          port: 2222,
          username: 'deploy',
        },
      ],
    })

    const { openSettingsPanel } = await import('./settings.js')
    openSettingsPanel()

    // Wait for async load
    await new Promise((resolve) => setTimeout(resolve, 150))

    const list = document.getElementById('dm-saved-connections-list')
    expect(list?.innerHTML).toContain('Production Server')
    expect(list?.innerHTML).toContain('deploy@server.example.com:2222')
  })

  it('should display creation date if available', async () => {
    const { sshListCredentials } = await import('../../api/ssh.js')
    vi.mocked(sshListCredentials).mockResolvedValue({
      success: true,
      credentials: [
        {
          id: 'cred1',
          name: 'Test Server',
          host: '192.168.1.100',
          port: 22,
          username: 'admin',
          created: '2024-01-15T10:00:00Z',
        },
      ],
    })

    const { openSettingsPanel } = await import('./settings.js')
    openSettingsPanel()

    // Wait for async load
    await new Promise((resolve) => setTimeout(resolve, 150))

    const list = document.getElementById('dm-saved-connections-list')
    expect(list?.innerHTML).toContain('保存于:')
  })

  it('should handle API errors gracefully', async () => {
    const { sshListCredentials } = await import('../../api/ssh.js')
    vi.mocked(sshListCredentials).mockRejectedValue(new Error('Network error'))

    const { openSettingsPanel } = await import('./settings.js')
    openSettingsPanel()

    // Wait for async load
    await new Promise((resolve) => setTimeout(resolve, 150))

    const list = document.getElementById('dm-saved-connections-list')
    expect(list?.innerHTML).toContain('加载凭证列表失败')
  })
})

// ==================== Delete Credential Tests ====================

describe('delete credential', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.clearAllMocks()
    mockRemoteState.saved = []
    mockRemoteState.active = null
  })

  it('should show delete button for each credential', async () => {
    const { sshListCredentials } = await import('../../api/ssh.js')
    vi.mocked(sshListCredentials).mockResolvedValue({
      success: true,
      credentials: [
        { id: 'cred1', name: 'Test Server', host: '192.168.1.100', port: 22, username: 'admin' },
      ],
    })

    const { openSettingsPanel } = await import('./settings.js')
    openSettingsPanel()

    // Wait for async load
    await new Promise((resolve) => setTimeout(resolve, 150))

    const deleteButtons = document.querySelectorAll('button')
    const deleteButton = Array.from(deleteButtons).find((btn) => btn.innerHTML.includes('pi-trash'))
    expect(deleteButton).toBeTruthy()
  })

  it('should show confirm dialog before delete', async () => {
    const { sshListCredentials, sshDeleteCredential } = await import('../../api/ssh.js')
    vi.mocked(sshListCredentials).mockResolvedValue({
      success: true,
      credentials: [
        { id: 'cred1', name: 'Test Server', host: '192.168.1.100', port: 22, username: 'admin' },
      ],
    })
    vi.mocked(sshDeleteCredential).mockResolvedValue({ success: true })

    const { openSettingsPanel } = await import('./settings.js')
    openSettingsPanel()

    // Wait for async load
    await new Promise((resolve) => setTimeout(resolve, 150))

    const deleteButtons = document.querySelectorAll('button')
    const deleteButton = Array.from(deleteButtons).find((btn) => btn.innerHTML.includes('pi-trash'))

    deleteButton?.click()

    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(mockConfirm).toHaveBeenCalledWith(expect.stringContaining('确定删除凭证'))
  })

  it('should call sshDeleteCredential on confirm', async () => {
    const { sshListCredentials, sshDeleteCredential } = await import('../../api/ssh.js')
    vi.mocked(sshListCredentials).mockResolvedValue({
      success: true,
      credentials: [
        { id: 'cred1', name: 'Test Server', host: '192.168.1.100', port: 22, username: 'admin' },
      ],
    })
    vi.mocked(sshDeleteCredential).mockResolvedValue({ success: true })

    const { openSettingsPanel } = await import('./settings.js')
    openSettingsPanel()

    // Wait for async load
    await new Promise((resolve) => setTimeout(resolve, 150))

    const deleteButtons = document.querySelectorAll('button')
    const deleteButton = Array.from(deleteButtons).find((btn) => btn.innerHTML.includes('pi-trash'))

    deleteButton?.click()

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(sshDeleteCredential).toHaveBeenCalledWith('cred1')
  })

  it('should show alert on delete failure', async () => {
    const { sshListCredentials, sshDeleteCredential } = await import('../../api/ssh.js')
    vi.mocked(sshListCredentials).mockResolvedValue({
      success: true,
      credentials: [
        { id: 'cred1', name: 'Test Server', host: '192.168.1.100', port: 22, username: 'admin' },
      ],
    })
    vi.mocked(sshDeleteCredential).mockRejectedValue(new Error('Delete failed'))

    const { openSettingsPanel } = await import('./settings.js')
    openSettingsPanel()

    // Wait for async load
    await new Promise((resolve) => setTimeout(resolve, 150))

    const deleteButtons = document.querySelectorAll('button')
    const deleteButton = Array.from(deleteButtons).find((btn) => btn.innerHTML.includes('pi-trash'))

    deleteButton?.click()

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining('删除失败'))
  })
})

// ==================== Settings Interactions Tests ====================

describe('settings interactions', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.clearAllMocks()
    mockRemoteState.saved = []
    mockRemoteState.active = null
  })

  it('should close panel on close button click', async () => {
    const { openSettingsPanel } = await import('./settings.js')
    const panel = openSettingsPanel()

    const closeButton = document.getElementById('dm-settings-close')
    closeButton?.click()

    expect(document.body.contains(panel)).toBe(false)
  })

  it('should close panel on overlay click', async () => {
    const { openSettingsPanel } = await import('./settings.js')
    const panel = openSettingsPanel()

    // Click the overlay (not the panel)
    const overlay = document.getElementById('dm-settings-panel-overlay')
    overlay?.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(document.body.contains(panel)).toBe(false)
  })

  it('should not close when clicking panel content', async () => {
    const { openSettingsPanel } = await import('./settings.js')
    const panel = openSettingsPanel()

    // Find and click the panel content (not the overlay)
    const overlay = document.getElementById('dm-settings-panel-overlay')
    const panelContent = overlay?.querySelector('div[style*="background"]')

    if (panelContent) {
      panelContent.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      // Panel should still exist
      expect(document.body.contains(panel)).toBe(true)
    }
  })

  it('should navigate back to list on back button click', async () => {
    const { openSettingsPanel } = await import('./settings.js')
    openSettingsPanel()

    const buttons = document.querySelectorAll('button.comfy-btn')
    const newButton = Array.from(buttons).find((btn) => btn.textContent?.includes('新建连接'))
    newButton?.click()

    await new Promise((resolve) => setTimeout(resolve, 0))

    const backButton = Array.from(document.querySelectorAll('button.comfy-btn')).find((btn) =>
      btn.textContent?.includes('返回')
    )
    backButton?.click()

    await new Promise((resolve) => setTimeout(resolve, 0))

    // Should return to list view (check for list element)
    const list = document.getElementById('dm-saved-connections-list')
    expect(list).toBeTruthy()
  })
})
