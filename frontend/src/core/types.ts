/**
 * ComfyUI Data Manager - Type Definitions
 */

// Re-export commonly used types from state module
export type {
  ViewMode,
  SortBy,
  SortOrder,
  FileItem,
  FileManagerStateData,
  RemoteConnection,
  RemoteConnectionsState
} from './state.js';

// Re-export FileTypeConfig from constants module
export type { FileTypeConfig } from './constants.js';

// ==================== Additional Types ====================

export interface PreviewFileInfo {
  path: string;
  name: string;
  size: number;
  modified: number;
  type: string;
  exists: boolean;
}

export interface DirectoryEntry {
  name: string;
  path: string;
  isDir: boolean;
  size?: number;
  modified?: number;
  type?: string;
}

export interface FloatingWindowState {
  path: string;
  window: Window;
  dockItem?: HTMLElement;
}

export interface ToastOptions {
  text: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

export interface ComfyExtensionConfig {
  name: string;
  version?: string;
  setup?: () => void;
  cleanup?: () => void;
  [key: string]: unknown;
}

export interface ComfyApp {
  registerExtension(config: ComfyExtensionConfig): void;
  ui?: {
    version?: {
      major: number;
      minor: number;
      patch: number;
    };
  };
  graph?: {
    _nodes: unknown[];
    add: (node: unknown) => void;
    remove: (node: unknown) => void;
    serialize: () => unknown;
    getNodeById: (id: number) => unknown | undefined;
  };
  extensionManager?: {
    toast?: {
      add: (message: ToastOptions) => void;
    };
  };
}
