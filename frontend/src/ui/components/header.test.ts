// -*- coding: utf-8 -*-
/**
 * Tests for header.ts - 窗口头部组件
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createHeader, createHeaderButton } from './header.js'
import { mockTheme, cleanupMockDOM } from '../../../tests/fixtures/ui-fixtures.js'

// Mock theme
vi.mock('../../utils/theme.js', () => ({
  getComfyTheme: () => mockTheme,
  addThemeListener: vi.fn(),
}))

describe('header', () => {
  beforeEach(() => {
    cleanupMockDOM()
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanupMockDOM()
  })

  describe('createHeader', () => {
    it('should create header with default options', () => {
      const header = createHeader()

      expect(header.className).toBe('dm-header dm-preview-header')
      expect(header.getAttribute('draggable')).toBe('false')
    })

    it('should create header with custom title', () => {
      const header = createHeader({ title: 'Custom Title' })

      expect(header.textContent).toContain('Custom Title')
    })

    it('should create header with custom icon', () => {
      const header = createHeader({ icon: 'pi-home' })

      expect(header.querySelector('.pi-home')).toBeTruthy()
    })

    it('should create traffic light buttons', () => {
      const header = createHeader()
      const trafficLights = header.querySelector('.dm-traffic-lights')

      expect(trafficLights).toBeTruthy()
      expect(trafficLights?.children.length).toBe(3) // close, minimize, fullscreen
    })

    it('should create title area with icon and text', () => {
      const header = createHeader({ title: 'Test Window' })
      const titleArea = header.querySelector('.dm-header-title-area')

      expect(titleArea).toBeTruthy()
      expect(titleArea?.textContent).toContain('Test Window')
    })

    it('should call onClose callback when close button clicked', () => {
      const onClose = vi.fn()
      const header = createHeader({ onClose })
      const closeBtn = header.querySelector('.dm-traffic-btn') as HTMLElement

      closeBtn?.click()

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should call onMinimize callback when minimize button clicked', () => {
      const onMinimize = vi.fn()
      const header = createHeader({ onMinimize })
      const buttons = header.querySelectorAll('.dm-traffic-btn')
      const minimizeBtn = buttons[1] as HTMLElement

      minimizeBtn?.click()

      expect(onMinimize).toHaveBeenCalledTimes(1)
    })

    it('should call onFullscreen callback when fullscreen button clicked', () => {
      const onFullscreen = vi.fn()
      const header = createHeader({ onFullscreen })
      const buttons = header.querySelectorAll('.dm-traffic-btn')
      const fullscreenBtn = buttons[2] as HTMLElement

      fullscreenBtn?.click()

      expect(onFullscreen).toHaveBeenCalledTimes(1)
    })

    it('should add refresh button when onRefresh provided', () => {
      const onRefresh = vi.fn()
      const header = createHeader({ onRefresh })
      const actions = header.querySelectorAll('button')
      const refreshBtn = Array.from(actions).find((btn) => btn.innerHTML.includes('pi-refresh'))

      expect(refreshBtn).toBeTruthy()
    })

    it('should call onRefresh callback when refresh button clicked', () => {
      const onRefresh = vi.fn()
      const header = createHeader({ onRefresh })
      const refreshBtn = Array.from(header.querySelectorAll('button')).find(
        (btn) => btn.innerHTML.includes('pi-refresh')
      ) as HTMLElement

      refreshBtn?.click()

      expect(onRefresh).toHaveBeenCalledTimes(1)
    })

    it('should apply theme styles', () => {
      const header = createHeader()
      const style = (header as HTMLElement).style.cssText

      expect(style).toContain('border-bottom')
      expect(style).toContain('cursor: move')
      expect(style).toContain('user-select: none')
    })

    it('should store _updateTheme function', () => {
      const header = createHeader()
      const updateFn = (header as unknown as { _updateTheme?: () => void })._updateTheme

      expect(typeof updateFn).toBe('function')
    })
  })

  describe('createHeaderButton', () => {
    it('should create button with icon', () => {
      const button = createHeaderButton('pi-refresh', 'Refresh', vi.fn())

      expect(button.innerHTML).toContain('pi-refresh')
    })

    it('should set button title', () => {
      const button = createHeaderButton('pi-refresh', 'Refresh', vi.fn())

      expect(button.title).toBe('Refresh')
    })

    it('should apply correct styles', () => {
      const button = createHeaderButton('pi-refresh', 'Refresh', vi.fn())
      const style = button.style.cssText

      expect(style).toContain('width: 28px')
      expect(style).toContain('height: 28px')
      expect(style).toContain('border-radius: 6px')
    })

    it('should call onClick callback when clicked', () => {
      const onClick = vi.fn()
      const button = createHeaderButton('pi-refresh', 'Refresh', onClick)

      button.click()

      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('should apply hover effect on mouseenter', () => {
      const button = createHeaderButton('pi-refresh', 'Refresh', vi.fn())

      button.dispatchEvent(new MouseEvent('mouseenter'))

      expect(button.style.background).toBe(mockTheme.bgTertiary)
      expect(button.style.color).toBe(mockTheme.textPrimary)
    })

    it('should remove hover effect on mouseleave', () => {
      const button = createHeaderButton('pi-refresh', 'Refresh', vi.fn())

      button.dispatchEvent(new MouseEvent('mouseenter'))
      button.dispatchEvent(new MouseEvent('mouseleave'))

      expect(button.style.background).toBe('transparent')
      expect(button.style.color).toBe(mockTheme.textSecondary)
    })
  })

  describe('createHeader - edge cases', () => {
    it('should handle null callbacks gracefully', () => {
      const header = createHeader({
        onClose: null,
        onMinimize: null,
        onFullscreen: null,
      })

      const buttons = header.querySelectorAll('.dm-traffic-btn')
      buttons.forEach((btn) => {
        expect(() => btn.click()).not.toThrow()
      })
    })

    it('should handle empty title', () => {
      const header = createHeader({ title: '' })

      expect(header.className).toBe('dm-header dm-preview-header')
    })

    it('should handle long title truncation', () => {
      const longTitle = 'This is a very long window title that should be truncated with ellipsis'
      const header = createHeader({ title: longTitle })
      const titleText = header.querySelector('.dm-header-title-area span') as HTMLElement

      expect(titleText.style.overflow).toBe('hidden')
      expect(titleText.style.textOverflow).toBe('ellipsis')
      expect(titleText.style.whiteSpace).toBe('nowrap')
    })
  })
})
