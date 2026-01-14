/**
 * ComfyUI Data Manager - Extension Entry Point
 *
 * Features:
 * - File manager UI interface
 * - File preview (document/image/audio/video)
 * - File operations (create/delete/rename/copy path)
 * - Sort and view toggle
 */

// @ts-ignore - ComfyUI provides this module at runtime
import { app } from "../../scripts/app.js";

// Import core modules
import { FileManagerState, saveLastPath, getLastPath, saveViewMode, getViewMode } from './core/state.js';

// Import UI modules
import { createFileManagerWindow, destroyFileManagerWindow, type WindowManagerCallbacks } from './ui/main-window.js';
import { loadDirectory, toggleSort, navigateUp, navigateHome } from './ui/components/actions.js';
import { checkNodeConnectionAndUpdateFormat } from './ui/components/preview.js';

// Import API modules
import { createFile as apiCreateFile, createDirectory as apiCreateDirectory, deleteFile as apiDeleteFile } from './api/endpoints/file.js';

// Import floating window modules
import { openFloatingPreview } from './ui/floating/window.js';

// Import utility functions
import { updateStatus, showToast, getParentPath, getExt, getFileName } from './utils/helpers.js';
import { applyComfyTheme, initThemeSystem } from './utils/theme.js';

// ==================== Constants ====================
const MIN_NODE_VERSION = 2;

// Detect Node version (safe detection)
const IS_NODE_V3 = typeof (app as { ui?: { version?: { major?: number } } }).ui !== 'undefined' &&
                    (app as { ui?: { version?: { major?: number } } }).ui !== null &&
                    (app as { ui: { version?: { major?: number } } }).ui?.version &&
                    typeof (app as { ui: { version: { major?: number } } }).ui.version === 'object' &&
                    (app as { ui: { version: { major?: number } } }).ui.version.major &&
                    (app as { ui: { version: { major: number } } }).ui.version.major >= MIN_NODE_VERSION;

console.log(`[DataManager] Extension loading, Node V${IS_NODE_V3 ? '3' : '1'} detected`);

// Global variable reference
let fileManagerWindow: HTMLElement | null = null;

// ============================================
// Extension Configuration
// ============================================
const extensionConfig = {
  name: "ComfyUI.DataManager",

  commands: [
    {
      id: "data-manager.open",
      label: "Open Data Manager",
      icon: "pi pi-folder-open",
      function: () => openFileManager()
    }
  ],

  keybindings: [
    { combo: { key: "d", ctrl: true, shift: true }, commandId: "data-manager.open" }
  ],

  // Action bar button
  actionBarButtons: [
    {
      icon: "pi pi-folder",
      tooltip: "文件管理器 (Ctrl+Shift+D)",
      class: "dm-actionbar-btn",
      onClick: () => openFileManager()
    }
  ],

  async setup() {
    // Inject official-style button styles
    const style = document.createElement("style");
    style.textContent = `
      .dm-actionbar-btn {
        width: 32px !important;
        height: 32px !important;
        border: none !important;
        border-radius: 6px !important;
        background: rgba(255, 255, 255, 0.05) !important;
        color: rgba(255, 255, 255, 0.9) !important;
        margin-right: 0.5rem !important;
        transition: all 0.2s ease !important;
      }
      .dm-actionbar-btn:hover {
        background: rgba(255, 255, 255, 0.15) !important;
      }
      .dm-actionbar-btn i {
        color: rgba(255, 255, 255, 0.9) !important;
      }
    `;
    document.head.appendChild(style);

    // Simplified position fix function
    const fixPosition = () => {
      const dmBtn = document.querySelector('.dm-actionbar-btn');
      const queueBtn = Array.from(document.querySelectorAll('button')).find(b =>
        b.getAttribute('aria-label') === 'Expand job queue'
      );

      if (!dmBtn || !queueBtn) return false;

      const queueParent = queueBtn.parentElement;
      const prevSibling = queueBtn.previousElementSibling;

      // Only move when button is not in correct position
      if (prevSibling !== dmBtn || dmBtn.parentElement !== queueParent) {
        queueParent!.insertBefore(dmBtn, queueBtn);
        console.log('[DataManager] Button position fixed');
        return true;
      }
      return false;
    };

    // Use more comprehensive listener strategy
    let lastCall = 0;
    const observer = new MutationObserver((mutations) => {
      const now = Date.now();
      if (now - lastCall < 100) return;
      lastCall = now;

      // Check for relevant DOM changes
      const hasRelevantChange = mutations.some(m => {
        if (m.type === 'childList') {
          for (const node of m.addedNodes) {
            if (node.nodeType === 1) {
              const el = node as Element;
              if (el.classList?.contains('actionbar-container') ||
                  el.classList?.contains('dm-actionbar-btn') ||
                  el.querySelector?.('.dm-actionbar-btn') ||
                  el.querySelector?.('[aria-label="Expand job queue"]')) {
                return true;
              }
            }
          }
        }
        if ((m.target as Element).closest?.('.actionbar-container')) {
          return true;
        }
        return false;
      });

      if (hasRelevantChange) {
        requestAnimationFrame(fixPosition);
      }
    });

    // Observe entire body
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Periodic position check (as fallback)
    setInterval(() => {
      fixPosition();
    }, 2000);

    console.log("[DataManager] Extension setup completed");

    // Initialize theme system
    initThemeSystem();
  },

  async nodeCreated(node: unknown) {
    const nodeObj = node as { comfyClass?: string; addDOMWidget?: (name: string, type: string, elem: HTMLElement, options?: { minWidth?: number; minHeight?: number }) => void };
    if (nodeObj.comfyClass === "DataManagerCore") {
      console.log("[DataManager] DataManagerCore node created, IS_NODE_V3:", IS_NODE_V3);

      // V1/V3 API both use addDOMWidget to add button
      if (nodeObj.addDOMWidget) {
        const container = document.createElement("div");
        container.style.cssText = `
          display: flex;
          justify-content: center;
          padding: 10px;
        `;

        const button = document.createElement("button");
        button.className = "comfy-btn";
        button.innerHTML = '<i class="pi pi-folder-open"></i> 打开文件管理器';
        button.style.cssText = `
          padding: 12px 24px;
          font-size: 14px;
          background: #6c757d;
          border: none;
          border-radius: 8px;
          color: white;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;
        button.onmouseover = () => {
          button.style.background = "#5a6268";
          button.style.transform = "translateY(-1px)";
          button.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
        };
        button.onmouseout = () => {
          button.style.background = "#6c757d";
          button.style.transform = "translateY(0)";
          button.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
        };
        button.onclick = (e) => {
          e.stopPropagation();
          openFileManager();
        };

        container.appendChild(button);
        nodeObj.addDOMWidget("dm_open_btn", "dm_open_btn", container, {
          minWidth: 200,
          minHeight: 50
        });
      }
    } else if (nodeObj.comfyClass === "InputPathConfig") {
      console.log("[DataManager] InputPathConfig node created");
      // Initialize format selector state
      (nodeObj as { _dmFormatSelectorEnabled?: boolean })._dmFormatSelectorEnabled = false;
    } else if (nodeObj.comfyClass === "OutputPathConfig") {
      console.log("[DataManager] OutputPathConfig node created");
      // Initialize OutputPathConfig node state
      const outputNode = nodeObj as { _dmOutputType?: string; _dmFilePath?: string };
      outputNode._dmOutputType = "STRING";
      outputNode._dmFilePath = "";
    }
  },

  getNodeMenuItems(node: unknown) {
    const nodeObj = node as { comfyClass?: string };
    if (nodeObj.comfyClass === "DataManagerCore") {
      return [
        {
          content: "打开文件管理器",
          callback: () => openFileManager()
        }
      ];
    }
    return [];
  },

  getCanvasMenuItems() {
    return [
      null,
      {
        content: "Data Manager",
        callback: () => openFileManager()
      }
    ];
  }
};

// ============================================
// Main Functions
// ============================================

/**
 * Open file manager
 */
function openFileManager(): void {
  // If window exists, destroy it first (cleanup event listeners)
  if (fileManagerWindow) {
    destroyFileManagerWindow();
  }

  // Restore last visited path, or use default
  const lastPath = getLastPath();
  if (lastPath && lastPath !== '.') {
    FileManagerState.currentPath = lastPath;
    console.log('[DataManager] Restored last path:', lastPath);
  } else {
    FileManagerState.currentPath = ".";
  }

  // Create window callbacks
  const callbacks: WindowManagerCallbacks = {
    onRefresh: () => loadDirectory(FileManagerState.currentPath),
    onClose: () => {
      destroyFileManagerWindow();
      fileManagerWindow = null;
    },
    onOpenFloating: () => {
      const selected = FileManagerState.selectedFiles[0];
      if (selected) {
        openFloatingPreview(selected, getFileName(selected));
      }
    },
    onCopyPath: () => copySelectedPaths(),
    onDelete: () => deleteSelectedFiles(),
    // SSH callbacks
    onSshConnect: async (conn) => {
      const result = conn as { root_path?: string; username?: string; host?: string };
      // Set active connection
      const state = (window as unknown as { _remoteConnectionsState: { active: unknown } })._remoteConnectionsState;
      state.active = conn;
      // Save to localStorage
      try {
        localStorage.setItem('comfyui_datamanager_last_connection', JSON.stringify(conn));
      } catch (e) {}
      // Load remote root directory
      await loadDirectory(result.root_path || "/");
      showToast("success", "已连接", `SSH: ${result.username}@${result.host}`);
    },
    onSshDisconnect: async () => {
      const state = (window as unknown as { _remoteConnectionsState: { active: { connection_id?: string } | null } })._remoteConnectionsState;
      const conn = state.active;
      if (conn && conn.connection_id) {
        try {
          const { sshDisconnect } = await import('./api/ssh.js');
          await sshDisconnect(conn.connection_id);
        } catch (e) {
          console.log('[DataManager] SSH disconnect error:', e);
        }
      }
      // Clear active connection
      state.active = null;
      try {
        localStorage.removeItem('comfyui_datamanager_last_connection');
      } catch (e) {}
      // Load local directory
      await loadDirectory(".");
      showToast("info", "已断开", "SSH 连接已断开");
    }
  };

  fileManagerWindow = createFileManagerWindow(callbacks);

  // Apply ComfyUI theme
  applyComfyTheme();

  loadDirectory(FileManagerState.currentPath);

  // Delay check node connection status, ensure window is fully created
  setTimeout(() => {
    checkAndUpdateFormatSelector();
  }, 500);
}

/**
 * Check InputPathConfig node connection status and update format selector
 */
function checkAndUpdateFormatSelector(): void {
  try {
    checkNodeConnectionAndUpdateFormat();
  } catch (e) {
    console.log("[DataManager] Error in checkAndUpdateFormatSelector:", e);
  }
}

// ============================================
// File Operations
// ============================================

/**
 * Copy selected file paths to clipboard
 */
function copySelectedPaths(): void {
  const selected = FileManagerState.selectedFiles;
  if (selected.length === 0) {
    showToast("warn", "未选择", "请先选择文件");
    return;
  }

  const paths = selected.join('\n');
  navigator.clipboard.writeText(paths).then(() => {
    showToast("success", "已复制", `已复制 ${selected.length} 个文件路径`);
  }).catch(() => {
    showToast("error", "复制失败", "无法访问剪贴板");
  });
}

/**
 * Delete selected files
 */
async function deleteSelectedFiles(): Promise<void> {
  const selected = FileManagerState.selectedFiles;
  if (selected.length === 0) {
    showToast("warn", "未选择", "请先选择文件");
    return;
  }

  const message = selected.length === 1
    ? `确定删除 "${getFileName(selected[0])}"?`
    : `确定删除 ${selected.length} 个项目?`;

  if (!confirm(message)) {
    return;
  }

  try {
    for (const path of selected) {
      await apiDeleteFile(path, true);
    }
    showToast("success", "已删除", `已删除 ${selected.length} 个项目`);
    loadDirectory(FileManagerState.currentPath);
  } catch (error) {
    showToast("error", "删除失败", (error as Error).message);
  }
}

// ============================================
// Register Extension
// ============================================
app.registerExtension(extensionConfig);

export { extensionConfig };
