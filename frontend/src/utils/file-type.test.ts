/**
 * Tests for File Type Detection Utilities
 */

import { describe, it, expect } from 'vitest'
import { getFileType, getTypeByExt } from './file-type.js'

describe('getFileType', () => {
  describe('folder detection', () => {
    it('should return "folder" for directories', () => {
      expect(getFileType({ is_dir: true })).toBe('folder')
    })

    it('should prioritize is_dir over extension', () => {
      expect(getFileType({ name: 'test.jpg', is_dir: true })).toBe('folder')
    })
  })

  describe('image files', () => {
    it('should detect common image formats', () => {
      expect(getFileType({ name: 'photo.jpg' })).toBe('image')
      expect(getFileType({ name: 'photo.jpeg' })).toBe('image')
      expect(getFileType({ name: 'photo.png' })).toBe('image')
      expect(getFileType({ name: 'photo.gif' })).toBe('image')
      expect(getFileType({ name: 'photo.webp' })).toBe('image')
      expect(getFileType({ name: 'photo.svg' })).toBe('image')
      expect(getFileType({ name: 'photo.bmp' })).toBe('image')
      expect(getFileType({ name: 'photo.ico' })).toBe('image')
    })

    it('should detect less common image formats', () => {
      expect(getFileType({ name: 'photo.tiff' })).toBe('image')
      expect(getFileType({ name: 'photo.tif' })).toBe('image')
      expect(getFileType({ name: 'photo.avif' })).toBe('image')
      expect(getFileType({ name: 'photo.heic' })).toBe('image')
      expect(getFileType({ name: 'photo.tga' })).toBe('image')
    })
  })

  describe('video files', () => {
    it('should detect common video formats', () => {
      expect(getFileType({ name: 'video.mp4' })).toBe('video')
      expect(getFileType({ name: 'video.webm' })).toBe('video')
      expect(getFileType({ name: 'video.mov' })).toBe('video')
      expect(getFileType({ name: 'video.mkv' })).toBe('video')
    })

    it('should detect external video formats', () => {
      expect(getFileType({ name: 'video.avi' })).toBe('videoExternal')
    })
  })

  describe('audio files', () => {
    it('should detect common audio formats', () => {
      expect(getFileType({ name: 'audio.mp3' })).toBe('audio')
      expect(getFileType({ name: 'audio.wav' })).toBe('audio')
      expect(getFileType({ name: 'audio.flac' })).toBe('audio')
      expect(getFileType({ name: 'audio.aac' })).toBe('audio')
      expect(getFileType({ name: 'audio.ogg' })).toBe('audio')
      expect(getFileType({ name: 'audio.m4a' })).toBe('audio')
    })
  })

  describe('document files', () => {
    it('should detect document formats', () => {
      expect(getFileType({ name: 'doc.pdf' })).toBe('document')
      expect(getFileType({ name: 'doc.doc' })).toBe('document')
      expect(getFileType({ name: 'doc.docx' })).toBe('document')
      expect(getFileType({ name: 'doc.txt' })).toBe('document')
      expect(getFileType({ name: 'doc.md' })).toBe('document')
      expect(getFileType({ name: 'doc.rtf' })).toBe('document')
    })
  })

  describe('spreadsheet files', () => {
    it('should detect spreadsheet formats', () => {
      expect(getFileType({ name: 'data.xls' })).toBe('spreadsheet')
      expect(getFileType({ name: 'data.xlsx' })).toBe('spreadsheet')
      expect(getFileType({ name: 'data.csv' })).toBe('spreadsheet')
      expect(getFileType({ name: 'data.ods' })).toBe('spreadsheet')
    })
  })

  describe('archive files', () => {
    it('should detect archive formats', () => {
      expect(getFileType({ name: 'archive.zip' })).toBe('archive')
      expect(getFileType({ name: 'archive.rar' })).toBe('archive')
      expect(getFileType({ name: 'archive.7z' })).toBe('archive')
      expect(getFileType({ name: 'archive.tar' })).toBe('archive')
      expect(getFileType({ name: 'archive.gz' })).toBe('archive')
    })
  })

  describe('code files', () => {
    it('should detect code formats', () => {
      expect(getFileType({ name: 'script.py' })).toBe('code')
      expect(getFileType({ name: 'script.js' })).toBe('code')
      expect(getFileType({ name: 'page.html' })).toBe('code')
      expect(getFileType({ name: 'style.css' })).toBe('code')
      expect(getFileType({ name: 'data.json' })).toBe('code')
      expect(getFileType({ name: 'config.xml' })).toBe('code')
      expect(getFileType({ name: 'config.yaml' })).toBe('code')
      expect(getFileType({ name: 'config.yml' })).toBe('code')
      expect(getFileType({ name: 'main.cpp' })).toBe('code')
      expect(getFileType({ name: 'main.c' })).toBe('code')
      expect(getFileType({ name: 'header.h' })).toBe('code')
    })
  })

  describe('unknown files', () => {
    it('should return "unknown" for unrecognized extensions', () => {
      expect(getFileType({ name: 'file.xyz' })).toBe('unknown')
      expect(getFileType({ name: 'file.unknown' })).toBe('unknown')
    })

    it('should return "unknown" for files without extension', () => {
      expect(getFileType({ name: 'file' })).toBe('unknown')
      expect(getFileType({ name: 'Makefile' })).toBe('unknown')
    })

    it('should handle empty name', () => {
      expect(getFileType({ name: '' })).toBe('unknown')
    })

    it('should handle missing name property', () => {
      expect(getFileType({})).toBe('unknown')
    })
  })

  describe('case insensitivity', () => {
    it('should handle uppercase extensions', () => {
      expect(getFileType({ name: 'photo.JPG' })).toBe('image')
      expect(getFileType({ name: 'photo.PNG' })).toBe('image')
      expect(getFileType({ name: 'document.PDF' })).toBe('document')
    })

    it('should handle mixed case extensions', () => {
      expect(getFileType({ name: 'photo.JpG' })).toBe('image')
      expect(getFileType({ name: 'document.PdF' })).toBe('document')
    })
  })

  describe('path property support', () => {
    it('should extract extension from path when name is missing', () => {
      expect(getFileType({ path: '/path/to/photo.jpg' })).toBe('image')
      expect(getFileType({ path: '/path/to/document.pdf' })).toBe('document')
    })

    it('should prefer name over path', () => {
      expect(
        getFileType({
          name: 'photo.png',
          path: '/path/to/document.pdf',
        })
      ).toBe('image')
    })
  })
})

describe('getTypeByExt', () => {
  it('should detect file type by extension', () => {
    expect(getTypeByExt('.jpg')).toBe('image')
    expect(getTypeByExt('.png')).toBe('image')
    expect(getTypeByExt('.pdf')).toBe('document')
    expect(getTypeByExt('.csv')).toBe('spreadsheet')
  })

  it('should return "unknown" for unrecognized extensions', () => {
    expect(getTypeByExt('.xyz')).toBe('unknown')
    expect(getTypeByExt('.unknown')).toBe('unknown')
  })

  it('should handle extensions without leading dot', () => {
    expect(getTypeByExt('jpg')).toBe('unknown')
    expect(getTypeByExt('png')).toBe('unknown')
  })
})
