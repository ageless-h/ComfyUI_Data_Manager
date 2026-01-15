// -*- coding: utf-8 -*-
/**
 * API 响应测试数据
 *
 * 用于模拟 API 端点返回的数据
 */

export const mockFileListResponse = {
  success: true,
  path: '/output',
  files: [
    {
      name: 'test_image_001.png',
      path: '/output/test_image_001.png',
      size: 12345,
      size_human: '12.3 KB',
      extension: '.png',
      modified: '2026-01-16T10:00:00',
      created: '2026-01-16T10:00:00',
      is_dir: false,
      exists: true,
    },
    {
      name: 'test_image_002.png',
      path: '/output/test_image_002.png',
      size: 23456,
      size_human: '23.5 KB',
      extension: '.png',
      modified: '2026-01-16T10:01:00',
      created: '2026-01-16T10:01:00',
      is_dir: false,
      exists: true,
    },
    {
      name: 'models',
      path: '/output/models',
      size: 4096,
      size_human: '4.0 KB',
      extension: '',
      modified: '2026-01-15T08:00:00',
      created: '2026-01-15T08:00:00',
      is_dir: true,
      exists: true,
    },
  ],
  count: 3,
};

export const mockFileInfoResponse = {
  success: true,
  info: {
    name: 'test_image.png',
    path: '/output/test_image.png',
    size: 12345,
    size_human: '12.3 KB',
    extension: '.png',
    modified: '2026-01-16T10:00:00',
    created: '2026-01-16T10:00:00',
    is_dir: false,
    exists: true,
    type: 'image',
    mime_type: 'image/png',
    width: 512,
    height: 512,
  },
};

export const mockErrorResponse = (message: string, status: number) => ({
  error: message,
  status,
});

// SSH 相关 mock 数据
export const mockSSHCredentialsList = {
  success: true,
  credentials: [
    {
      id: 'test-ssh-1',
      name: 'Test Server',
      host: '192.168.1.100',
      port: 22,
      username: 'testuser',
    },
  ],
};
