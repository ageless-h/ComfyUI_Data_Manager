// -*- coding: utf-8 -*-
/**
 * Tests for actions.ts - 文件操作核心功能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  loadDirectory,
  toggleSort,
  navigateUp,
  navigateHome,
  navigateBack,
  navigateForward,
  updateHeaderSortIndicators,
  updateNavButtons,
} from './actions.js'
import { FileManagerState } from '../../core/state.js'
import * as fileApi from '../../api/endpoints/file.js'
import {
  mockFileItems,
  mockApiResponses,
  createMockDOM,
  cleanupMockDOM,
  resetMockState,
  mockTheme,
} from '../../../tests/fixtures/ui-fixtures.js'

// Mock API
vi.mock('../../api/endpoints/file.js', () => ({
  listDirectory: vi.fn(),
}))

// Mock SSH API
vi.mock('../../api/ssh.js', () => ({
  sshList: vi.fn(),
}))

// Mock browser functions
vi.mock('./browser.js', () => ({
  createFileListItem: vi.fn(() => '<div>mock-item</div>'),
  createFileGridItem: vi.fn(() => '<div>mock-grid</div>'),
}))

// Mock utils
vi.mock('../../utils/helpers.js', () => ({
  updateStatus: vi.fn(),
  showToast: vi.fn(),
  getParentPath: (path: string) => {
    if (path === '.' || path === '/') return '.'
    const parts = path.split(/[/\\]/)
    parts.pop()
    return parts.join('/') || '.'
  },
}))

// Mock theme
vi.mock('../../utils/theme.js', () => ({
  getComfyTheme: () => mockTheme,
}))

// Mock state functions
vi.mock('../../core/state.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../core/state.js')>()
  return {
    ...actual,
    saveLastPath: vi.fn(),
  }
})

describe('actions', () => {
  beforeEach(() => {
    createMockDOM()
    resetMockState(FileManagerState as unknown as Parameters<typeof resetMockState>[0])
    vi.clearAllMocks()
    // Clear any SSH connection state from previous tests
    delete (window as unknown as { _remoteConnectionsState?: unknown })._remoteConnectionsState
  })

  afterEach(() => {
    cleanupMockDOM()
  })

  describe('loadDirectory', () => {
    it('should load files from local directory', async () => {
      vi.mocked(fileApi.listDirectory).mockResolvedValue(mockApiResponses.listDirectory)

      await loadDirectory('/test')

      expect(fileApi.listDirectory).toHaveBeenCalledWith('/test')
      expect(FileManagerState.files).toEqual(mockFileItems)
      expect(FileManagerState.currentPath).toBe('/test')
    })

    it('should add path to history', async () => {
      vi.mocked(fileApi.listDirectory).mockResolvedValue(mockApiResponses.listDirectory)

      await loadDirectory('/test')

      expect(FileManagerState.history).toContain('/test')
      expect(FileManagerState.historyIndex).toBeGreaterThan(0)
    })

    it('should update path input value', async () => {
      vi.mocked(fileApi.listDirectory).mockResolvedValue(mockApiResponses.listDirectory)

      await loadDirectory('/test')

      const pathInput = document.getElementById('dm-path-input') as HTMLInputElement
      expect(pathInput?.value).toBe('/test')
    })

    it('should handle empty directory', async () => {
      vi.mocked(fileApi.listDirectory).mockResolvedValue(mockApiResponses.emptyDirectory)

      await loadDirectory('/empty')

      expect(FileManagerState.files).toEqual([])
      expect(FileManagerState.currentPath).toBe('/empty')
    })

    it('should handle API errors gracefully', async () => {
      vi.mocked(fileApi.listDirectory).mockRejectedValue(new Error('Network error'))

      await expect(loadDirectory('/test')).resolves.not.toThrow()
    })
  })

  describe('loadDirectory - SSH remote', () => {
    it('should load remote directory via SSH', async () => {
      const { sshList } = await import('../../api/ssh.js')
      vi.mocked(sshList).mockResolvedValue(mockApiResponses.sshList)

      // 设置活动 SSH 连接
      ;(window as unknown as { _remoteConnectionsState: { active: unknown } })._remoteConnectionsState = {
        active: {
          connection_id: 'ssh-conn-123',
          root_path: '/home/admin',
        },
      }

      await loadDirectory('/home/admin')

      expect(sshList).toHaveBeenCalledWith('ssh-conn-123', '/home/admin')
      expect(FileManagerState.currentPath).toBe('/home/admin')
    })
  })

  describe('toggleSort', () => {
    it('should toggle sort order when same column is clicked', () => {
      FileManagerState.sortBy = 'name'
      FileManagerState.sortOrder = 'asc'

      toggleSort('name')

      expect(FileManagerState.sortOrder).toBe('desc')
    })

    it('should change sort column when different column is clicked', () => {
      FileManagerState.sortBy = 'name'
      FileManagerState.sortOrder = 'asc'

      toggleSort('size')

      expect(FileManagerState.sortBy).toBe('size')
      expect(FileManagerState.sortOrder).toBe('asc')
    })

    it('should update sort select element', () => {
      FileManagerState.sortBy = 'name'
      FileManagerState.files = mockFileItems // Set files to allow renderFileListUI to work

      // 创建排序选择器 with options
      const sortSelect = document.createElement('select')
      sortSelect.id = 'dm-sort-select'
      // Add options so the value can be set
      const options = [
        { value: 'name', text: '名称' },
        { value: 'size', text: '大小' },
        { value: 'modified', text: '修改时间' },
      ]
      options.forEach(opt => {
        const option = document.createElement('option')
        option.value = opt.value
        option.textContent = opt.text
        sortSelect.appendChild(option)
      })
      document.body.appendChild(sortSelect)

      toggleSort('size')

      expect(sortSelect.value).toBe('size')
    })
  })

  describe('navigateUp', () => {
    it('should navigate to parent directory', async () => {
      FileManagerState.currentPath = '/test/folder'
      FileManagerState.history = ['.', '/test', '/test/folder']
      FileManagerState.historyIndex = 2

      // Mock listDirectory to return correct path
      vi.mocked(fileApi.listDirectory).mockResolvedValue({
        files: mockFileItems,
        path: '/test',
      })

      // navigateUp uses void loadDirectory(), so we need to wait for the promise
      navigateUp()

      // Wait for the async operation to complete
      await vi.waitFor(() => {
        expect(FileManagerState.currentPath).toBe('/test')
      }, { timeout: 1000 })
    })

    it('should not navigate when at root', () => {
      FileManagerState.currentPath = '.'

      const listDirectorySpy = vi.spyOn(fileApi, 'listDirectory')

      navigateUp()

      expect(listDirectorySpy).not.toHaveBeenCalled()
    })

    it('should not navigate when at root with forward slash', () => {
      FileManagerState.currentPath = '/'

      const listDirectorySpy = vi.spyOn(fileApi, 'listDirectory')

      navigateUp()

      expect(listDirectorySpy).not.toHaveBeenCalled()
    })
  })

  describe('navigateHome', () => {
    it('should navigate to root directory', async () => {
      FileManagerState.currentPath = '/test/deep/folder'
      FileManagerState.history = ['.', '/test', '/test/deep', '/test/deep/folder']
      FileManagerState.historyIndex = 3

      vi.mocked(fileApi.listDirectory).mockResolvedValue(mockApiResponses.rootDirectory)

      // navigateHome uses void loadDirectory(), so we need to wait for the promise
      navigateHome()

      // Wait for listDirectory to be called
      await vi.waitFor(() => {
        expect(fileApi.listDirectory).toHaveBeenCalledWith('.')
      }, { timeout: 1000 })
    })
  })

  describe('navigateBack', () => {
    it('should navigate back in history', async () => {
      FileManagerState.history = ['.', '/test', '/test/folder']
      FileManagerState.historyIndex = 2

      vi.mocked(fileApi.listDirectory).mockResolvedValue(mockApiResponses.listDirectory)

      await navigateBack()

      expect(FileManagerState.historyIndex).toBe(1)
      // listDirectoryWithoutHistory should be called, not the original listDirectory mock
      // But since both call the same API, we check it was called
      expect(fileApi.listDirectory).toHaveBeenCalled()
    })

    it('should not navigate back when at beginning of history', async () => {
      FileManagerState.history = ['.']
      FileManagerState.historyIndex = 0

      const listDirectorySpy = vi.spyOn(fileApi, 'listDirectory')

      await navigateBack()

      expect(listDirectorySpy).not.toHaveBeenCalled()
    })
  })

  describe('navigateForward', () => {
    it('should navigate forward in history', async () => {
      FileManagerState.history = ['.', '/test', '/test/folder']
      FileManagerState.historyIndex = 0

      vi.mocked(fileApi.listDirectory).mockResolvedValue(mockApiResponses.listDirectory)

      await navigateForward()

      expect(FileManagerState.historyIndex).toBe(1)
      // Check that listDirectory was called
      expect(fileApi.listDirectory).toHaveBeenCalled()
    })

    it('should not navigate forward when at end of history', async () => {
      FileManagerState.history = ['.', '/test']
      FileManagerState.historyIndex = 1

      const listDirectorySpy = vi.spyOn(fileApi, 'listDirectory')

      await navigateForward()

      expect(listDirectorySpy).not.toHaveBeenCalled()
    })
  })

  describe('updateHeaderSortIndicators', () => {
    it('should update sort icons for active column', () => {
      // 创建 mock 头部元素
      const header1 = document.createElement('div')
      header1.className = 'dm-header-cell'
      header1.dataset.sort = 'name'
      header1.innerHTML = '<span>名称</span><i class="pi pi-sort" style="opacity: 0.5;"></i>'

      const header2 = document.createElement('div')
      header2.className = 'dm-header-cell'
      header2.dataset.sort = 'size'
      header2.innerHTML = '<span>大小</span><i class="pi pi-sort" style="opacity: 0.5;"></i>'

      document.body.appendChild(header1)
      document.body.appendChild(header2)

      FileManagerState.sortBy = 'name'
      FileManagerState.sortOrder = 'asc'

      updateHeaderSortIndicators()

      const activeIcon = header1.querySelector('i') as HTMLElement
      expect(activeIcon.className).toBe('pi pi-sort-amount-up')
      expect(activeIcon.style.opacity).toBe('1')
    })

    it('should reset inactive column icons', () => {
      const header = document.createElement('div')
      header.className = 'dm-header-cell'
      header.dataset.sort = 'size'
      header.innerHTML = '<span>大小</span><i class="pi pi-sort" style="opacity: 0.5;"></i>'

      document.body.appendChild(header)

      FileManagerState.sortBy = 'name'

      updateHeaderSortIndicators()

      const icon = header.querySelector('i') as HTMLElement
      expect(icon.className).toBe('pi pi-sort')
      expect(icon.style.opacity).toBe('0.5')
    })
  })

  describe('updateNavButtons', () => {
    it('should disable back button at start of history', () => {
      FileManagerState.history = ['.']
      FileManagerState.historyIndex = 0

      // 创建 mock 导航按钮
      const backBtn = document.createElement('button')
      backBtn.id = 'dm-nav-back-btn'
      document.body.appendChild(backBtn)

      updateNavButtons()

      expect(backBtn.disabled).toBe(true)
      expect(backBtn.style.opacity).toBe('0.3')
    })

    it('should enable back button when history exists', () => {
      FileManagerState.history = ['.', '/test']
      FileManagerState.historyIndex = 1

      const backBtn = document.createElement('button')
      backBtn.id = 'dm-nav-back-btn'
      document.body.appendChild(backBtn)

      updateNavButtons()

      expect(backBtn.disabled).toBe(false)
      expect(backBtn.style.opacity).toBe('1')
    })

    it('should disable forward button at end of history', () => {
      FileManagerState.history = ['.', '/test']
      FileManagerState.historyIndex = 1

      const forwardBtn = document.createElement('button')
      forwardBtn.id = 'dm-nav-forward-btn'
      document.body.appendChild(forwardBtn)

      updateNavButtons()

      expect(forwardBtn.disabled).toBe(true)
      expect(forwardBtn.style.opacity).toBe('0.3')
    })
  })
})
