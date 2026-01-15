// -*- coding: utf-8 -*-
/**
 * UI Components 测试 Fixtures
 *
 * 为 ui/components/ 模块测试提供 mock 数据和辅助工具
 */

import type { FileItem } from '../../src/core/state.js'
import type { ComfyTheme } from '../../src/utils/theme.js'

/**
 * Mock 文件项数据
 */
export const mockFileItems: FileItem[] = [
  {
    name: 'image1.png',
    path: '/test/image1.png',
    is_dir: false,
    size: 1024,
    modified: '2024-01-15T10:30:00Z',
  },
  {
    name: 'image2.jpg',
    path: '/test/image2.jpg',
    is_dir: false,
    size: 2048,
    modified: '2024-01-14T15:20:00Z',
  },
  {
    name: 'document.pdf',
    path: '/test/document.pdf',
    is_dir: false,
    size: 4096,
    modified: '2024-01-13T09:10:00Z',
  },
  {
    name: 'folder',
    path: '/test/folder',
    is_dir: true,
    size: 0,
  },
  {
    name: 'video.mp4',
    path: '/test/video.mp4',
    is_dir: false,
    size: 1048576,
    modified: '2024-01-12T14:00:00Z',
  },
]

/**
 * Mock 目录结构（嵌套）
 */
export const mockNestedFiles: FileItem[] = [
  {
    name: 'subfolder',
    path: '/test/subfolder',
    is_dir: true,
    size: 0,
  },
  {
    name: 'file.txt',
    path: '/test/file.txt',
    is_dir: false,
    size: 512,
  },
]

/**
 * Mock 主题配置
 */
export const mockTheme: ComfyTheme = {
  bgPrimary: '#1a1a1a',
  bgSecondary: '#2a2a2a',
  bgTertiary: '#3a3a3a',
  textPrimary: '#ffffff',
  textSecondary: '#a0a0a0',
  inputBg: '#2a2a2a',
  inputText: '#ffffff',
  borderColor: '#4a4a4a',
  accentColor: '#3498db',
  successColor: '#27ae60',
  errorColor: '#e74c3c',
  warningColor: '#f39c12',
  dragColor: '#e74c3c',
  menuBg: '#2a2a2a',
}

/**
 * Mock SSH 连接数据
 */
export const mockSSHConnection = {
  id: 'conn-001',
  connection_id: 'ssh-conn-123',
  name: 'My Server',
  host: '192.168.1.100',
  port: 22,
  username: 'admin',
  password: 'cGFzc3dvcmQxMjM=', // base64 encoded
  root_path: '/home/admin',
}

/**
 * Mock SSH 凭证列表
 */
export const mockSSHCredentials = [
  {
    id: 'conn-001',
    name: 'Production Server',
    host: '192.168.1.100',
    port: 22,
    username: 'admin',
    password: 'cGFzc3dvcmQ=',
    created: '2024-01-15T10:00:00Z',
  },
  {
    id: 'conn-002',
    name: 'Development Server',
    host: 'localhost',
    port: 2222,
    username: 'dev',
    password: 'ZGV2cGFzcw==',
    created: '2024-01-14T08:00:00Z',
  },
]

/**
 * Mock API 响应数据
 */
export const mockApiResponses = {
  listDirectory: {
    files: mockFileItems,
    path: '/test',
  },
  emptyDirectory: {
    files: [],
    path: '/empty',
  },
  rootDirectory: {
    files: [
      { name: 'input', path: 'input', is_dir: true },
      { name: 'output', path: 'output', is_dir: true },
    ],
    path: '.',
  },
  sshList: {
    files: mockNestedFiles,
    path: '/home/admin',
  },
  sshConnectSuccess: {
    connection_id: 'ssh-conn-123',
    root_path: '/home/admin',
  },
  sshCredentialsList: {
    success: true,
    credentials: mockSSHCredentials,
  },
}

/**
 * 创建 mock DOM 元素的辅助函数
 */
export function createMockDOM(): void {
  // 清理现有 DOM
  document.body.innerHTML = ''

  // 创建文件管理器容器
  const fileManager = document.createElement('div')
  fileManager.id = 'dm-file-manager'
  document.body.appendChild(fileManager)

  // 创建文件列表容器
  const fileList = document.createElement('div')
  fileList.id = 'dm-file-list'
  document.body.appendChild(fileList)

  // 创建预览内容容器
  const previewContent = document.createElement('div')
  previewContent.id = 'dm-preview-content'
  document.body.appendChild(previewContent)

  // 创建文件信息区域
  const fileInfo = document.createElement('div')
  fileInfo.id = 'dm-file-info'
  document.body.appendChild(fileInfo)

  // 创建路径输入框
  const pathInput = document.createElement('input')
  pathInput.id = 'dm-path-input'
  pathInput.type = 'text'
  document.body.appendChild(pathInput)

  // 创建状态显示区域
  const status = document.createElement('div')
  status.id = 'dm-status'
  document.body.appendChild(status)
}

/**
 * 清理 mock DOM
 */
export function cleanupMockDOM(): void {
  document.body.innerHTML = ''
}

/**
 * Mock FileManagerState 重置函数
 */
export function resetMockState(state: {
  files: FileItem[]
  currentPath: string
  selectedFiles: string[]
  history: string[]
  historyIndex: number
  sortBy: 'name' | 'size' | 'modified'
  sortOrder: 'asc' | 'desc'
  viewMode: 'list' | 'grid'
}): void {
  state.files = []
  state.currentPath = '.'
  state.selectedFiles = []
  state.history = ['.']
  state.historyIndex = 0
  state.sortBy = 'name'
  state.sortOrder = 'asc'
  state.viewMode = 'list'
}
