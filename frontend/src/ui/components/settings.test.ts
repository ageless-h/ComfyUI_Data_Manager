/**
 * Tests for Settings Panel Component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

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
  sshConnect: vi.fn(() => Promise.resolve({ success: true, connection_id: 'test_conn_123' })),
  sshDisconnect: vi.fn(() => Promise.resolve({ success: true })),
}))

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
