/**
 * ComfyUI Data Manager - State Management
 */

// ==================== Types ====================

export type ViewMode = 'list' | 'grid'
export type SortBy = 'name' | 'size' | 'modified'
export type SortOrder = 'asc' | 'desc'

export interface FileItem {
  name: string
  path?: string
  size?: number
  modified?: number | string
  is_dir?: boolean
  isDir?: boolean // Alias for compatibility
  type?: string
}

export interface FileManagerStateData {
  currentPath: string
  selectedFiles: string[] // Array of file paths (strings)
  currentPreviewFile: string | null
  viewMode: ViewMode
  sortBy: SortBy
  sortOrder: SortOrder
  files: FileItem[]
  history: string[]
  historyIndex: number
}

export interface RemoteConnection {
  id: string
  name: string
  host: string
  port: number
  username: string
  password?: string
  keyPath?: string
}

export interface RemoteConnectionsState {
  active: RemoteConnection | null
  saved: RemoteConnection[]
}

// ==================== Storage Keys ====================

export const STORAGE_KEYS = {
  LAST_PATH: 'comfyui_datamanager_last_path',
  VIEW_MODE: 'comfyui_datamanager_view_mode',
  SORT_BY: 'comfyui_datamanager_sort_by',
  REMOTE_CONNECTIONS: 'comfyui_datamanager_remote_connections',
  LAST_CONNECTION: 'comfyui_datamanager_last_connection',
} as const

// ==================== File Manager State ====================

export const FileManagerState: FileManagerStateData = {
  currentPath: '',
  selectedFiles: [],
  currentPreviewFile: null,
  viewMode: 'list',
  sortBy: 'name',
  sortOrder: 'asc',
  files: [],
  history: [],
  historyIndex: -1,
}

// ==================== Storage Functions ====================

export function saveState(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn('[DataManager] Failed to save state:', e)
  }
}

export function loadState<T>(key: string, defaultValue: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? (JSON.parse(value) as T) : defaultValue
  } catch (e) {
    console.warn('[DataManager] Failed to load state:', e)
    return defaultValue
  }
}

export function saveLastPath(path: string): void {
  saveState(STORAGE_KEYS.LAST_PATH, path)
}

export function getLastPath(): string {
  return loadState<string>(STORAGE_KEYS.LAST_PATH, '.')
}

export function saveViewMode(mode: ViewMode): void {
  saveState(STORAGE_KEYS.VIEW_MODE, mode)
}

export function getViewMode(): ViewMode {
  return loadState<ViewMode>(STORAGE_KEYS.VIEW_MODE, 'list')
}

// ==================== Global Variables ====================

export let fileManagerWindow: Window | null = null
export let previewModal: HTMLElement | null = null
export let previewFloatingWindows: FloatingWindowData[] = []

// ==================== SSH Remote Connection State ====================

const REMOTE_STORAGE_KEY = STORAGE_KEYS.REMOTE_CONNECTIONS
const LAST_CONN_STORAGE_KEY = STORAGE_KEYS.LAST_CONNECTION

// Initialize remote connections state
let remoteConnectionsStateValue: RemoteConnectionsState = {
  active: null,
  saved: [],
}

// Initialize remote connections
function initRemoteConnections(): void {
  try {
    const saved = localStorage.getItem(REMOTE_STORAGE_KEY)
    if (saved) {
      remoteConnectionsStateValue.saved = JSON.parse(saved)
    }
    const lastConn = localStorage.getItem(LAST_CONN_STORAGE_KEY)
    if (lastConn) {
      remoteConnectionsStateValue.active = JSON.parse(lastConn)
    }
    // Update window reference (for compatibility with existing code)
    if (window._remoteConnectionsState) {
      window._remoteConnectionsState.active = remoteConnectionsStateValue.active
      window._remoteConnectionsState.saved = remoteConnectionsStateValue.saved
    } else {
      window._remoteConnectionsState = remoteConnectionsStateValue
    }
  } catch (e) {
    console.warn('[DataManager] Failed to init remote connections:', e)
  }
}

// Initialize immediately
initRemoteConnections()

// Export for external use
export const remoteConnectionsState = remoteConnectionsStateValue
