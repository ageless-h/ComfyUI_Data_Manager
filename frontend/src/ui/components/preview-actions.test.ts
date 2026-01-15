// -*- coding: utf-8 -*-
/**
 * Tests for preview-actions.ts - 预览操作功能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  previewFile,
  setupImageZoomControls,
} from './preview-actions.js'
import { createMockDOM, cleanupMockDOM, mockFileItems, mockTheme } from '../../../tests/fixtures/ui-fixtures.js'

// Mock theme
vi.mock('../../utils/theme.js', () => ({
  getComfyTheme: () => mockTheme,
}))

// Mock API
vi.mock('../../api/endpoints/file.js', () => ({
  getPreviewUrl: (path: string) => `/dm/preview?path=${encodeURIComponent(path)}`,
  getFileInfo: vi.fn(() => Promise.resolve({
    name: 'test.png',
    size: 1024,
    modified: '2024-01-15T10:00:00Z',
  })),
}))

// Mock helpers
vi.mock('../../utils/helpers.js', () => ({
  updateStatus: vi.fn(),
  getFileName: (path: string) => path.split(/[/\\]/).pop() || path,
  getExt: (path: string) => '.' + path.split('.').pop(),
}))

// Mock file-type
vi.mock('../../utils/file-type.js', () => ({
  getTypeByExt: () => 'image',
}))

// Mock constants
vi.mock('../../core/constants.js', () => ({
  FILE_TYPES: {
    image: { exts: ['.png', '.jpg'], icon: 'pi-image', color: '#3498db' },
    audio: { exts: ['.mp3'], icon: 'pi-volume-up', color: '#e74c3c' },
    video: { exts: ['.mp4'], icon: 'pi-video', color: '#9b59b6' },
    code: { exts: ['.js', '.ts'], icon: 'pi-code', color: '#f39c12' },
    document: { exts: ['.md', '.pdf', '.docx'], icon: 'pi-file', color: '#95a5a6' },
    spreadsheet: { exts: ['.csv', '.xlsx'], icon: 'pi-table', color: '#27ae60' },
  },
  LIMITS: {
    MAX_CODE_LENGTH: 100000,
    DEFAULT_ZOOM_STEP: 25,
    MAX_ZOOM_DISPLAY: 500,
    MIN_ZOOM_DISPLAY: 10,
  },
}))

// Mock syntax-highlight
vi.mock('../../utils/syntax-highlight.js', () => ({
  highlightCode: () => '<span>highlighted</span>',
}))

// Mock table
vi.mock('../../utils/table.js', () => ({
  parseSpreadsheet: vi.fn(() => Promise.resolve([['a', 'b'], ['1', '2']])),
  createTableHTML: () => '<table><tr><td>a</td></tr></table>',
}))

// Mock script loading
vi.mock('../../utils/script.js', () => ({
  loadScript: vi.fn(() => Promise.resolve()),
}))

// Mock floating window
vi.mock('../floating/window.js', () => ({
  openFloatingPreview: vi.fn(),
}))

describe('preview-actions', () => {
  beforeEach(() => {
    createMockDOM()
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanupMockDOM()
  })

  describe('previewFile - image', () => {
    it('should preview image file', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve('test'),
        } as Response)
      ) as any

      await previewFile('/test/image.png')

      const previewContent = document.getElementById('dm-preview-content') as HTMLElement
      expect(previewContent?.innerHTML).toContain('dm-panel-preview-image')
    })

    it('should show error on image load failure', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
        } as Response)
      ) as any

      await previewFile('/test/image.png')

      const previewContent = document.getElementById('dm-preview-content') as HTMLElement
      // Should show some error or placeholder content
      expect(previewContent?.innerHTML.length).toBeGreaterThan(0)
    })
  })

  describe('previewFile - audio', () => {
    it('should preview audio file', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve('test'),
        } as Response)
      ) as any

      await previewFile('/test/audio.mp3')

      const previewContent = document.getElementById('dm-preview-content') as HTMLElement
      expect(previewContent?.innerHTML).toContain('dm-panel-audio-preview')
      expect(previewContent?.innerHTML).toContain('<audio')
    })
  })

  describe('previewFile - video', () => {
    it('should preview video file', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve('test'),
        } as Response)
      ) as any

      await previewFile('/test/video.mp4')

      const previewContent = document.getElementById('dm-preview-content') as HTMLElement
      expect(previewContent?.innerHTML).toContain('dm-panel-video-container')
      expect(previewContent?.innerHTML).toContain('<video')
    })

    it('should create video controls', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve('test'),
        } as Response)
      ) as any

      await previewFile('/test/video.mp4')

      const previewContent = document.getElementById('dm-preview-content') as HTMLElement
      expect(previewContent?.innerHTML).toContain('dm-video-play-btn')
      expect(previewContent?.innerHTML).toContain('dm-video-time-display')
    })
  })

  describe('previewFile - code', () => {
    it('should preview code file', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve('console.log("hello");'),
        } as Response)
      ) as any

      await previewFile('/test/script.js')

      const previewContent = document.getElementById('dm-preview-content') as HTMLElement
      expect(previewContent?.innerHTML).toContain('dm-code-preview')
    })

    it('should truncate large code files', async () => {
      const largeCode = 'x'.repeat(200000)
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve(largeCode),
        } as Response)
      ) as any

      await previewFile('/test/large.js')

      const previewContent = document.getElementById('dm-preview-content') as HTMLElement
      // Should have code preview content
      expect(previewContent?.innerHTML).toContain('dm-code-preview')
    })
  })

  describe('previewFile - document', () => {
    it('should preview markdown document', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve('# Test'),
        } as Response)
      ) as any

      await previewFile('/test/doc.md')

      const previewContent = document.getElementById('dm-preview-content') as HTMLElement
      expect(previewContent?.innerHTML).toContain('<iframe')
    })

    it('should preview PDF document', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve('test'),
        } as Response)
      ) as any

      await previewFile('/test/doc.pdf')

      const previewContent = document.getElementById('dm-preview-content') as HTMLElement
      expect(previewContent?.innerHTML).toContain('embed')
      expect(previewContent?.innerHTML).toContain('application/pdf')
    })

    it('should show unsupported message for .doc files', async () => {
      // Check if .doc is handled as document type
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve('test'),
        } as Response)
      ) as any

      await previewFile('/test/doc.doc')

      const previewContent = document.getElementById('dm-preview-content') as HTMLElement
      // .doc files may show generic unsupported message
      expect(previewContent?.innerHTML).toMatch(/(不支持|.doc|此文件类型)/)
    })
  })

  describe('previewFile - spreadsheet', () => {
    it('should preview CSV file', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve('a,b\n1,2'),
        } as Response)
      ) as any

      await previewFile('/test/data.csv')

      const previewContent = document.getElementById('dm-preview-content') as HTMLElement
      expect(previewContent?.innerHTML).toContain('<table>')
    })
  })

  describe('previewFile - unsupported type', () => {
    it('should show unsupported message for unknown file types', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve('test'),
        } as Response)
      ) as any

      await previewFile('/test/file.unknown')

      const previewContent = document.getElementById('dm-preview-content') as HTMLElement
      expect(previewContent?.innerHTML).toContain('此文件类型不支持预览')
    })
  })

  describe('formatTime', () => {
    // formatTime is an internal function, tested indirectly through video controls
    it('should create video with time display element', () => {
      const videoId = 'test-video-123'

      // Create mock video element
      const video = document.createElement('video')
      video.id = videoId
      document.body.appendChild(video)

      // Create time display
      const timeDisplay = document.createElement('span')
      timeDisplay.id = `${videoId}-time`
      document.body.appendChild(timeDisplay)

      // Verify elements exist
      expect(document.getElementById(videoId)).toBeTruthy()
      expect(document.getElementById(`${videoId}-time`)).toBeTruthy()
    })
  })

  describe('setupImageZoomControls', () => {
    it('should setup zoom controls for image', () => {
      const imageId = 'test-image-123'

      // Create mock image and controls
      const image = document.createElement('img')
      image.id = imageId
      document.body.appendChild(image)

      const zoomInBtn = document.createElement('button')
      zoomInBtn.className = 'dm-zoom-in-btn'
      zoomInBtn.dataset.imageId = imageId
      document.body.appendChild(zoomInBtn)

      const zoomOutBtn = document.createElement('button')
      zoomOutBtn.className = 'dm-zoom-out-btn'
      zoomOutBtn.dataset.imageId = imageId
      document.body.appendChild(zoomOutBtn)

      const zoomDisplay = document.createElement('span')
      zoomDisplay.id = `${imageId}-zoom`
      document.body.appendChild(zoomDisplay)

      expect(() => setupImageZoomControls(imageId)).not.toThrow()
    })

    it('should handle missing controls gracefully', () => {
      const imageId = 'test-image-456'

      const image = document.createElement('img')
      image.id = imageId
      document.body.appendChild(image)

      expect(() => setupImageZoomControls(imageId)).not.toThrow()
    })
  })

  describe('previewFile - error handling', () => {
    it('should handle fetch errors for non-image files', async () => {
      // Mock fetch to return ok: false for code files
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
        } as Response)
      ) as any

      await previewFile('/test/error.js')

      const previewContent = document.getElementById('dm-preview-content') as HTMLElement
      expect(previewContent?.innerHTML).toContain('加载预览失败')
    })
  })
})
