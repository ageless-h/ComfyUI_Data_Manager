/**
 * ComfyUI Data Manager - Main File Manager Window
 */

import { createHeader } from './components/header.js'
import { createToolbar, type ToolbarCallbacks } from './components/toolbar.js'
import { createBrowserPanel } from './components/browser.js'
import { createPreviewPanel, createStatusBar, type PreviewCallbacks } from './components/preview.js'
import { loadDirectory } from './components/actions.js'
import { setupWindowDrag } from '../utils/drag.js'
import { FileManagerState } from '../core/state.js'
import { getComfyTheme } from '../utils/theme.js'

// Keyboard event handler reference
let keydownHandler: ((e: KeyboardEvent) => void) | null = null

/**
 * Window callbacks
 */
export interface WindowManagerCallbacks extends ToolbarCallbacks, PreviewCallbacks {
  onClose?: () => void
  onRefresh?: () => void
  onOpenFloating?: () => void
  onCopyPath?: () => void
  onDelete?: () => void
}

/**
 * Create file manager window
 * @param callbacks - Callback functions object
 * @returns Window element
 */
export function createFileManagerWindow(callbacks: WindowManagerCallbacks = {}): HTMLElement {
  const theme = getComfyTheme()
  const window = document.createElement('div')
  window.id = 'dm-file-manager'
  window.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 1200px;
    height: 700px;
    max-width: calc(100vw - 40px);
    max-height: calc(100vh - 40px);
    background: ${theme.bgPrimary};
    border: 0.8px solid ${theme.borderColor};
    border-radius: 8px;
    box-shadow: rgba(0, 0, 0, 0.4) 1px 1px 8px 0px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    font-family: Inter, Arial, sans-serif;
  `

  // Create toast notification container (positioned above all content)
  const toastContainer = document.createElement('div')
  toastContainer.id = 'dm-toast-container'
  toastContainer.style.cssText = `
    position: absolute;
    top: 60px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10001;
    display: flex;
    flex-direction: column;
    gap: 10px;
    pointer-events: none;
  `
  window.appendChild(toastContainer)

  // Assemble window
  window.appendChild(
    createHeader({
      title: 'Data Manager',
      icon: 'pi-folder-open',
      onClose: callbacks.onClose,
      onRefresh: callbacks.onRefresh,
    })
  )
  window.appendChild(createToolbar(callbacks))
  window.appendChild(createMainContent(callbacks))
  window.appendChild(createStatusBar())

  document.body.appendChild(window)

  // Setup drag
  const header = window.querySelector('.dm-header') as HTMLElement
  setupWindowDrag(window, header)

  // Add keyboard event listener (ESC to close)
  keydownHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      if (callbacks.onClose) callbacks.onClose()
    }
  }
  document.addEventListener('keydown', keydownHandler, { capture: true })

  return window
}

/**
 * Destroy window (cleanup event listeners)
 */
export function destroyFileManagerWindow(): void {
  // Remove keyboard event listener
  if (keydownHandler) {
    document.removeEventListener('keydown', keydownHandler, { capture: true })
    keydownHandler = null
  }

  // Remove window element
  const window = document.getElementById('dm-file-manager')
  if (window) {
    window.remove()
  }
}

/**
 * Create main content area
 * @param callbacks - Callback functions object
 * @returns Main content element
 */
function createMainContent(callbacks: WindowManagerCallbacks): HTMLElement {
  const mainContent = document.createElement('div')
  mainContent.style.cssText = 'flex: 1; display: flex; overflow: hidden;'

  const browserPanel = createBrowserPanel(FileManagerState.viewMode)
  mainContent.appendChild(browserPanel)

  const previewPanel = createPreviewPanel({
    onOpenFloating: callbacks.onOpenFloating,
    onCopyPath: callbacks.onCopyPath,
    onDelete: callbacks.onDelete,
  })
  mainContent.appendChild(previewPanel)

  return mainContent
}
