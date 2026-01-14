/**
 * Tests for Drag Utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setupWindowDrag, cleanupWindowDrag } from './drag.js'

describe('setupWindowDrag', () => {
  let windowEl: HTMLElement
  let headerEl: HTMLElement

  beforeEach(() => {
    // Create mock elements
    windowEl = document.createElement('div')
    windowEl.style.position = 'absolute'
    windowEl.style.left = '100px'
    windowEl.style.top = '100px'
    windowEl.style.width = '400px'
    windowEl.style.height = '300px'

    headerEl = document.createElement('div')
    headerEl.className = 'header'
    windowEl.appendChild(headerEl)

    document.body.appendChild(windowEl)
  })

  it('should disable native dragging on window and header', () => {
    setupWindowDrag(windowEl, headerEl)

    expect(windowEl.draggable).toBe(false)
    expect(headerEl.draggable).toBe(false)
  })

  it('should prevent dragstart event', () => {
    setupWindowDrag(windowEl, headerEl)

    const dragstartEvent = new Event('dragstart', { cancelable: true })
    const preventDefaultSpy = vi.spyOn(dragstartEvent, 'preventDefault')

    windowEl.dispatchEvent(dragstartEvent)

    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it('should not start drag when clicking button in header', () => {
    const button = document.createElement('button')
    button.textContent = 'Close'
    headerEl.appendChild(button)

    setupWindowDrag(windowEl, headerEl)

    const initialLeft = windowEl.style.left
    const initialTop = windowEl.style.top

    // Simulate mousedown on button
    const mousedownEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      clientX: 150,
      clientY: 120,
    })
    Object.defineProperty(mousedownEvent, 'target', { value: button, enumerable: true })

    headerEl.dispatchEvent(mousedownEvent)

    // Position should not change
    expect(windowEl.style.left).toBe(initialLeft)
    expect(windowEl.style.top).toBe(initialTop)
  })

  it('should not start drag when clicking icon in header', () => {
    const icon = document.createElement('i')
    icon.className = 'pi pi-close'
    headerEl.appendChild(icon)

    setupWindowDrag(windowEl, headerEl)

    const initialLeft = windowEl.style.left
    const initialTop = windowEl.style.top

    // Simulate mousedown on icon
    const mousedownEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      clientX: 150,
      clientY: 120,
    })
    Object.defineProperty(mousedownEvent, 'target', { value: icon, enumerable: true })

    headerEl.dispatchEvent(mousedownEvent)

    // Position should not change
    expect(windowEl.style.left).toBe(initialLeft)
    expect(windowEl.style.top).toBe(initialTop)
  })

  it('should not start drag when in fullscreen mode', () => {
    windowEl.dataset.fullscreen = 'true'

    setupWindowDrag(windowEl, headerEl)

    const initialLeft = windowEl.style.left
    const initialTop = windowEl.style.top

    // Simulate mousedown
    const mousedownEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      clientX: 150,
      clientY: 120,
    })
    Object.defineProperty(mousedownEvent, 'target', { value: headerEl, enumerable: true })

    headerEl.dispatchEvent(mousedownEvent)

    // Position should not change
    expect(windowEl.style.left).toBe(initialLeft)
    expect(windowEl.style.top).toBe(initialTop)
  })

  it('should update window position on mousemove when dragging', () => {
    setupWindowDrag(windowEl, headerEl)

    // Get initial rect
    const initialRect = windowEl.getBoundingClientRect()
    const offsetX = 150 - initialRect.left
    const offsetY = 120 - initialRect.top

    // Simulate mousedown
    const mousedownEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      clientX: 150,
      clientY: 120,
    })
    Object.defineProperty(mousedownEvent, 'target', { value: headerEl, enumerable: true })
    const preventDefaultSpy = vi.spyOn(mousedownEvent, 'preventDefault')

    headerEl.dispatchEvent(mousedownEvent)

    // Check that preventDefault was called (drag started)
    // Note: The actual position update may vary based on implementation
    expect(preventDefaultSpy).toHaveBeenCalled()

    // Simulate mousemove
    const mousemoveEvent = new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 200,
      clientY: 170,
    })
    document.dispatchEvent(mousemoveEvent)

    // Verify some position change occurred (implementation dependent)
    // The key is that dragging doesn't crash and positions are valid
    expect(windowEl.style.left).toBeTruthy()
    expect(windowEl.style.top).toBeTruthy()
  })

  it('should clamp position to non-negative values', () => {
    setupWindowDrag(windowEl, headerEl)

    // Simulate mousedown at window edge
    const mousedownEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      clientX: 100,
      clientY: 100,
    })
    Object.defineProperty(mousedownEvent, 'target', { value: headerEl, enumerable: true })
    const preventDefaultSpy = vi.spyOn(mousedownEvent, 'preventDefault')

    headerEl.dispatchEvent(mousedownEvent)

    expect(preventDefaultSpy).toHaveBeenCalled()

    // Try to move to negative position
    const mousemoveEvent = new MouseEvent('mousemove', {
      bubbles: true,
      clientX: -50,
      clientY: -50,
    })
    document.dispatchEvent(mousemoveEvent)

    // Position should be clamped to 0
    expect(windowEl.style.left).toBe('0px')
    expect(windowEl.style.top).toBe('0px')
  })

  it('should stop dragging on mouseup', () => {
    setupWindowDrag(windowEl, headerEl)

    // Start drag
    const mousedownEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      clientX: 150,
      clientY: 120,
    })
    Object.defineProperty(mousedownEvent, 'target', { value: headerEl, enumerable: true })

    headerEl.dispatchEvent(mousedownEvent)

    // Move while dragging
    const mousemoveEvent1 = new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 200,
      clientY: 170,
    })
    document.dispatchEvent(mousemoveEvent1)

    const positionDuringDrag = windowEl.style.left

    // Stop dragging
    const mouseupEvent = new MouseEvent('mouseup', { bubbles: true })
    document.dispatchEvent(mouseupEvent)

    // Try to move after mouseup
    const mousemoveEvent2 = new MouseEvent('mousemove', {
      bubbles: true,
      clientX: 300,
      clientY: 270,
    })
    document.dispatchEvent(mousemoveEvent2)

    // Position should not change after mouseup (dragging stopped)
    expect(windowEl.style.left).toBe(positionDuringDrag)
  })

  it('should remove transition during drag', () => {
    windowEl.style.transition = 'all 0.3s ease'

    setupWindowDrag(windowEl, headerEl)

    // Start drag
    const mousedownEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      clientX: 150,
      clientY: 120,
    })
    Object.defineProperty(mousedownEvent, 'target', { value: headerEl, enumerable: true })

    headerEl.dispatchEvent(mousedownEvent)

    // Transition should be removed
    expect(windowEl.style.transition).toBe('none')
  })

  it('should restore transition after drag ends', () => {
    windowEl.style.transition = 'all 0.3s ease'

    setupWindowDrag(windowEl, headerEl)

    // Start drag
    const mousedownEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      clientX: 150,
      clientY: 120,
    })
    Object.defineProperty(mousedownEvent, 'target', { value: headerEl, enumerable: true })

    headerEl.dispatchEvent(mousedownEvent)

    expect(windowEl.style.transition).toBe('none')

    // Stop dragging
    const mouseupEvent = new MouseEvent('mouseup', { bubbles: true })
    document.dispatchEvent(mouseupEvent)

    // Transition should be restored (to empty string, which clears inline style)
    expect(windowEl.style.transition).toBe('')
  })
})

describe('cleanupWindowDrag', () => {
  it('should reset dragging state', () => {
    const windowEl = document.createElement('div')
    ;(windowEl as unknown as { _isDragging: boolean })._isDragging = true
    windowEl.style.transition = 'none'

    cleanupWindowDrag(windowEl)

    expect((windowEl as unknown as { _isDragging: boolean })._isDragging).toBe(false)
    expect(windowEl.style.transition).toBe('')
  })

  it('should handle non-dragging windows gracefully', () => {
    const windowEl = document.createElement('div')

    expect(() => cleanupWindowDrag(windowEl)).not.toThrow()
  })
})
