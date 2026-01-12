/**
 * core-state.js - 全局状态管理
 */

// 存储键名
const STORAGE_KEYS = {
    LAST_PATH: 'comfyui_datamanager_last_path',
    VIEW_MODE: 'comfyui_datamanager_view_mode',
    SORT_BY: 'comfyui_datamanager_sort_by'
};

// 文件管理器状态
export const FileManagerState = {
    currentPath: '',
    selectedFiles: [],
    currentPreviewFile: null,  // 当前正在预览的文件路径
    viewMode: 'list',  // 'list' or 'grid'
    sortBy: 'name',    // 'name', 'size', 'modified'
    sortOrder: 'asc',  // 'asc' or 'desc'
    files: [],
    history: [],
    historyIndex: -1,
};

/**
 * 保存状态到 localStorage
 */
export function saveState(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.warn('[DataManager] Failed to save state:', e);
    }
}

/**
 * 从 localStorage 加载状态
 */
export function loadState(key, defaultValue = null) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : defaultValue;
    } catch (e) {
        console.warn('[DataManager] Failed to load state:', e);
        return defaultValue;
    }
}

/**
 * 保存最后访问的路径
 */
export function saveLastPath(path) {
    saveState(STORAGE_KEYS.LAST_PATH, path);
}

/**
 * 获取最后访问的路径
 */
export function getLastPath() {
    return loadState(STORAGE_KEYS.LAST_PATH, '.');
}

/**
 * 保存视图模式
 */
export function saveViewMode(mode) {
    saveState(STORAGE_KEYS.VIEW_MODE, mode);
}

/**
 * 获取视图模式
 */
export function getViewMode() {
    return loadState(STORAGE_KEYS.VIEW_MODE, 'list');
}

// 导出存储键供外部使用
export { STORAGE_KEYS };

// 全局变量
export let fileManagerWindow = null;
export let previewModal = null;
export let previewFloatingWindows = [];  // 存储所有浮动预览窗口

// ==================== SSH 远程连接状态 ====================
// 这些常量不会被其他模块直接导入，只在需要时通过 window 访问
const _REMOTE_STORAGE_KEY = 'comfyui_datamanager_remote_connections';
const _LAST_CONN_STORAGE_KEY = 'comfyui_datamanager_last_connection';

// 远程连接状态（通过 window 访问）
window._remoteConnectionsState = {
    active: null,
    saved: []
};

// 初始化远程连接状态
function _initRemoteConnections() {
    try {
        // 加载保存的连接
        const saved = localStorage.getItem(_REMOTE_STORAGE_KEY);
        if (saved) {
            window._remoteConnectionsState.saved = JSON.parse(saved);
        }
        // 加载最后使用的连接
        const lastConn = localStorage.getItem(_LAST_CONN_STORAGE_KEY);
        if (lastConn) {
            window._remoteConnectionsState.active = JSON.parse(lastConn);
        }
    } catch (e) {
        console.warn('[DataManager] Failed to init remote connections:', e);
    }
}

// 立即初始化
_initRemoteConnections();
