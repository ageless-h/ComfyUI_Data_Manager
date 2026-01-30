/**
 * ComfyUI Data Manager - Extension Entry Point
 *
 * Features:
 * - File manager UI interface
 * - File preview (document/image/audio/video)
 * - File operations (create/delete/rename/copy path)
 * - Sort and view toggle
 */

import { app } from '../../scripts/app.js'

// Import core modules
import {
  FileManagerState,
  saveLastPath,
  getLastPath,
  saveViewMode,
  getViewMode,
} from './core/state.js'

// Import UI modules
import {
  createFileManagerWindow,
  destroyFileManagerWindow,
  type WindowManagerCallbacks,
} from './ui/main-window.js'
import { loadDirectory, toggleSort, navigateUp, navigateHome } from './ui/components/actions.js'
import { checkNodeConnectionAndUpdateFormat } from './ui/components/preview.js'

// Import API modules
import {
  createFile as apiCreateFile,
  createDirectory as apiCreateDirectory,
  deleteFile as apiDeleteFile,
} from './api/endpoints/file.js'

// Import floating window modules
import { openFloatingPreview } from './ui/floating/window.js'

// Import utility functions
import { updateStatus, showToast, getParentPath, getExt, getFileName } from './utils/helpers.js'
import {
  applyComfyTheme,
  initThemeSystem,
  getComfyTheme,
  addThemeListener,
  type ComfyTheme,
} from './utils/theme.js'

// ==================== Constants ====================
const MIN_NODE_VERSION = 2

// Detect Node version (safe detection)
const IS_NODE_V3 =
  typeof (app as { ui?: { version?: { major?: number } } }).ui !== 'undefined' &&
  (app as { ui?: { version?: { major?: number } } }).ui !== null &&
  (app as { ui: { version?: { major?: number } } }).ui?.version &&
  typeof (app as { ui: { version: { major?: number } } }).ui.version === 'object' &&
  (app as { ui: { version: { major?: number } } }).ui.version.major &&
  (app as { ui: { version: { major: number } } }).ui.version.major >= MIN_NODE_VERSION

console.log(`[DataManager] Extension loading, Node V${IS_NODE_V3 ? '3' : '1'} detected`)

// Global variable reference
let fileManagerWindow: HTMLElement | null = null

// ============================================
// Extension Configuration
// ============================================
const extensionConfig = {
  name: 'ComfyUI.DataManager',

  commands: [
    {
      id: 'data-manager.open',
      label: 'Open Data Manager',
      icon: 'pi pi-folder-open',
      function: () => openFileManager(),
    },
  ],

  keybindings: [{ combo: { key: 'd', ctrl: true, shift: true }, commandId: 'data-manager.open' }],

  // Action bar button
  actionBarButtons: [
    {
      icon: 'pi pi-folder',
      tooltip: '文件管理器 (Ctrl+Shift+D)',
      class: 'dm-actionbar-btn',
      onClick: () => openFileManager(),
    },
  ],

  async setup() {
    // Export FileManagerState to global window object
    ;(window as unknown as { FileManagerState: typeof FileManagerState }).FileManagerState =
      FileManagerState

    // CRITICAL: Apply theme BEFORE injecting CSS to avoid flicker
    applyComfyTheme()

    // Inject official-style button styles
    const style = document.createElement('style')
    style.textContent = `
      .dm-actionbar-btn {
        width: 32px !important;
        height: 32px !important;
        border: none !important;
        border-radius: 6px !important;
        background: var(--dm-bg-tertiary, #f0f0f0) !important;
        color: var(--dm-text-primary, #222222) !important;
        margin-right: 0.5rem !important;
        transition: all 0.2s ease !important;
      }
      .dm-actionbar-btn:hover {
        background: var(--dm-bg-hover, #e0e0e0) !important;
      }
      .dm-actionbar-btn i {
        color: var(--dm-text-primary, #222222) !important;
      }
    `
    document.head.appendChild(style)

    // Apply theme immediately and repeatedly until successful
    const ensureThemeApplied = () => {
      try {
        applyComfyTheme()
        // Verify CSS variables are set
        const root = document.documentElement
        const bgTertiary = root.style.getPropertyValue('--dm-bg-tertiary')
        if (bgTertiary) {
          // console.log('[DataManager] Theme CSS variables applied:', bgTertiary);
        }
      } catch (e) {
        console.warn('[DataManager] Theme apply error:', e)
      }
    }

    // Apply immediately
    ensureThemeApplied()

    // Also apply on next tick (in case DOM wasn't ready)
    setTimeout(ensureThemeApplied, 0)
    setTimeout(ensureThemeApplied, 100)
    setTimeout(ensureThemeApplied, 500)

    // Simplified position fix function
    const fixPosition = () => {
      const dmBtn = document.querySelector('.dm-actionbar-btn')
      const queueBtn = Array.from(document.querySelectorAll('button')).find(
        (b) => b.getAttribute('aria-label') === 'Expand job queue'
      )

      if (!dmBtn || !queueBtn) return false

      // CRITICAL: Re-apply theme when button is found (handles refresh/reload)
      applyComfyTheme()

      const queueParent = queueBtn.parentElement
      const prevSibling = queueBtn.previousElementSibling

      // Only move when button is not in correct position
      if (prevSibling !== dmBtn || dmBtn.parentElement !== queueParent) {
        queueParent!.insertBefore(dmBtn, queueBtn)
        // console.log('[DataManager] Button position fixed');
        return true
      }
      return false
    }

    // Use more comprehensive listener strategy
    let lastCall = 0
    const observer = new MutationObserver((mutations) => {
      const now = Date.now()
      if (now - lastCall < 100) return
      lastCall = now

      // Check for relevant DOM changes
      const hasRelevantChange = mutations.some((m) => {
        if (m.type === 'childList') {
          for (const node of m.addedNodes) {
            if (node.nodeType === 1) {
              const el = node as Element
              if (
                el.classList?.contains('actionbar-container') ||
                el.classList?.contains('dm-actionbar-btn') ||
                el.querySelector?.('.dm-actionbar-btn') ||
                el.querySelector?.('[aria-label="Expand job queue"]')
              ) {
                return true
              }
            }
          }
        }
        if ((m.target as Element).closest?.('.actionbar-container')) {
          return true
        }
        return false
      })

      if (hasRelevantChange) {
        requestAnimationFrame(fixPosition)
      }
    })

    // Observe entire body
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    // Periodic position check (as fallback)
    setInterval(() => {
      fixPosition()
    }, 2000)

    console.log('[DataManager] Extension setup completed')

    // Initialize theme system
    initThemeSystem()

    // Add theme listener to update node buttons when theme changes
    addThemeListener((theme: ComfyTheme) => {
      // Update all node buttons
      document.querySelectorAll('.dm-node-open-btn').forEach((btn) => {
        const button = btn as HTMLButtonElement
        button.style.background = theme.bgTertiary
        button.style.borderColor = theme.borderColor
        button.style.color = theme.textPrimary
        // console.log('[DataManager] Node button theme updated');
      })
    })
  },

  async nodeCreated(node: unknown) {
    const nodeObj = node as {
      comfyClass?: string
      addDOMWidget?: (
        name: string,
        type: string,
        elem: HTMLElement,
        options?: { minWidth?: number; minHeight?: number }
      ) => void
    }
    if (nodeObj.comfyClass === 'DataManagerCore') {
      // console.log("[DataManager] DataManagerCore node created, IS_NODE_V3:", IS_NODE_V3);

      // V1/V3 API both use addDOMWidget to add button
      if (nodeObj.addDOMWidget) {
        // Ensure theme is applied before creating button
        applyComfyTheme()
        const theme = getComfyTheme()
        const container = document.createElement('div')
        container.style.cssText = `
          display: flex;
          justify-content: center;
          padding: 10px;
        `

        const button = document.createElement('button')
        button.className = 'comfy-btn dm-node-open-btn'
        button.innerHTML = '<i class="pi pi-folder-open"></i> 打开文件管理器'
        button.style.cssText = `
          padding: 12px 24px;
          font-size: 14px;
          background: ${theme.bgTertiary};
          border: 1px solid ${theme.borderColor};
          border-radius: 8px;
          color: ${theme.textPrimary};
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        `
        button.onmouseover = () => {
          button.style.background = theme.bgSecondary
          button.style.transform = 'translateY(-1px)'
          button.style.borderColor = theme.accentColor
          button.style.boxShadow = `0 4px 8px rgba(0, 0, 0, 0.3)`
        }
        button.onmouseout = () => {
          button.style.background = theme.bgTertiary
          button.style.transform = 'translateY(0)'
          button.style.borderColor = theme.borderColor
          button.style.boxShadow = `0 2px 4px rgba(0, 0, 0, 0.2)`
        }
        button.onclick = (e) => {
          e.stopPropagation()
          openFileManager()
        }

        container.appendChild(button)
        nodeObj.addDOMWidget('dm_open_btn', 'dm_open_btn', container, {
          minWidth: 200,
          minHeight: 50,
        })
      }
    } else if (nodeObj.comfyClass === 'InputPathConfig') {
      // console.log("[DataManager] InputPathConfig node created");
      // Initialize format selector state
      ;(nodeObj as { _dmFormatSelectorEnabled?: boolean })._dmFormatSelectorEnabled = false
    } else if (nodeObj.comfyClass === 'OutputPathConfig') {
      // console.log("[DataManager] OutputPathConfig node created");
      // Initialize OutputPathConfig node state
      const outputNode = nodeObj as { _dmOutputType?: string; _dmFilePath?: string }
      outputNode._dmOutputType = 'STRING'
      outputNode._dmFilePath = ''
    }
  },

  getNodeMenuItems(node: unknown) {
    const nodeObj = node as { comfyClass?: string }
    if (nodeObj.comfyClass === 'DataManagerCore') {
      return [
        {
          content: '打开文件管理器',
          callback: () => openFileManager(),
        },
      ]
    }
    return []
  },

  getCanvasMenuItems() {
    return [
      null,
      {
        content: 'Data Manager',
        callback: () => openFileManager(),
      },
    ]
  },
}

// ============================================
// Main Functions
// ============================================

/**
 * Open file manager
 */
function openFileManager(): void {
  // If window exists, destroy it first (cleanup event listeners)
  if (fileManagerWindow) {
    destroyFileManagerWindow()
  }

  // Restore last visited path, or use default
  const lastPath = getLastPath()
  if (lastPath && lastPath !== '.') {
    FileManagerState.currentPath = lastPath
    // console.log('[DataManager] Restored last path:', lastPath);
  } else {
    FileManagerState.currentPath = '.'
  }

  // Create window callbacks
  const callbacks: WindowManagerCallbacks = {
    onRefresh: () => loadDirectory(FileManagerState.currentPath),
    onClose: () => {
      destroyFileManagerWindow()
      fileManagerWindow = null
    },
    onOpenFloating: () => {
      const selected = FileManagerState.selectedFiles[0]
      if (selected) {
        openFloatingPreview(selected, getFileName(selected))
      }
    },
    onCopyPath: () => copySelectedPaths(),
    onDelete: () => deleteSelectedFiles(),
    // Toolbar callbacks
    onSortChange: (sortBy: string) => {
      toggleSort(sortBy as 'name' | 'size' | 'modified')
    },
    onNewFile: () => showNewFileDialog(),
    // SSH callbacks
    onSshConnect: async (conn) => {
      const result = conn as { root_path?: string; username?: string; host?: string }
      // Set active connection
      const state = (window as unknown as { _remoteConnectionsState: { active: unknown } })
        ._remoteConnectionsState
      state.active = conn
      // Save to localStorage
      try {
        localStorage.setItem('comfyui_datamanager_last_connection', JSON.stringify(conn))
      } catch (e) {}
      // Load remote root directory
      await loadDirectory(result.root_path || '/')
      showToast('success', '已连接', `SSH: ${result.username}@${result.host}`)
    },
    onSshDisconnect: async () => {
      const state = (
        window as unknown as {
          _remoteConnectionsState: { active: { connection_id?: string } | null }
        }
      )._remoteConnectionsState
      const conn = state.active
      if (conn && conn.connection_id) {
        try {
          const { sshDisconnect } = await import('./api/ssh.js')
          await sshDisconnect(conn.connection_id)
        } catch (e) {
          console.log('[DataManager] SSH disconnect error:', e)
        }
      }
      // Clear active connection
      state.active = null
      try {
        localStorage.removeItem('comfyui_datamanager_last_connection')
      } catch (e) {}
      // Load local directory
      await loadDirectory('.')
      showToast('info', '已断开', 'SSH 连接已断开')
    },
  }

  fileManagerWindow = createFileManagerWindow(callbacks)

  // Apply ComfyUI theme
  applyComfyTheme()

  loadDirectory(FileManagerState.currentPath)

  // Delay check node connection status, ensure window is fully created
  setTimeout(() => {
    checkAndUpdateFormatSelector()
  }, 500)
}

/**
 * Check InputPathConfig node connection status and update format selector
 */
function checkAndUpdateFormatSelector(): void {
  try {
    checkNodeConnectionAndUpdateFormat()
  } catch (e) {
    console.log('[DataManager] Error in checkAndUpdateFormatSelector:', e)
  }
}

// ============================================
// File Operations
// ============================================

/**
 * Copy selected file paths to clipboard
 */
function copySelectedPaths(): void {
  const selected = FileManagerState.selectedFiles
  if (selected.length === 0) {
    showToast('warn', '未选择', '请先选择文件')
    return
  }

  const paths = selected.join('\n')

  // Try modern Clipboard API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(paths)
      .then(() => {
        showToast('success', '已复制', `已复制 ${selected.length} 个文件路径`)
      })
      .catch(() => {
        // Fallback to document.execCommand
        fallbackCopy(paths)
      })
  } else {
    // Use fallback directly
    fallbackCopy(paths)
  }
}

/**
 * Fallback copy method using document.execCommand
 */
function fallbackCopy(text: string): void {
  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.style.position = 'fixed'
  textArea.style.left = '-999999px'
  textArea.style.top = '-999999px'
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()

  try {
    const successful = document.execCommand('copy')
    if (successful) {
      showToast('success', '已复制', `已复制 ${FileManagerState.selectedFiles.length} 个文件路径`)
    } else {
      showToast('error', '复制失败', '无法复制到剪贴板')
    }
  } catch (err) {
    console.error('[DataManager] Fallback copy failed:', err)
    showToast('error', '复制失败', '无法访问剪贴板')
  }

  document.body.removeChild(textArea)
}

/**
 * Delete selected files
 */
async function deleteSelectedFiles(): Promise<void> {
  const selected = FileManagerState.selectedFiles
  if (selected.length === 0) {
    showToast('warn', '未选择', '请先选择文件')
    return
  }

  const message =
    selected.length === 1
      ? `确定删除 "${getFileName(selected[0])}"?`
      : `确定删除 ${selected.length} 个项目?`

  if (!confirm(message)) {
    return
  }

  try {
    for (const path of selected) {
      await apiDeleteFile(path, true)
    }
    showToast('success', '已删除', `已删除 ${selected.length} 个项目`)
    loadDirectory(FileManagerState.currentPath)
  } catch (error) {
    showToast('error', '删除失败', (error as Error).message)
  }
}

/**
 * Show new file dialog
 */
function showNewFileDialog(): void {
  const theme = getComfyTheme()

  const modal = document.createElement('div')
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.7); z-index: 10001;
    display: flex; align-items: center; justify-content: center;
  `

  const dialog = document.createElement('div')
  dialog.style.cssText = `
    background: ${theme.bgSecondary}; border-radius: 12px; padding: 24px;
    width: 400px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  `

  dialog.innerHTML = `
    <h3 style="margin: 0 0 20px 0; color: ${theme.textPrimary};">新建</h3>
    <div style="display: flex; gap: 10px; margin-bottom: 20px;">
      <button id="dm-new-file-btn" class="comfy-btn"
              style="flex: 1; padding: 15px; background: ${theme.bgTertiary}; border: 1px solid ${theme.borderColor};
                     border-radius: 8px; color: ${theme.textPrimary}; cursor: pointer;">
        <i class="pi pi-file" style="display: block; font-size: 24px; margin-bottom: 8px;"></i>
        文件
      </button>
      <button id="dm-new-folder-btn" class="comfy-btn"
              style="flex: 1; padding: 15px; background: ${theme.bgTertiary}; border: 1px solid ${theme.borderColor};
                     border-radius: 8px; color: ${theme.textPrimary}; cursor: pointer;">
        <i class="pi pi-folder" style="display: block; font-size: 24px; margin-bottom: 8px;"></i>
        文件夹
      </button>
    </div>
    <button class="comfy-btn" id="dm-cancel-new-btn"
            style="width: 100%; padding: 10px; background: transparent;
                   border: 1px solid ${theme.borderColor}; border-radius: 6px; color: ${theme.textSecondary}; cursor: pointer;">
      取消
    </button>
  `

  modal.appendChild(dialog)
  document.body.appendChild(modal)

  const fileBtn = dialog.querySelector('#dm-new-file-btn') as HTMLButtonElement
  const folderBtn = dialog.querySelector('#dm-new-folder-btn') as HTMLButtonElement
  const cancelBtn = dialog.querySelector('#dm-cancel-new-btn') as HTMLButtonElement

  fileBtn.onclick = () => {
    modal.remove()
    createNewFile()
  }
  folderBtn.onclick = () => {
    modal.remove()
    createNewFolder()
  }
  cancelBtn.onclick = () => modal.remove()
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove()
  }
}

/**
 * Create new file
 */
async function createNewFile(): Promise<void> {
  const name = prompt('输入文件名:', 'new_file.txt')
  if (name) {
    try {
      await apiCreateFile(FileManagerState.currentPath, name, '')
      await loadDirectory(FileManagerState.currentPath)
      showToast('success', '成功', `文件已创建: ${name}`)
    } catch (error) {
      const errorMsg = (error as Error).message
      // 改进错误提示
      if (errorMsg.includes('File already exists') || errorMsg.includes('已存在')) {
        showToast('error', '创建失败', `文件 "${name}" 已存在，请使用其他文件名`)
      } else if (errorMsg.includes('Directory not found') || errorMsg.includes('目录不存在')) {
        showToast('error', '创建失败', `目录不存在`)
      } else {
        showToast('error', '创建失败', errorMsg)
      }
    }
  }
}

/**
 * Create new folder
 */
async function createNewFolder(): Promise<void> {
  const name = prompt('输入文件夹名称:', '新建文件夹')
  if (name) {
    try {
      await apiCreateDirectory(FileManagerState.currentPath, name)
      await loadDirectory(FileManagerState.currentPath)
      showToast('success', '成功', `文件夹已创建: ${name}`)
    } catch (error) {
      const errorMsg = (error as Error).message
      // 改进错误提示
      if (errorMsg.includes('File exists') || errorMsg.includes('已存在')) {
        showToast('error', '创建失败', `文件夹 "${name}" 已存在，请使用其他名称`)
      } else if (errorMsg.includes('Directory not found') || errorMsg.includes('目录不存在')) {
        showToast('error', '创建失败', `父目录不存在`)
      } else {
        showToast('error', '创建失败', errorMsg)
      }
    }
  }
}

// ============================================
// Register Extension
// ============================================
app.registerExtension(extensionConfig)

export { extensionConfig }
