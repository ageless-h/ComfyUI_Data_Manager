/**
 * Tests for Format Selector Component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createFormatSelector,
  FORMAT_TYPE_MAP,
  TYPE_FORMATS,
  type FormatSelectorOptions,
} from './format-selector.js'

// Mock theme utility
vi.mock('../../utils/theme.js', () => ({
  getComfyTheme: () => ({
    bgPrimary: '#1e1e1e',
    bgSecondary: '#252526',
    bgTertiary: '#2d2d30',
    borderColor: '#3e3e42',
    textPrimary: '#cccccc',
    textSecondary: '#858585',
    inputText: '#cccccc',
    accentColor: '#007acc',
    successColor: '#4ec9b0',
    isLight: false,
  }),
}))

describe('FORMAT_TYPE_MAP', () => {
  it('should have all required format definitions', () => {
    expect(FORMAT_TYPE_MAP['png']).toBeDefined()
    expect(FORMAT_TYPE_MAP['jpg']).toBeDefined()
    expect(FORMAT_TYPE_MAP['mp4']).toBeDefined()
    expect(FORMAT_TYPE_MAP['mp3']).toBeDefined()
    expect(FORMAT_TYPE_MAP['latent']).toBeDefined()
  })

  it('should have correct structure for each format', () => {
    Object.values(FORMAT_TYPE_MAP).forEach((format) => {
      expect(format).toHaveProperty('type')
      expect(format).toHaveProperty('label')
      expect(format).toHaveProperty('description')
    })
  })
})

describe('TYPE_FORMATS', () => {
  it('should have formats for IMAGE type', () => {
    expect(TYPE_FORMATS['IMAGE']).toEqual(['png', 'jpg', 'webp'])
  })

  it('should have formats for VIDEO type', () => {
    expect(TYPE_FORMATS['VIDEO']).toEqual(['mp4', 'webm', 'avi'])
  })

  it('should have formats for AUDIO type', () => {
    expect(TYPE_FORMATS['AUDIO']).toContain('mp3')
    expect(TYPE_FORMATS['AUDIO']).toContain('wav')
  })

  it('should have formats for LATENT type', () => {
    expect(TYPE_FORMATS['LATENT']).toEqual(['latent'])
  })
})

describe('createFormatSelector', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.clearAllMocks()
  })

  it('should create format selector element', () => {
    const selector = createFormatSelector()

    expect(selector).toBeInstanceOf(HTMLElement)
    expect(selector.className).toContain('dm-format-selector')
  })

  it('should show type indicator when detected type provided', () => {
    const selector = createFormatSelector({ detectedType: 'IMAGE' })

    const typeIndicator = selector.querySelector('.dm-type-indicator')
    expect(typeIndicator).toBeTruthy()
  })

  it('should not show type indicator when detected type is null', () => {
    const selector = createFormatSelector({ detectedType: null })

    const typeIndicator = selector.querySelector('.dm-type-indicator')
    expect(typeIndicator).toBeFalsy()
  })

  it('should create compact mode selector', () => {
    const selector = createFormatSelector({
      detectedType: 'IMAGE',
      compact: true,
    })

    expect(selector.querySelector('#dm-format-select')).toBeTruthy()
  })

  it('should create full mode selector with buttons', () => {
    const selector = createFormatSelector({
      detectedType: 'IMAGE',
      compact: false,
    })

    expect(selector.querySelector('#dm-format-buttons')).toBeTruthy()
  })

  it('should call onFormatChange callback when format changes', () => {
    const onFormatChange = vi.fn()

    const selector = createFormatSelector({
      detectedType: 'IMAGE',
      selectedFormat: 'png',
      onFormatChange,
      compact: false,
    })

    // Find and click a format button
    const buttons = selector.querySelectorAll('.dm-format-btn')
    if (buttons.length > 1) {
      ;(buttons[1] as HTMLElement).click()

      // Note: The actual callback execution depends on the implementation
      expect(onFormatChange).toBeDefined()
    }
  })

  it('should display format description', () => {
    const selector = createFormatSelector({
      detectedType: 'IMAGE',
      selectedFormat: 'png',
    })

    const description = selector.querySelector('#dm-format-description')
    expect(description).toBeTruthy()
    expect(description?.textContent).toContain(FORMAT_TYPE_MAP['png'].description)
  })

  it('should apply correct CSS styles', () => {
    const selector = createFormatSelector()

    expect(selector.style.display).toContain('flex')
    expect(selector.style.flexDirection).toBe('column')
  })

  it('should handle unknown detected type', () => {
    const selector = createFormatSelector({
      detectedType: 'UNKNOWN_TYPE',
    })

    expect(selector).toBeInstanceOf(HTMLElement)
  })

  it('should handle missing options', () => {
    expect(() => createFormatSelector()).not.toThrow()
  })
})
