/**
 * ComfyUI Data Manager - Constants Configuration
 */

// ==================== API Endpoints ====================

export const API_ENDPOINTS = {
  LIST: "/dm/list",
  PREVIEW: "/dm/preview",
  INFO: "/dm/info",
  CREATE_FILE: "/dm/create/file",
  CREATE_DIRECTORY: "/dm/create/directory",
  DELETE: "/dm/delete"
} as const;

// ==================== Limits ====================

export const LIMITS = {
  // Table
  MAX_PREVIEW_ROWS: 100,

  // Code preview
  MAX_CODE_LENGTH: 50000,

  // Zoom
  MIN_ZOOM: 0.1,
  MAX_ZOOM: 5,
  DEFAULT_ZOOM_STEP: 25,
  MIN_ZOOM_DISPLAY: 25,
  MAX_ZOOM_DISPLAY: 300,

  // Font size
  MIN_FONT_SIZE: 8,
  MAX_FONT_SIZE: 32,

  // Window
  DEFAULT_WINDOW_WIDTH: 1200,
  DEFAULT_WINDOW_HEIGHT: 700,
  FLOATING_Z_INDEX: 10001
} as const;

// ==================== File Types ====================

export interface FileTypeConfig {
  exts: string[];
  icon: string;
  color: string;
}

export const FILE_TYPES: Record<string, FileTypeConfig> = {
  image: {
    exts: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico', '.tiff', '.tif', '.avif', '.heic', '.heif', '.tga'],
    icon: 'pi-image',
    color: '#e74c3c'
  },
  video: {
    exts: ['.mp4', '.webm', '.mov', '.mkv'],
    icon: 'pi-video',
    color: '#9b59b6'
  },
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
    exts: [], // Folders don't have extensions
    icon: 'pi-folder',
    color: '#f1c40f'
  },
  unknown: {
    exts: [], // Unknown files don't have specific extensions
    icon: 'pi-file',
    color: '#7f8c8d'
  }
};
