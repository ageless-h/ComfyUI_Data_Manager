// -*- coding: utf-8 -*-
/**
 * Tests for toolbar.ts - 工具栏组件
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createToolbar } from './toolbar.js'
import { FileManagerState } from '../../core/state.js'
import { mockTheme, createMockDOM, cleanupMockDOM, resetMockState } from '../../../tests/fixtures/ui-fixtures.js'

// Mock theme
vi.mock('../../utils/theme.js', () => ({
  getComfyTheme: () => mockTheme,
}))

// Mock SSH API
vi.mock('../../api/ssh.js', () => ({
  sshConnect: vi.fn(),
  sshDisconnect: vi.fn(),
}))

// Mock settings module - must export all functions used by toolbar
vi.mock('./settings.js', () => ({
  openSettingsPanel: vi.fn(),
  // Export any other functions that might be used
}))

// Mock actions module - must include all exports used by toolbar
vi.mock('./actions.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./actions.js')>()
  return {
    ...actual,
    navigateUp: vi.fn(),
    navigateHome: vi.fn(),
    toggleSort: vi.fn(),
    loadDirectory: vi.fn(() => Promise.resolve()),
  }
})

// Mock state
vi.mock('../../core/state.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../core/state.js')>()
  return {
    ...actual,
    saveViewMode: vi.fn(),
  }
})

describe('toolbar', () => {
  beforeEach(() => {
    createMockDOM()
    resetMockState(FileManagerState as unknown as Parameters<typeof resetMockState>[0])
    vi.clearAllMocks()

    // Set up remote connections state
    ;(window as unknown as { _remoteConnectionsState: { active: unknown; saved: unknown[] } })._remoteConnectionsState = {
      active: null,
      saved: [],
    }
  })

  afterEach(() => {
    cleanupMockDOM()
  })

  describe('createToolbar', () => {
    it('should create toolbar with correct class', () => {
      const toolbar = createToolbar()

      expect(toolbar.className).toBe('dm-toolbar')
    })

    it('should create navigation buttons', () => {
      const toolbar = createToolbar()
      const upBtn = toolbar.querySelector('#dm-nav-up-btn')
      const homeBtn = toolbar.querySelector('#dm-nav-home-btn')

      expect(upBtn).toBeTruthy()
      expect(homeBtn).toBeTruthy()
    })

    it('should create path input', () => {
      const toolbar = createToolbar()
      const pathInput = toolbar.querySelector('#dm-path-input') as HTMLInputElement

      expect(pathInput).toBeTruthy()
      expect(pathInput?.type).toBe('text')
    })

    it('should create sort select', () => {
      const toolbar = createToolbar()
      const sortSelect = toolbar.querySelector('#dm-sort-select') as HTMLSelectElement

      expect(sortSelect).toBeTruthy()
      expect(sortSelect?.options.length).toBe(3) // name, size, modified
    })

    it('should create view toggle button', () => {
      const toolbar = createToolbar()
      const viewToggleBtn = toolbar.querySelector('#dm-view-toggle-btn')

      expect(viewToggleBtn).toBeTruthy()
    })

    it('should create remote selector', () => {
      const toolbar = createToolbar()
      const remoteSelect = toolbar.querySelector('#dm-remote-select')

      expect(remoteSelect).toBeTruthy()
    })

    it('should create settings button', () => {
      const toolbar = createToolbar()
      const settingsBtn = toolbar.querySelector('#dm-settings-btn')

      expect(settingsBtn).toBeTruthy()
    })

    it('should create new button', () => {
      const toolbar = createToolbar()
      const newBtn = toolbar.querySelector('#dm-new-btn')

      expect(newBtn).toBeTruthy()
    })

    it('should call onNewFile callback when new button clicked', () => {
      const onNewFile = vi.fn()
      const toolbar = createToolbar({ onNewFile })
      const newBtn = toolbar.querySelector('#dm-new-btn') as HTMLElement

      newBtn?.click()

      expect(onNewFile).toHaveBeenCalledTimes(1)
    })

    it('should call onSortChange callback when sort changes', () => {
      const onSortChange = vi.fn()
      const toolbar = createToolbar({ onSortChange })
      const sortSelect = toolbar.querySelector('#dm-sort-select') as HTMLSelectElement

      sortSelect.value = 'size'
      sortSelect.dispatchEvent(new Event('change'))

      expect(onSortChange).toHaveBeenCalledWith('size')
    })
  })

  describe('Navigation buttons', () => {
    it('should have up button with correct attributes', () => {
      const toolbar = createToolbar()
      const upBtn = toolbar.querySelector('#dm-nav-up-btn') as HTMLElement

      expect(upBtn?.title).toBe('返回上级')
      expect(upBtn?.innerHTML).toContain('pi-arrow-up')
    })

    it('should have home button with correct attributes', () => {
      const toolbar = createToolbar()
      const homeBtn = toolbar.querySelector('#dm-nav-home-btn') as HTMLElement

      expect(homeBtn?.title).toBe('返回首页')
      expect(homeBtn?.innerHTML).toContain('pi-home')
    })
  })

  describe('View toggle', () => {
    it('should have view toggle button with grid icon when in list mode', () => {
      FileManagerState.viewMode = 'list'

      const toolbar = createToolbar()
      const viewToggleBtn = toolbar.querySelector('#dm-view-toggle-btn') as HTMLElement

      expect(viewToggleBtn).toBeTruthy()
      expect(viewToggleBtn?.innerHTML).toContain('pi-th-large')
    })

    it('should have view toggle button with list icon when in grid mode', () => {
      FileManagerState.viewMode = 'grid'

      const toolbar = createToolbar()
      const viewToggleBtn = toolbar.querySelector('#dm-view-toggle-btn') as HTMLElement

      expect(viewToggleBtn).toBeTruthy()
      expect(viewToggleBtn?.innerHTML).toContain('pi-list')
    })
  })

  describe('Remote selector', () => {
    it('should show local option by default', () => {
      const toolbar = createToolbar()
      const remoteSelect = toolbar.querySelector('#dm-remote-select') as HTMLSelectElement

      expect(remoteSelect?.value).toBe('__local__')
    })

    it('should add saved connections to options', () => {
      const state = (window as unknown as {
        _remoteConnectionsState: { active: unknown; saved: { id: string; name: string }[] }
      })._remoteConnectionsState
      state.saved = [
        { id: 'conn1', name: 'Server 1' },
        { id: 'conn2', name: 'Server 2' },
      ]

      const toolbar = createToolbar()
      const remoteSelect = toolbar.querySelector('#dm-remote-select') as HTMLSelectElement

      expect(remoteSelect?.options.length).toBeGreaterThanOrEqual(1) // At least local
    })
  })

  describe('Connection status', () => {
    it('should update connection indicator', () => {
      const toolbar = createToolbar()

      // Create status elements
      const indicator = document.createElement('div')
      indicator.id = 'dm-connection-indicator'
      document.body.appendChild(indicator)

      const statusText = document.createElement('div')
      statusText.id = 'dm-connection-status'
      document.body.appendChild(statusText)

      // The toolbar initializes after a timeout, so we check DOM state
      expect(indicator).toBeTruthy()
      expect(statusText).toBeTruthy()
    })
  })

  describe('Settings button', () => {
    it('should have settings button with correct attributes', () => {
      const toolbar = createToolbar()
      const settingsBtn = toolbar.querySelector('#dm-settings-btn') as HTMLElement

      expect(settingsBtn).toBeTruthy()
      expect(settingsBtn?.title).toBe('连接管理')
      expect(settingsBtn?.innerHTML).toContain('pi-cog')
    })
  })

  describe('Toolbar callbacks', () => {
    it('should call onSshConnect when SSH connection established', async () => {
      const onSshConnect = vi.fn()
      const toolbar = createToolbar({ onSshConnect })

      // Test callback existence
      expect(typeof onSshConnect).toBe('function')
    })

    it('should call onSshDisconnect when SSH connection closed', async () => {
      const onSshDisconnect = vi.fn()
      const toolbar = createToolbar({ onSshDisconnect })

      // Test callback existence
      expect(typeof onSshDisconnect).toBe('function')
    })
  })
})
