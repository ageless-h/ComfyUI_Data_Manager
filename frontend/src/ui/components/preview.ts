/**
 * ComfyUI Data Manager - Preview Panel Component
 */

import { createFormatSelector, type FormatSelectorOptions } from './format-selector.js'
import { getComfyTheme } from '../../utils/theme.js'
import { FileManagerState } from '../../core/state.js'

// ==================== Constants ====================
const DEFAULT_DETECTED_TYPE = 'IMAGE'

/**
 * Preview panel callbacks
 */
export interface PreviewCallbacks {
  onOpenFloating?: () => void
  onCopyPath?: () => void
  onDelete?: () => void
}

/**
 * Check node connection and update format selector
 */
export function checkNodeConnectionAndUpdateFormat(): void {
  try {
    const app = (
      window as unknown as {
        app?: { graph?: { _nodes?: unknown[]; getNodeById?: (id: number) => unknown } }
      }
    ).app
    const nodes = app?.graph?._nodes || []
    const inputPathConfigNodes = nodes.filter(
      (n: unknown) => (n as { comfyClass?: string }).comfyClass === 'InputPathConfig'
    )

    if (inputPathConfigNodes.length === 0) {
      return
    }

    const node = inputPathConfigNodes[0] as {
      inputs?: Array<{ name?: string; link?: { origin_id?: number } }>
    }
    const inputs = node.inputs || []
    const fileInput = inputs.find((i: { name?: string }) => i.name === 'file_input')

    if (fileInput && fileInput.link) {
      const sourceNodeId = fileInput.link.origin_id
      const sourceNode =
        sourceNodeId !== undefined ? app?.graph?.getNodeById?.(sourceNodeId) : undefined
      if (sourceNode) {
        const detectedType = detectTypeFromSourceNode(sourceNode)
        updateFormatSelector(detectedType, null, null)
      }
    }
  } catch (e) {
    console.log('[DataManager] Error checking node connection:', e)
  }
}

/**
 * Detect data type from node type
 * @param node - Source node
 * @returns Detected type string
 */
function detectTypeFromSourceNode(node: {
  type?: string
  comfyClass?: string
  outputs?: Array<{ type?: string }>
}): string {
  const nodeType = node.type || node.comfyClass || ''

  // Type mapping
  const typeMapping: Record<string, string> = {
    LoadImage: 'IMAGE',
    LoadVideo: 'VIDEO',
    LoadAudio: 'AUDIO',
    EmptyLatentImage: 'LATENT',
    VAEDecode: 'IMAGE',
    CheckpointLoaderSimple: 'MODEL',
  }

  // Check output port types
  if (node.outputs && node.outputs.length > 0) {
    for (const output of node.outputs) {
      if (output.type === 'IMAGE') return 'IMAGE'
      if (output.type === 'LATENT') return 'LATENT'
      if (output.type === 'MASK') return 'MASK'
      if (output.type === 'VIDEO') return 'VIDEO'
      if (output.type === 'AUDIO') return 'AUDIO'
      if (output.type === 'MODEL') return 'MODEL'
      if (output.type === 'VAE') return 'VAE'
      if (output.type === 'CLIP') return 'CLIP'
    }
  }

  // Use node type mapping
  for (const [key, value] of Object.entries(typeMapping)) {
    if (nodeType.includes(key)) {
      return value
    }
  }

  return DEFAULT_DETECTED_TYPE
}

/**
 * Create preview panel
 * @param callbacks - Callback functions
 * @returns Panel element
 */
export function createPreviewPanel(callbacks: PreviewCallbacks = {}): HTMLElement {
  const { onOpenFloating, onCopyPath, onDelete } = callbacks
  const theme = getComfyTheme()

  const panel = document.createElement('div')
  panel.id = 'dm-preview-panel'
  panel.style.cssText = `
    flex: 0 0 400px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `

  const header = document.createElement('div')
  header.className = 'dm-preview-header'
  header.style.cssText = `
    padding: 15px;
    border-bottom: 1px solid ${theme.borderColor};
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  `
  header.innerHTML = `
    <h3 class="dm-title" style="margin: 0; font-size: 14px;">
      <i class="pi pi-eye"></i> 预览
    </h3>
    <div style="display: flex; gap: 5px;">
      <button id="dm-copy-path-btn" class="comfy-btn dm-icon-btn" disabled style="padding: 6px 12px; font-size: 12px; opacity: 0.5; cursor: not-allowed;" title="复制路径">
        <i class="pi pi-copy"></i>
      </button>
      <button id="dm-delete-file-btn" class="comfy-btn dm-icon-btn" style="padding: 6px 12px; font-size: 12px;">
        <i class="pi pi-trash"></i>
      </button>
      <button id="dm-open-floating-preview-btn" class="comfy-btn dm-icon-btn" style="display: none; padding: 6px 12px; font-size: 12px;">
        <i class="pi pi-window-maximize"></i>
      </button>
    </div>
  `
  panel.appendChild(header)

  const content = document.createElement('div')
  content.id = 'dm-preview-content'
  content.style.cssText = `
    flex: 1;
    overflow-y: auto;
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 15px;
  `
  content.innerHTML = `
    <div style="text-align: center; padding: 40px; color: ${theme.textSecondary};">
      <i class="pi pi-file" style="font-size: 48px; opacity: 0.5;"></i>
      <div style="margin-top: 15px; font-size: 13px;">选择文件以预览</div>
    </div>
  `
  panel.appendChild(content)

  // Format selector area
  const formatSection = document.createElement('div')
  formatSection.id = 'dm-format-section'
  formatSection.style.cssText = `
    padding: 15px;
    background: ${theme.bgTertiary};
    border-top: 1px solid ${theme.borderColor};
    display: none;
  `
  formatSection.innerHTML = `
    <div style="text-align: center; padding: 20px; color: ${theme.textSecondary};">
      <i class="pi pi-cog" style="font-size: 32px; opacity: 0.5;"></i>
      <div style="margin-top: 10px; font-size: 12px;">连接节点以启用格式选择</div>
    </div>
  `
  panel.appendChild(formatSection)

  // File info area
  const infoSection = document.createElement('div')
  infoSection.id = 'dm-file-info'
  infoSection.style.cssText = `
    padding: 15px;
    background: ${theme.bgSecondary};
    border-top: 1px solid ${theme.borderColor};
    font-size: 12px;
    color: ${theme.textSecondary};
  `
  infoSection.innerHTML = '<div style="text-align: center;">No file selected</div>'
  panel.appendChild(infoSection)

  // Bind button events
  const floatingBtn = header.querySelector('#dm-open-floating-preview-btn') as HTMLButtonElement
  const copyPathBtn = header.querySelector('#dm-copy-path-btn') as HTMLButtonElement
  const deleteBtn = header.querySelector('#dm-delete-file-btn') as HTMLButtonElement

  if (floatingBtn && onOpenFloating) {
    floatingBtn.onclick = onOpenFloating
  }
  if (copyPathBtn && onCopyPath) {
    copyPathBtn.onclick = onCopyPath
  }
  if (deleteBtn && onDelete) {
    deleteBtn.onclick = onDelete
  }

  return panel
}

/**
 * Update format selector
 * @param detectedType - Detected type
 * @param currentFormat - Current format
 * @param onFormatChange - Format change callback
 */
export function updateFormatSelector(
  detectedType: string | null,
  currentFormat: string | null = null,
  onFormatChange: ((format: string) => void) | null = null
): void {
  const formatSection = document.getElementById('dm-format-section')
  if (!formatSection) return

  formatSection.innerHTML = ''

  if (!detectedType) {
    formatSection.style.display = 'none'
    return
  }

  formatSection.style.display = 'block'

  const selector = createFormatSelector({
    detectedType: detectedType,
    selectedFormat: currentFormat,
    onFormatChange: onFormatChange,
    compact: true,
  })

  formatSection.appendChild(selector)
}

/**
 * Hide format selector
 */
export function hideFormatSelector(): void {
  const formatSection = document.getElementById('dm-format-section')
  if (formatSection) {
    formatSection.style.display = 'none'
  }
}

/**
 * Create status bar
 * @returns Status bar element
 */
export function createStatusBar(): HTMLElement {
  const theme = getComfyTheme()
  // Create bottom area container (contains Dock and status bar)
  const bottomArea = document.createElement('div')
  bottomArea.className = 'dm-bottom-area'
  bottomArea.style.cssText = `
    display: flex;
    flex-direction: column;
  `

  // Create Dock
  const dock = document.createElement('div')
  dock.id = 'dm-preview-dock'
  dock.className = 'dm-preview-dock'
  dock.style.cssText = `
    min-height: 0;
    max-height: 0;
    padding: 0 15px;
    background: ${theme.bgPrimary};
    border-top: 0.8px solid ${theme.borderColor};
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    overflow-x: auto;
    overflow-y: hidden;
    transition: min-height 0.3s ease, max-height 0.3s ease, padding 0.3s ease;
  `

  // Create status bar
  const bar = document.createElement('div')
  bar.id = 'dm-status-bar'
  bar.style.cssText = `
    padding: 8px 16px;
    font-size: 12px;
    color: ${theme.textSecondary};
    background: transparent;
    border-top: 0.8px solid ${theme.borderColor};
    display: flex;
    justify-content: space-between;
    align-items: center;
  `
  bar.innerHTML = `
    <div id="dm-connection-status" style="color: ${theme.successColor};"></div>
    <div style="display: flex; align-items: center; gap: 10px;">
      <span id="dm-status-ready">就绪</span>
      <div id="dm-connection-indicator" style="width: 8px; height: 8px; border-radius: 50%; background: ${theme.textSecondary}; transition: background 0.3s ease;"></div>
    </div>
  `

  bottomArea.appendChild(dock)
  bottomArea.appendChild(bar)

  // Delay update connection status
  setTimeout(() => {
    const currentTheme = getComfyTheme()
    const indicator = document.getElementById('dm-connection-indicator')
    const statusText = document.getElementById('dm-connection-status')
    const state = (window as unknown as { _remoteConnectionsState: { active: unknown } })
      ._remoteConnectionsState
    const active = state?.active
    if (indicator) {
      ;(indicator as HTMLElement).style.background = active
        ? currentTheme.successColor
        : currentTheme.textSecondary
    }
    if (statusText && active) {
      const conn = active as { username?: string; host?: string }
      statusText.textContent = `SSH: ${conn.username}@${conn.host}`
    }
  }, 100)

  return bottomArea
}
