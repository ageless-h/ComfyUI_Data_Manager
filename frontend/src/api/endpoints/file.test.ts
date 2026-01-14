/**
 * Tests for File API Endpoints
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  listDirectory,
  getPreviewUrl,
  getFileInfo,
  createFile,
  createDirectory,
  deleteFile,
  type DirectoryListResponse,
  type FileInfo,
  type CreateResponse
} from './file.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('listDirectory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch directory listing successfully', async () => {
    const mockResponse: DirectoryListResponse = {
      files: [
        { name: 'file1.txt', path: '/path/file1.txt' },
        { name: 'file2.jpg', path: '/path/file2.jpg' }
      ],
      path: '/path'
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await listDirectory('/path');

    expect(mockFetch).toHaveBeenCalledWith('/dm/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: '/path' })
    });

    expect(result).toEqual(mockResponse);
  });

  it('should handle error response with error field', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Directory not found' })
    });

    await expect(listDirectory('/invalid')).rejects.toThrow(
      'Failed to list directory: Directory not found'
    );
  });

  it('should handle error response with message field', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Server error' })
    });

    await expect(listDirectory('/path')).rejects.toThrow(
      'Failed to list directory: Server error'
    );
  });

  it('should handle error response without specific message', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({})
    });

    await expect(listDirectory('/path')).rejects.toThrow(
      'Failed to list directory: HTTP 403'
    );
  });

  it('should handle malformed JSON response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => { throw new Error('Invalid JSON'); }
    });

    await expect(listDirectory('/path')).rejects.toThrow(
      'Failed to list directory: HTTP 500'
    );
  });
});

describe('getPreviewUrl', () => {
  it('should return preview URL with encoded path', () => {
    const url = getPreviewUrl('/path/to/file.txt');

    expect(url).toContain('/dm/preview?path=');
    expect(url).toContain(encodeURIComponent('/path/to/file.txt'));
  });

  it('should handle special characters in path', () => {
    const url = getPreviewUrl('/path/to/file with spaces.txt');

    expect(url).toContain('/dm/preview?path=');
    expect(url).not.toContain(' ');
    expect(url).toContain('%20');
  });

  it('should handle unicode characters in path', () => {
    const url = getPreviewUrl('/path/to/文件.txt');

    expect(url).toContain('/dm/preview?path=');
    // Unicode should be encoded
    expect(url).toContain(encodeURIComponent('/path/to/文件.txt'));
  });
});

describe('getFileInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch file info successfully', async () => {
    const mockInfo: FileInfo = {
      path: '/path/file.txt',
      name: 'file.txt',
      size: 1024,
      modified: 1234567890,
      isDir: false,
      type: 'document'
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ info: mockInfo })
    });

    const result = await getFileInfo('/path/file.txt');

    expect(mockFetch).toHaveBeenCalledWith('/dm/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: '/path/file.txt' })
    });

    expect(result).toEqual(mockInfo);
  });

  it('should handle error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'File not found' })
    });

    await expect(getFileInfo('/invalid.txt')).rejects.toThrow(
      'Failed to get file info: File not found'
    );
  });

  it('should handle missing info field', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({})
    });

    const result = await getFileInfo('/path/file.txt');

    // Should return undefined for missing info
    expect(result).toBeUndefined();
  });
});

describe('createFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create file successfully', async () => {
    const mockResponse: CreateResponse = {
      success: true,
      path: '/path/newfile.txt'
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await createFile('/path', 'newfile.txt', 'content');

    expect(mockFetch).toHaveBeenCalledWith('/dm/create/file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        directory: '/path',
        filename: 'newfile.txt',
        content: 'content'
      })
    });

    expect(result).toEqual(mockResponse);
  });

  it('should create file with default empty content', async () => {
    const mockResponse: CreateResponse = {
      success: true,
      path: '/path/newfile.txt'
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    await createFile('/path', 'newfile.txt');

    expect(mockFetch).toHaveBeenCalledWith('/dm/create/file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        directory: '/path',
        filename: 'newfile.txt',
        content: ''
      })
    });
  });

  it('should handle error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Invalid filename' })
    });

    await expect(createFile('/path', '')).rejects.toThrow(
      'Invalid filename'
    );
  });

  it('should use message field when error is missing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ message: 'Permission denied' })
    });

    await expect(createFile('/path', 'file.txt')).rejects.toThrow(
      'Permission denied'
    );
  });
});

describe('createDirectory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create directory successfully', async () => {
    const mockResponse: CreateResponse = {
      success: true,
      path: '/path/newdir'
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await createDirectory('/path', 'newdir');

    expect(mockFetch).toHaveBeenCalledWith('/dm/create/directory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        directory: '/path',
        dirname: 'newdir'
      })
    });

    expect(result).toEqual(mockResponse);
  });

  it('should handle error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Directory already exists' })
    });

    await expect(createDirectory('/path', 'existing')).rejects.toThrow(
      'Directory already exists'
    );
  });
});

describe('deleteFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete file successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    const result = await deleteFile('/path/file.txt');

    expect(mockFetch).toHaveBeenCalledWith('/dm/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: '/path/file.txt',
        use_trash: true
      })
    });

    expect(result).toEqual({ success: true });
  });

  it('should delete with useTrash option', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    await deleteFile('/path/file.txt', false);

    expect(mockFetch).toHaveBeenCalledWith('/dm/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: '/path/file.txt',
        use_trash: false
      })
    });
  });

  it('should handle error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'File not found' })
    });

    await expect(deleteFile('/invalid.txt')).rejects.toThrow(
      'File not found'
    );
  });

  it('should handle malformed error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => { throw new Error('Invalid JSON'); }
    });

    await expect(deleteFile('/path/file.txt')).rejects.toThrow(
      'Unknown error'
    );
  });
});
