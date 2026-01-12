/**
 * core-state.js - 全局状态管理
 */

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

// 全局变量
export let fileManagerWindow = null;
export let previewModal = null;
export let previewFloatingWindows = [];  // 存储所有浮动预览窗口
