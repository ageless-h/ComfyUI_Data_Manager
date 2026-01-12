/**
 * core-constants.js - 常量配置
 */

// ==================== API 端点 ====================
export const API_ENDPOINTS = {
    LIST: "/dm/list",
    PREVIEW: "/dm/preview",
    INFO: "/dm/info",
    CREATE_FILE: "/dm/create/file",
    CREATE_DIRECTORY: "/dm/create/directory",
    DELETE: "/dm/delete"
};

// ==================== 限制常量 ====================
export const LIMITS = {
    // 表格
    MAX_PREVIEW_ROWS: 100,

    // 代码预览
    MAX_CODE_LENGTH: 50000,

    // 缩放
    MIN_ZOOM: 0.1,
    MAX_ZOOM: 5,
    DEFAULT_ZOOM_STEP: 25,
    MIN_ZOOM_DISPLAY: 25,
    MAX_ZOOM_DISPLAY: 300,

    // 字体大小
    MIN_FONT_SIZE: 8,
    MAX_FONT_SIZE: 32,

    // 窗口
    DEFAULT_WINDOW_WIDTH: 1200,
    DEFAULT_WINDOW_HEIGHT: 700,
    FLOATING_Z_INDEX: 10001
};

// ==================== 文件类型配置 ====================
export const FILE_TYPES = {
    image: {
        exts: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico', '.tiff', '.tif', '.avif', '.heic', '.heif', '.tga'],
        icon: 'pi-image',
        color: '#e74c3c'
    },
    video: {
        // 浏览器可预览的视频格式
        exts: ['.mp4', '.webm', '.mov', '.mkv'],
        icon: 'pi-video',
        color: '#9b59b6'
    },
    // 外部播放器格式的视频（AVI 等需要外部播放器）
    videoExternal: {
        exts: ['.avi'],
        icon: 'pi-video',
        color: '#8e44ad'
    },
    audio: {
        exts: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a'],
        icon: 'pi-volume-up',
        color: '#3498db'
    },
    document: {
        exts: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.md'],
        icon: 'pi-file',
        color: '#95a5a6'
    },
    spreadsheet: {
        exts: ['.xls', '.xlsx', '.csv', '.ods'],
        icon: 'pi-table',
        color: '#27ae60'
    },
    archive: {
        exts: ['.zip', '.rar', '.7z', '.tar', '.gz'],
        icon: 'pi-box',
        color: '#f39c12'
    },
    code: {
        exts: ['.py', '.js', '.html', '.css', '.json', '.xml', '.yaml', '.yml', '.cpp', '.c', '.h'],
        icon: 'pi-code',
        color: '#1abc9c'
    },
    folder: {
        icon: 'pi-folder',
        color: '#f1c40f'
    },
    unknown: {
        icon: 'pi-file',
        color: '#7f8c8d'
    }
};
