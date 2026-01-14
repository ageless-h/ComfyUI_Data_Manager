/**
 * ComfyUI Data Manager - Format Selector Component
 */

import { getComfyTheme } from '../../utils/theme.js'

/**
 * Format type map
 */
export const FORMAT_TYPE_MAP: Record<string, { type: string; label: string; description: string }> =
  {
    png: { type: 'IMAGE', label: 'PNG 图像', description: '无损压缩，支持透明' },
    jpg: { type: 'IMAGE', label: 'JPEG 图像', description: '有损压缩，文件较小' },
    webp: { type: 'IMAGE', label: 'WebP 图像', description: '现代格式，高压缩比' },
    mp4: { type: 'VIDEO', label: 'MP4 视频', description: '通用视频格式' },
    webm: { type: 'VIDEO', label: 'WebM 视频', description: '优化的网络视频' },
    avi: { type: 'VIDEO', label: 'AVI 视频', description: '经典视频格式' },
    mp3: { type: 'AUDIO', label: 'MP3 音频', description: '通用音频格式' },
    wav: { type: 'AUDIO', label: 'WAV 音频', description: '无损音频' },
    flac: { type: 'AUDIO', label: 'FLAC 音频', description: '无损压缩音频' },
    ogg: { type: 'AUDIO', label: 'OGG 音频', description: '开源音频格式' },
    latent: { type: 'LATENT', label: 'Latent', description: 'ComfyUI Latent 数据' },
    json: { type: 'DATA', label: 'JSON', description: '通用数据格式' },
    txt: { type: 'DATA', label: '文本', description: '纯文本格式' },
  }

/**
 * Type to formats mapping
 */
export const TYPE_FORMATS: Record<string, string[]> = {
  IMAGE: ['png', 'jpg', 'webp'],
  VIDEO: ['mp4', 'webm', 'avi'],
  AUDIO: ['mp3', 'wav', 'flac', 'ogg'],
  LATENT: ['latent'],
  MASK: ['png'],
  CONDITIONING: ['json'],
  STRING: ['txt', 'json'],
}

/**
 * Format selector options
 */
export interface FormatSelectorOptions {
  detectedType?: string | null
  selectedFormat?: string | null
  onFormatChange?: ((format: string) => void) | null
  showTypeIndicator?: boolean
  compact?: boolean
}

/**
 * Get formats for type (internal use)
 * @param type - Data type
 * @returns Array of format strings
 */
function getFormatsForType(type: string): string[] {
  const typeKey = type.toUpperCase()
  return TYPE_FORMATS[typeKey] || ['json']
}

/**
 * Get type color
 * @param type - Data type
 * @returns Color string
 */
function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    IMAGE: '#e74c3c',
    VIDEO: '#9b59b6',
    AUDIO: '#3498db',
    LATENT: '#27ae60',
    MASK: '#f39c12',
    DATA: '#95a5a6',
  }
  return colors[type] || '#95a5a6'
}

/**
 * Get type icon
 * @param type - Data type
 * @returns Icon class name
 */
function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    IMAGE: 'pi-image',
    VIDEO: 'pi-video',
    AUDIO: 'pi-volume-up',
    LATENT: 'pi-cube',
    MASK: 'pi-mask',
    DATA: 'pi-file',
  }
  return icons[type] || 'pi-file'
}

/**
 * Create format selector
 * @param options - Configuration options
 * @returns Format selector element
 */
export function createFormatSelector(options: FormatSelectorOptions = {}): HTMLElement {
  const {
    detectedType = null,
    selectedFormat = null,
    onFormatChange = null,
    showTypeIndicator = true,
    compact = false,
  } = options

  const theme = getComfyTheme()

  const container = document.createElement('div')
  container.className = 'dm-format-selector'
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 15px;
    background: ${theme.bgSecondary};
    border-radius: 8px;
    border: 1px solid ${theme.borderColor};
  `

  // Type indicator
  if (showTypeIndicator && detectedType) {
    const typeIndicator = document.createElement('div')
    typeIndicator.className = 'dm-type-indicator'
    const typeColor = getTypeColor(detectedType)
    typeIndicator.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: ${typeColor}20;
      border-left: 3px solid ${typeColor};
      border-radius: 4px;
      font-size: 12px;
      color: ${typeColor};
    `
    typeIndicator.innerHTML = `
      <i class="pi ${getTypeIcon(detectedType)}"></i>
      <span style="font-weight: 600;">${detectedType}</span>
      <span style="color: ${theme.textSecondary};">检测到</span>
    `
    container.appendChild(typeIndicator)
  }

  // Format selection area
  const formatSection = document.createElement('div')
  formatSection.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 8px;
  `

  const label = document.createElement('label')
  label.style.cssText = `
    font-size: 12px;
    color: ${theme.textSecondary};
    font-weight: 500;
  `
  label.textContent = '输出格式:'
  formatSection.appendChild(label)

  const formats = detectedType ? getFormatsForType(detectedType) : Object.keys(FORMAT_TYPE_MAP)
  const defaultFormat = selectedFormat || (detectedType ? formats[0] : 'png')

  if (compact) {
    // Compact mode: use dropdown
    const select = document.createElement('select')
    select.id = 'dm-format-select'
    select.className = 'comfy-combo'
    select.style.cssText = `
      width: 100%;
      padding: 8px 12px;
      background: ${theme.bgTertiary};
      border: 1px solid ${theme.borderColor};
      border-radius: 6px;
      color: ${theme.inputText};
      font-size: 13px;
      cursor: pointer;
    `
    formats.forEach((fmt) => {
      const option = document.createElement('option')
      option.value = fmt
      option.textContent = fmt.toUpperCase()
      if (fmt === defaultFormat) option.selected = true
      select.appendChild(option)
    })
    select.onchange = (e) => {
      if (onFormatChange) {
        onFormatChange((e.target as HTMLSelectElement).value)
      }
      updateFormatDescription((e.target as HTMLSelectElement).value)
    }
    formatSection.appendChild(select)
  } else {
    // Full mode: use button group
    const buttonGroup = document.createElement('div')
    buttonGroup.style.cssText = `
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    `
    buttonGroup.id = 'dm-format-buttons'

    formats.forEach((fmt) => {
      const btn = document.createElement('button')
      btn.className = 'comfy-btn dm-format-btn'
      btn.dataset.format = fmt
      const isSelected = fmt === defaultFormat
      btn.style.cssText = `
        padding: 8px 16px;
        background: ${isSelected ? theme.bgTertiary : theme.bgTertiary};
        border: 1px solid ${isSelected ? theme.accentColor : theme.borderColor};
        border-radius: 6px;
        color: ${isSelected ? theme.accentColor : theme.textPrimary};
        font-size: 12px;
        font-weight: ${isSelected ? '600' : '400'};
        cursor: pointer;
        transition: all 0.2s;
      `
      btn.textContent = fmt.toUpperCase()
      btn.onclick = () => {
        // Update all button states
        buttonGroup.querySelectorAll('.dm-format-btn').forEach((b) => {
          const btnEl = b as HTMLElement
          btnEl.style.background = theme.bgTertiary
          btnEl.style.borderColor = theme.borderColor
          btnEl.style.color = theme.textPrimary
          btnEl.style.fontWeight = '400'
        })
        // Activate current button
        btn.style.background = theme.bgTertiary
        btn.style.borderColor = theme.accentColor
        btn.style.color = theme.accentColor
        btn.style.fontWeight = '600'
        if (onFormatChange) {
          onFormatChange(fmt)
        }
        updateFormatDescription(fmt)
      }
      buttonGroup.appendChild(btn)
    })
    formatSection.appendChild(buttonGroup)
  }

  container.appendChild(formatSection)

  // Format description
  const description = document.createElement('div')
  description.id = 'dm-format-description'
  description.style.cssText = `
    font-size: 11px;
    color: ${theme.textSecondary};
    padding: 8px 12px;
    background: ${theme.bgPrimary};
    border-radius: 4px;
  `
  description.textContent = FORMAT_TYPE_MAP[defaultFormat]?.description || ''
  container.appendChild(description)

  // Initialize format description
  updateFormatDescription(defaultFormat)

  return container
}

/**
 * Update format description
 * @param format - Format string
 */
function updateFormatDescription(format: string): void {
  const descriptionEl = document.getElementById('dm-format-description')
  if (descriptionEl) {
    ;(descriptionEl as HTMLElement).textContent = FORMAT_TYPE_MAP[format]?.description || ''
  }
}
