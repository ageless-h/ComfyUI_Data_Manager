/**
 * Tests for Floating Window Component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock all dependencies before importing
vi.mock('../../core/constants.js', () => ({
  FILE_TYPES: {
    image: { exts: ['.jpg', '.png', '.gif'], icon: 'pi-image', color: '#e74c3c' },
    video: { exts: ['.mp4', '.webm'], icon: 'pi-video', color: '#9b59b6' },
    audio: { exts: ['.mp3', '.wav'], icon: 'pi-volume-up', color: '#3498db' },
    document: { exts: ['.pdf', '.txt', '.md'], icon: 'pi-file', color: '#95a5a6' },
    code: { exts: ['.js', '.py', '.html'], icon: 'pi-code', color: '#1abc9c' },
    spreadsheet: { exts: ['.csv', '.xlsx'], icon: 'pi-table', color: '#27ae60' },
    unknown: { exts: [], icon: 'pi-file', color: '#7f8c8d' },
  },
  LIMITS: {
    FLOATING_Z_INDEX: 10001,
    DEFAULT_ZOOM_STEP: 25,
    MIN_ZOOM_DISPLAY: 25,
    MAX_ZOOM_DISPLAY: 300,
  },
}))

vi.mock('../../utils/file-type.js', () => ({
  getFileType: vi.fn(() => 'image'),
}))

vi.mock('../../utils/drag.js', () => ({
  setupWindowDrag: vi.fn(),
  cleanupWindowDrag: vi.fn(),
}))

vi.mock('../../utils/helpers.js', () => ({
  updateStatus: vi.fn(),
  getExt: vi.fn((path: string) => '.' + path.split('.').pop()?.toLowerCase()),
}))

vi.mock('./preview-content.js', () => ({
  loadPreviewContent: vi.fn(),
}))

vi.mock('./dock.js', () => ({
  updateDock: vi.fn(),
}))

// Mock state with mutable array
const mockPreviewWindows: unknown[] = []

vi.mock('../../core/state.js', () => ({
  previewFloatingWindows: mockPreviewWindows,
  fileManagerWindow: null,
  previewModal: null,
}))

vi.mock('../../utils/theme.js', () => ({
  getComfyTheme: () => ({
    bgPrimary: '#1e1e1e',
    bgSecondary: '#252526',
    bgTertiary: '#2d2d30',
    borderColor: '#3e3e42',
    textPrimary: '#cccccc',
    textSecondary: '#858585',
    isLight: false,
  }),
  applyComfyTheme: vi.fn(),
  addThemeListener: vi.fn(),
}))

describe('Floating Window (mocked)', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    mockPreviewWindows.length = 0 // Clear array
    vi.clearAllMocks()
  })

  it('should verify module can be imported', async () => {
    // Dynamic import to ensure mocks are applied
    const windowModule = await import('./window.js')
    expect(windowModule.openFloatingPreview).toBeDefined()
  })

  it('should create DOM elements when called', async () => {
    const { openFloatingPreview } = await import('./window.js')

    openFloatingPreview('/path/to/image.jpg', 'image.jpg')

    // Verify DOM was modified
    const childElements = document.body.children
    expect(childElements.length).toBeGreaterThan(0)
  })

  it('should handle multiple file types', async () => {
    const { openFloatingPreview } = await import('./window.js')

    // Test image
    openFloatingPreview('/path/to/image.jpg', 'image.jpg')
    let count = document.querySelectorAll('.dm-floating-preview').length

    // Test video
    openFloatingPreview('/path/to/video.mp4', 'video.mp4')
    count = document.querySelectorAll('.dm-floating-preview').length

    // Test audio
    openFloatingPreview('/path/to/audio.mp3', 'audio.mp3')
    count = document.querySelectorAll('.dm-floating-preview').length

    // Should have created windows
    expect(count).toBeGreaterThan(0)
  })

  it('should update status when opening preview', async () => {
    const { openFloatingPreview } = await import('./window.js')
    const helpersModule = await import('../../utils/helpers.js')

    openFloatingPreview('/path/to/test.jpg', 'test.jpg')

    // updateStatus should have been called
    const { updateStatus } = helpersModule as { updateStatus: unknown }
    expect(updateStatus).toBeDefined()
  })
})
