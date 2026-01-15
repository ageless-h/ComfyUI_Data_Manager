// -*- coding: utf-8 -*-
/**
 * 测试数据
 *
 * 通用的测试数据用于各种测试场景
 */

export const mockTestFiles = [
  { name: 'image1.png', type: 'image/png', size: 1024 },
  { name: 'image2.jpg', type: 'image/jpeg', size: 2048 },
  { name: 'document.pdf', type: 'application/pdf', size: 4096 },
  { name: 'video.mp4', type: 'video/mp4', size: 1048576 },
  { name: 'audio.mp3', type: 'audio/mpeg', size: 524288 },
];

export const mockDirectories = [
  { name: 'output', path: '/output', is_dir: true },
  { name: 'input', path: '/input', is_dir: true },
  { name: 'models', path: '/models', is_dir: true },
];

export const mockSettings = {
  viewMode: 'list',
  showHiddenFiles: false,
  sortBy: 'name',
  sortOrder: 'asc',
};

export const mockPreviewData = {
  image: {
    src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    width: 512,
    height: 512,
    alt: 'Test image',
  },
  video: {
    src: '/test/video.mp4',
    type: 'video/mp4',
    duration: 30,
  },
  audio: {
    src: '/test/audio.mp3',
    type: 'audio/mpeg',
    duration: 120,
  },
};
