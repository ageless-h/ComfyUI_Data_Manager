/**
 * Tests for SSH API
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock fetch before importing
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('SSH API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset fetch mock to return success by default
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, connection_id: 'test_conn_123' })
    });
  });

  describe('sshConnect', () => {
    it('should connect successfully with valid credentials', async () => {
      const { sshConnect } = await import('./ssh.js');

      const result = await sshConnect('test.example.com', 22, 'testuser', 'testpass');

      expect(mockFetch).toHaveBeenCalledWith('/dm/ssh/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: 'test.example.com',
          port: 22,
          username: 'testuser',
          password: 'testpass'
        })
      });
      expect(result.success).toBe(true);
      expect(result.connection_id).toBe('test_conn_123');
    });

    it('should use default port 22 when not specified', async () => {
      const { sshConnect } = await import('./ssh.js');

      await sshConnect('test.example.com', 0, 'testuser', 'testpass');

      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callArgs.port).toBe(22);
    });

    it('should handle authentication failure', async () => {
      const { sshConnect } = await import('./ssh.js');

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: '认证失败: 用户名或密码错误' })
      });

      await expect(sshConnect('test.example.com', 22, 'testuser', 'wrongpass'))
        .rejects.toThrow('认证失败: 用户名或密码错误');
    });

    it('should handle network error', async () => {
      const { sshConnect } = await import('./ssh.js');

      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(sshConnect('test.example.com', 22, 'testuser', 'testpass'))
        .rejects.toThrow('Network error');
    });

    it('should handle connection failure', async () => {
      const { sshConnect } = await import('./ssh.js');

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: '连接失败' })
      });

      await expect(sshConnect('test.example.com', 22, 'testuser', 'testpass'))
        .rejects.toThrow('连接失败');
    });

    it('should handle empty error response', async () => {
      const { sshConnect } = await import('./ssh.js');

      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => { throw new Error('Invalid JSON'); }
      });

      await expect(sshConnect('test.example.com', 22, 'testuser', 'testpass'))
        .rejects.toThrow('连接失败');
    });
  });

  describe('sshDisconnect', () => {
    it('should disconnect successfully', async () => {
      const { sshDisconnect } = await import('./ssh.js');

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await sshDisconnect('test_conn_123');

      expect(mockFetch).toHaveBeenCalledWith('/dm/ssh/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connection_id: 'test_conn_123' })
      });
      expect(result.success).toBe(true);
    });

    it('should handle disconnect failure', async () => {
      const { sshDisconnect } = await import('./ssh.js');

      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: '连接不存在' })
      });

      await expect(sshDisconnect('nonexistent_conn'))
        .rejects.toThrow('连接不存在');
    });
  });

  describe('sshList', () => {
    it('should list directory contents', async () => {
      const { sshList } = await import('./ssh.js');

      const mockFiles = [
        { name: 'file1.txt', size: 1024, is_dir: false },
        { name: 'folder1', size: 4096, is_dir: true }
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          files: mockFiles,
          path: '/home/user',
          connection_id: 'test_conn_123'
        })
      });

      const result = await sshList('test_conn_123', '/home/user');

      expect(mockFetch).toHaveBeenCalledWith('/dm/ssh/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connection_id: 'test_conn_123',
          path: '/home/user'
        })
      });
      expect(result.files).toEqual(mockFiles);
    });

    it('should use default path "." when not specified', async () => {
      const { sshList } = await import('./ssh.js');

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, files: [], path: '.', connection_id: 'test_conn_123' })
      });

      await sshList('test_conn_123');

      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callArgs.path).toBe('.');
    });

    it('should handle list error', async () => {
      const { sshList } = await import('./ssh.js');

      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: '路径不存在' })
      });

      await expect(sshList('test_conn_123', '/nonexistent'))
        .rejects.toThrow('路径不存在');
    });
  });
});
