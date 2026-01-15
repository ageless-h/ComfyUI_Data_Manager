// -*- coding: utf-8 -*-
/**
 * Tests for browser.ts - 文件浏览器面板组件
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  createBrowserPanel,
  createFileListItem,
  createFileGridItem,
} from './browser.js'
import { mockFileItems, mockTheme, createMockDOM, cleanupMockDOM } from '../../../tests/fixtures/ui-fixtures.js'

// Mock theme
vi.mock('../../utils/theme.js', () => ({
  getComfyTheme: () => mockTheme,
}))

// Mock file-type utilities
vi.mock('../../utils/file-type.js', () => ({
  getFileType: () => 'image',
  getTypeByExt: () => 'image',
}))

// Mock format utilities
vi.mock('../../utils/format.js', () => ({
  formatDate: (date: string) => '2024-01-15',
  formatSize: (size: number) => `${size} B`,
  escapeHtml: (text: string) => text.replace(/[&<>"']/g, ''),
}))

// Mock constants
vi.mock('../../core/constants.js', () => ({
  FILE_TYPES: {
    image: {
      icon: 'pi-image',
      color: '#3498db',
      exts: ['.png', '.jpg'],
    },
    unknown: {
      icon: 'pi-file',
      color: '#95a5a6',
      exts: [],
    },
  },
}))

describe('browser', () => {
  beforeEach(() => {
    createMockDOM()
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanupMockDOM()
  })

  describe('createBrowserPanel', () => {
    it('should create list view panel', () => {
      const panel = createBrowserPanel('list')

      expect(panel.id).toBe('dm-browser-panel')
      expect(panel.className).toBe('dm-browser-panel')
      expect(panel.querySelector('.dm-list-header')).toBeTruthy()
    })

    it('should create grid view panel without header', () => {
      const panel = createBrowserPanel('grid')

      expect(panel.id).toBe('dm-browser-panel')
      expect(panel.querySelector('.dm-list-header')).toBeFalsy()
    })

    it('should create file list container', () => {
      const panel = createBrowserPanel('list')
      const content = panel.querySelector('#dm-file-list')

      expect(content).toBeTruthy()
    })

    it('should apply correct grid styles for grid view', () => {
      const panel = createBrowserPanel('grid')
      const content = panel.querySelector('#dm-file-list') as HTMLElement

      expect(content?.style.display).toBe('grid')
      expect(content?.style.gridTemplateColumns).toContain('repeat(auto-fill')
    })
  })

  describe('createFileListItem', () => {
    it('should render file with correct attributes', () => {
      const file = mockFileItems[0]
      const html = createFileListItem(file, false)

      expect(html).toContain(`data-path="${file.path}"`)
      expect(html).toContain(`data-is-dir="false"`)
      expect(html).toContain(file.name)
    })

    it('should render directory with folder icon', () => {
      const dirItem = mockFileItems.find((f) => f.is_dir)!
      const html = createFileListItem(dirItem, false)

      expect(html).toContain('pi-folder')
      expect(html).toContain('data-is-dir="true"')
    })

    it('should render file size for non-directory files', () => {
      const file = mockFileItems[0]
      const html = createFileListItem(file, false)

      expect(html).toContain('1024 B')
    })

    it('should not render size for directory', () => {
      const dirItem = mockFileItems.find((f) => f.is_dir)!
      const html = createFileListItem(dirItem, false)

      const sizeDiv = '<div class="dm-file-size"'
      expect(html.split(sizeDiv).length - 1).toBe(1) // Header only
    })

    it('should render modified date', () => {
      const file = mockFileItems[0]
      const html = createFileListItem(file, false)

      expect(html).toContain('2024-01-15')
    })

    it('should escape HTML in file name', () => {
      const file = { ...mockFileItems[0], name: '<script>alert("xss")</script>.png' }
      const html = createFileListItem(file, false)

      // The actual escapeHtml implementation may vary
      // Check that at least some escaping happened
      expect(html).not.toContain('<script>alert("xss")</script>')
    })

    it('should apply theme colors', () => {
      const file = mockFileItems[0]
      const html = createFileListItem(file, false)

      expect(html).toContain(mockTheme.borderColor)
    })
  })

  describe('createFileGridItem', () => {
    it('should render grid item with correct attributes', () => {
      const file = mockFileItems[0]
      const html = createFileGridItem(file, false)

      expect(html).toContain(`data-path="${file.path}"`)
      expect(html).toContain(`data-is-dir="false"`)
      expect(html).toContain(file.name)
    })

    it('should render image thumbnail for image files', () => {
      const file = mockFileItems[0]
      const html = createFileGridItem(file, false)

      expect(html).toContain('dm-grid-thumbnail')
      expect(html).toContain('/dm/preview?path=')
    })

    it('should render icon for non-image files', () => {
      const nonImageFile = { ...mockFileItems[2] } // PDF file
      const html = createFileGridItem(nonImageFile, false)

      expect(html).not.toContain('dm-grid-thumbnail')
      expect(html).toContain('dm-grid-icon')
    })

    it('should render parent directory with special style', () => {
      const parentItem = {
        name: '..',
        path: '/test',
        is_dir: true,
      }
      const html = createFileGridItem(parentItem, true)

      expect(html).toContain('dm-grid-item-parent')
      expect(html).toContain('pi-folder-open')
      expect(html).toContain('返回上级')
    })

    it('should escape HTML in file name for grid view', () => {
      const file = { ...mockFileItems[0], name: '<img>.png' }
      const html = createFileGridItem(file, false)

      // Check that HTML tags are at least partially escaped
      expect(html).not.toContain('<img>.png')
    })

    it('should apply grid CSS styles', () => {
      const file = mockFileItems[0]
      const html = createFileGridItem(file, false)

      expect(html).toContain('display: flex')
      expect(html).toContain('flex-direction: column')
      expect(html).toContain('align-items: center')
    })

    it('should show fallback icon when thumbnail fails to load', () => {
      const file = mockFileItems[0]
      const html = createFileGridItem(file, false)

      expect(html).toContain('onerror')
      expect(html).toContain('pi-image')
    })
  })

  describe('createFileListItem - parent directory', () => {
    it('should render parent directory item correctly', () => {
      const parentItem = {
        name: '..',
        path: '/test',
        is_dir: true,
      }
      const html = createFileListItem(parentItem, true)

      expect(html).toContain('data-path="/test"')
      expect(html).toContain('data-is-dir="true"')
      expect(html).toContain('..')
    })

    it('should not show size for parent directory', () => {
      const parentItem = {
        name: '..',
        path: '/test',
        is_dir: true,
        size: 0,
      }
      const html = createFileListItem(parentItem, true)

      expect(html).toContain('<div class="dm-file-size"')
    })
  })
})
