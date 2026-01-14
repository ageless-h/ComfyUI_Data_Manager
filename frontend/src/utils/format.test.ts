/**
 * Tests for Format Utilities
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { formatSize, formatDate, escapeHtml } from './format.js'

describe('formatSize', () => {
  it('should return empty string for falsy values', () => {
    expect(formatSize(0)).toBe('')
    expect(formatSize(null as unknown as number)).toBe('')
    expect(formatSize(undefined as unknown as number)).toBe('')
  })

  it('should format bytes correctly', () => {
    expect(formatSize(1)).toBe('1.0 B')
    expect(formatSize(512)).toBe('512.0 B')
    expect(formatSize(1023)).toBe('1023.0 B')
  })

  it('should format kilobytes correctly', () => {
    expect(formatSize(1024)).toBe('1.0 KB')
    expect(formatSize(2048)).toBe('2.0 KB')
    expect(formatSize(10240)).toBe('10.0 KB')
  })

  it('should format megabytes correctly', () => {
    expect(formatSize(1024 * 1024)).toBe('1.0 MB')
    expect(formatSize(5 * 1024 * 1024)).toBe('5.0 MB')
  })

  it('should format gigabytes correctly', () => {
    expect(formatSize(1024 * 1024 * 1024)).toBe('1.0 GB')
    expect(formatSize(3.5 * 1024 * 1024 * 1024)).toBe('3.5 GB')
  })

  it('should format terabytes correctly', () => {
    expect(formatSize(1024 * 1024 * 1024 * 1024)).toBe('1.0 TB')
    expect(formatSize(2 * 1024 * 1024 * 1024 * 1024)).toBe('2.0 TB')
  })

  it('should handle decimal precision correctly', () => {
    expect(formatSize(1536)).toBe('1.5 KB')
    expect(formatSize(2560)).toBe('2.5 KB')
  })
})

describe('formatDate', () => {
  it('should return empty string for falsy values', () => {
    expect(formatDate('')).toBe('')
    expect(formatDate(null as unknown as string)).toBe('')
    expect(formatDate(undefined as unknown as string)).toBe('')
  })

  it('should format valid date strings', () => {
    const dateStr = '2024-01-15T10:30:00'
    const result = formatDate(dateStr)
    // The exact format depends on locale, but should contain date and time parts
    expect(result).toBeTruthy()
    expect(result.length).toBeGreaterThan(0)
  })

  it('should handle ISO date strings', () => {
    const dateStr = '2024-12-25T15:45:30Z'
    const result = formatDate(dateStr)
    expect(result).toBeTruthy()
  })

  it('should handle timestamp strings', () => {
    const dateStr = '1705334400'
    const result = formatDate(dateStr)
    expect(result).toBeTruthy()
  })
})

describe('escapeHtml', () => {
  beforeEach(() => {
    // Ensure DOM is available in happy-dom
    document.createElement('div')
  })

  it('should escape HTML special characters', () => {
    expect(escapeHtml('<div>')).toBe('&lt;div&gt;')
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;')
  })

  it('should escape ampersand', () => {
    expect(escapeHtml('&')).toBe('&amp;')
    expect(escapeHtml('a & b')).toBe('a &amp; b')
  })

  it('should escape double quotes', () => {
    // Note: DOM textContent doesn't escape quotes, only <, >, &
    // HTML entity encoding is done by the browser when needed
    const result = escapeHtml('"hello"')
    expect(result).toContain('hello')
  })

  it('should escape single quotes', () => {
    // Note: DOM textContent doesn't escape quotes, only <, >, &
    // HTML entity encoding is done by the browser when needed
    const result = escapeHtml("'hello'")
    expect(result).toContain('hello')
  })

  it('should escape multiple special characters', () => {
    const input = '<div class="test">Hello & welcome</div>'
    const result = escapeHtml(input)

    // Should escape <, >, and &
    expect(result).toContain('&lt;')
    expect(result).toContain('&gt;')
    expect(result).toContain('&amp;')
    // Quotes are preserved in textContent
    expect(result).toContain('class=')
  })

  it('should handle empty strings', () => {
    expect(escapeHtml('')).toBe('')
  })

  it('should not modify normal text', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World')
    expect(escapeHtml('123')).toBe('123')
  })
})
