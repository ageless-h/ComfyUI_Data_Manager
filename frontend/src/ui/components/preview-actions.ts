/**
 * ComfyUI Data Manager - Preview Actions Component
 */

import { FILE_TYPES, LIMITS } from '../../core/constants.js'
import { getTypeByExt } from '../../utils/file-type.js'
import { getPreviewUrl, getFileInfo } from '../../api/endpoints/file.js'
import { escapeHtml, formatSize } from '../../utils/format.js'
import { updateStatus, getFileName, getExt } from '../../utils/helpers.js'
import { loadScript } from '../../utils/script.js'
import { getComfyTheme } from '../../utils/theme.js'
import type { FileItem } from '../../core/state.js'

// Re-export highlight functions
export {
  highlightCode,
  highlightJSON,
  highlightPython,
  highlightJavaScript,
  highlightHTML,
  highlightCSS,
  highlightYAML,
  highlightXML,
  highlightGeneric,
} from '../../utils/syntax-highlight.js'

// Re-export table functions
export {
  createTableHTML,
  setupTableControls,
  createEmptyTableHTML,
  createUnsupportedTableHTML,
  createTableErrorHTML,
  parseSpreadsheet,
} from '../../utils/table.js'

/**
 * Preview file
 * @param path - File path
 */
export async function previewFile(path: string): Promise<void> {
  const { FileManagerState } = await import('../../core/state.js')
  const state = await import('../../core/state.js')
  const fmState = state.FileManagerState

  // Save current preview file
  fmState.currentPreviewFile = path

  const content = document.getElementById('dm-preview-content')
  const floatingBtn = document.getElementById('dm-open-floating-preview-btn')

  if (!content) return

  content.innerHTML = `
    <div class="dm-panel-loading" style="text-align: center; padding: 20px;">
      <i class="pi pi-spin pi-spinner"></i>
    </div>
  `

  const ext = getExt(path)
  const fileName = path.split(/[/\\]/).pop() || ''
  const fileType = getTypeByExt(ext)

  try {
    let previewHTML = ''
    let canOpenExternally = false

    // Image preview
    // Note: Image zoom controls are in the toolbar (right section), not embedded
    if (FILE_TYPES.image.exts.includes(ext)) {
      const imageUrl = getPreviewUrl(path)
      const imageId = `dm-panel-image-${Date.now()}`
      previewHTML = `
        <div style="display: flex; flex-direction: column; gap: 0;">
          <div class="dm-image-preview-container" style="position: relative; overflow: hidden; flex: 1; display: flex; align-items: center; justify-content: center;">
            <img id="${imageId}" src="${imageUrl}"
                 class="dm-panel-preview-image dm-zoomable-image"
                 style="max-width: 100%; max-height: 400px; border-radius: 8px; border: 1px solid;
                        transform-origin: center center; will-change: transform;"
                 onerror="this.parentElement.innerHTML='<div class=\\'dm-error-message\\' style=\\'padding: 20px;\\'>无法加载图像</div>'">
          </div>
        </div>
      `
      canOpenExternally = true

      // Store image ID for toolbar controls
      ;(content as unknown as { _imageId?: string })._imageId = imageId
    }
    // Audio preview
    else if (FILE_TYPES.audio.exts.includes(ext)) {
      const audioUrl = getPreviewUrl(path)
      previewHTML = `
        <div class="dm-panel-audio-preview" style="text-align: center; padding: 20px;">
          <i class="pi pi-volume-up dm-audio-icon" style="font-size: 64px;"></i>
          <div class="dm-preview-filename" style="margin-top: 15px;">${escapeHtml(fileName)}</div>
          <audio controls style="width: 100%; margin-top: 15px;">
            <source src="${audioUrl}" type="audio/mpeg">
          </audio>
        </div>
      `
      canOpenExternally = true
    }
    // Video preview
    else if (FILE_TYPES.video.exts.includes(ext)) {
      const videoUrl = getPreviewUrl(path)
      const videoId = `dm-panel-video-${Date.now()}`
      previewHTML = createVideoPreviewHTML(videoId, videoUrl)
      canOpenExternally = true
    }
    // External video format preview (.avi, etc.)
    else if (FILE_TYPES.videoExternal?.exts.includes(ext)) {
      const formatName = ext.toUpperCase().replace('.', '')
      previewHTML = `
        <div class="dm-external-video" style="text-align: center; padding: 40px;">
          <i class="pi pi-video dm-external-video-icon" style="font-size: 64px; margin-bottom: 15px;"></i>
          <div class="dm-preview-filename" style="margin-bottom: 15px; font-size: 16px;">${escapeHtml(fileName)}</div>
          <div class="dm-external-video-type" style="font-size: 14px; font-weight: 600; margin-bottom: 15px;">${formatName} 格式</div>
          <div class="dm-external-video-desc" style="margin-top: 10px; font-size: 12px; max-width: 300px; margin-left: auto; margin-right: auto;">
            此格式需要使用外部播放器打开<br>
            <span class="dm-external-video-sub">（VLC、Windows Media Player 等）</span>
          </div>
          <div class="dm-external-video-tip" style="margin-top: 15px; padding: 10px; border-radius: 6px; font-size: 11px;">
            提示：点击下方"打开"按钮可用外部播放器播放
          </div>
        </div>
      `
      canOpenExternally = true
    }
    // Code preview
    else if (FILE_TYPES.code.exts.includes(ext)) {
      const response = await fetch(getPreviewUrl(path))
      if (response.ok) {
        const text = await response.text()
        const { highlightCode } = await import('../../utils/syntax-highlight.js')
        previewHTML = createCodePreviewHTML(text, ext, highlightCode)
        canOpenExternally = true
      } else {
        throw new Error('Failed to load file')
      }
    }
    // Document preview
    else if (FILE_TYPES.document.exts.includes(ext)) {
      const docUrl = getPreviewUrl(path)
      previewHTML = await createDocumentPreviewHTML(path, ext, docUrl)
      canOpenExternally = true
    }
    // Spreadsheet preview
    else if (FILE_TYPES.spreadsheet.exts.includes(ext)) {
      previewHTML = await createSpreadsheetPreviewHTML(path, ext)
      canOpenExternally = true
    }
    // Other files
    else {
      const theme = getComfyTheme()
      const icon = FILE_TYPES[fileType]?.icon || FILE_TYPES.unknown.icon
      const color = FILE_TYPES[fileType]?.color || FILE_TYPES.unknown.color
      previewHTML = `
        <div style="text-align: center; padding: 30px;">
          <i class="pi ${icon}" style="font-size: 64px; color: ${color};"></i>
          <div style="margin-top: 15px; color: ${theme.textPrimary}; font-size: 14px;">${escapeHtml(fileName)}</div>
          <div style="margin-top: 8px; color: ${theme.textSecondary}; font-size: 12px;">此文件类型不支持预览</div>
        </div>
      `
    }

    content.innerHTML = previewHTML

    // Bind video controls
    if (FILE_TYPES.video.exts.includes(ext)) {
      setupVideoControls(content)
    }

    // Bind document fullscreen controls
    if (FILE_TYPES.document.exts.includes(ext)) {
      setupDocFullscreenControls(content)
    }

    // Update button
    if (floatingBtn) {
      ;(floatingBtn as HTMLElement).style.display = 'block'
      ;(floatingBtn as HTMLButtonElement).onclick = async () => {
        const { openFloatingPreview } = await import('../floating/window.js')
        openFloatingPreview(path, fileName)
      }
    }

    updateStatus(`预览: ${fileName}`)

    // Update file info area
    updateFileInfo(path)
  } catch (error) {
    const theme = getComfyTheme()
    content.innerHTML = `
      <div style="text-align: center; padding: 20px; color: ${theme.errorColor};">
        <i class="pi pi-exclamation-triangle" style="font-size: 32px;"></i>
        <div style="margin-top: 10px;">加载预览失败</div>
      </div>
    `
  }
}

/**
 * Create video preview HTML
 */
function createVideoPreviewHTML(videoId: string, videoUrl: string): string {
  return `
    <div style="display: flex; flex-direction: column; gap: 0;">
      <div class="dm-panel-video-container" style="position: relative; border-radius: 8px; overflow: hidden;">
        <video id="${videoId}" controls preload="metadata" style="width: 100%; max-height: 300px; display: block; object-fit: contain;">
          <source src="${videoUrl}" type="video/mp4">
        </video>
      </div>
      <div id="${videoId}-controls" class="dm-video-controls-panel" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; border-radius: 0 0 8px 8px; margin-top: -2px;">
        <button class="comfy-btn dm-video-play-btn" data-video-id="${videoId}" title="播放">
          <i class="pi pi-play"></i> 播放
        </button>
        <span id="${videoId}-time" class="dm-video-time-display">0:00 / 0:00</span>
        <button class="comfy-btn dm-video-volume-btn" data-video-id="${videoId}" title="音量">
          <i class="pi pi-volume-up"></i>
        </button>
        <button class="comfy-btn dm-video-fullscreen-btn" data-video-id="${videoId}" title="视频全屏">
          <i class="pi pi-arrows-alt"></i>
        </button>
      </div>
    </div>
  `
}

/**
 * Setup video controls
 */
function setupVideoControls(content: HTMLElement): void {
  const video = content.querySelector('video') as HTMLVideoElement
  const playBtn = content.querySelector('.dm-video-play-btn') as HTMLButtonElement
  const volumeBtn = content.querySelector('.dm-video-volume-btn') as HTMLButtonElement
  const fullscreenBtn = content.querySelector('.dm-video-fullscreen-btn') as HTMLButtonElement
  const timeDisplay = content.querySelector(`[id$="-time"]`) as HTMLElement

  if (!video || !playBtn) return

  playBtn.addEventListener('click', () => {
    if (video.paused) {
      video.play().then(() => {
        playBtn.innerHTML = '<i class="pi pi-pause"></i> 暂停'
      })
    } else {
      video.pause()
      playBtn.innerHTML = '<i class="pi pi-play"></i> 播放'
    }
  })

  video.addEventListener('play', () => {
    playBtn.innerHTML = '<i class="pi pi-pause"></i> 暂停'
  })

  video.addEventListener('pause', () => {
    playBtn.innerHTML = '<i class="pi pi-play"></i> 播放'
  })

  video.addEventListener('timeupdate', () => {
    const current = formatTime(video.currentTime)
    const duration = formatTime(video.duration)
    timeDisplay.textContent = `${current} / ${duration}`
  })

  if (volumeBtn) {
    volumeBtn.addEventListener('click', () => {
      video.muted = !video.muted
      volumeBtn.innerHTML = video.muted
        ? '<i class="pi pi-volume-off"></i>'
        : '<i class="pi pi-volume-up"></i>'
    })
  }

  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      if (video.requestFullscreen) {
        video.requestFullscreen()
      }
    })
  }
}

/**
 * Format time in MM:SS format
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Create code preview HTML
 */
function createCodePreviewHTML(
  text: string,
  ext: string,
  highlightCode: (code: string, ext: string) => string
): string {
  // Limit code length to prevent performance issues
  const maxLength = LIMITS.MAX_CODE_LENGTH
  const displayText =
    text.length > maxLength ? text.substring(0, maxLength) + '\n\n... (文件过大，已截断)' : text
  const highlighted = highlightCode(displayText, ext)
  return `
    <div class="dm-code-preview" style="width: 100%; padding: 15px;
                font-family: 'Consolas', 'Monaco', monospace; font-size: 12px; line-height: 1.5;
                overflow-x: auto; max-height: 400px; overflow-y: auto; border-radius: 0;">
      <pre class="dm-code-content" style="margin: 0; white-space: pre-wrap;">${highlighted}</pre>
    </div>
  `
}

/**
 * Create document preview HTML
 */
async function createDocumentPreviewHTML(
  path: string,
  ext: string,
  docUrl: string
): Promise<string> {
  const fileName = getFileName(path)

  if (ext === '.md') {
    // Use iframe for backend markdown rendering
    return `
      <div style="display: flex; flex-direction: column; gap: 0;">
        <div style="width: 100%; height: 400px; overflow: hidden; flex: 1;">
          <iframe src="${docUrl}" style="width: 100%; height: 100%; border: none;"></iframe>
        </div>
        <div class="dm-doc-controls" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px;">
          <button class="comfy-btn dm-doc-fullscreen-btn" data-doc-path="${escapeHtml(path)}" title="全屏">
            <i class="pi pi-window-maximize"></i> 全屏
          </button>
        </div>
      </div>
    `
  }

  if (ext === '.pdf') {
    return `
      <div style="display: flex; flex-direction: column; gap: 0; height: 100%;">
        <div style="width: 100%; flex: 1; min-height: 400px; overflow: hidden;">
          <embed src="${docUrl}" type="application/pdf" style="width: 100%; height: 100%; border: none;" />
        </div>
        <div class="dm-doc-controls" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px;">
          <button class="comfy-btn dm-doc-fullscreen-btn" data-doc-path="${escapeHtml(path)}" title="全屏">
            <i class="pi pi-window-maximize"></i> 全屏
          </button>
        </div>
      </div>
    `
  }

  // DOCX preview with mammoth.js
  if (ext === '.docx') {
    try {
      const response = await fetch(docUrl)
      if (!response.ok) throw new Error('Failed to load file')

      const buffer = await response.arrayBuffer()

      // Dynamically load mammoth.js
      await loadScript(
        'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js'
      )

      const mammoth = (
        window as unknown as {
          mammoth?: { convertToHtml(options: { arrayBuffer: ArrayBuffer }): { value: string } }
        }
      ).mammoth
      if (!mammoth) throw new Error('mammoth.js not available')

      const result = mammoth.convertToHtml({ arrayBuffer: buffer })
      const contentId = `dm-doc-content-${Date.now()}`

      return `
        <div style="display: flex; flex-direction: column; gap: 0; height: 100%;">
          <div id="${contentId}" class="dm-docx-content"
               style="flex: 1; overflow-y: auto; padding: 20px; box-sizing: border-box;">
            <style>
              #${contentId} img { max-width: 100%; height: auto; display: inline-block; margin: 10px 0; }
              #${contentId} p { word-wrap: break-word; overflow-wrap: break-word; margin: 0.5em 0; }
              #${contentId} table { max-width: 100%; overflow: auto; display: block; margin: 10px 0; }
            </style>
            ${result.value}
          </div>
          <div class="dm-doc-controls" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px;">
            <button class="comfy-btn dm-doc-fullscreen-btn" data-doc-path="${escapeHtml(path)}" title="全屏">
              <i class="pi pi-window-maximize"></i> 全屏
            </button>
          </div>
        </div>
      `
    } catch (error) {
      return `
        <div style="text-align: center; padding: 40px; color: #e74c3c;">
          <i class="pi pi-exclamation-triangle" style="font-size: 48px;"></i>
          <div style="margin-top: 15px;">${escapeHtml(fileName)}</div>
          <div style="margin-top: 10px;">预览加载失败</div>
          <div style="margin-top: 5px; font-size: 11px;">${escapeHtml((error as Error).message)}</div>
        </div>
      `
    }
  }

  // DOC format - not supported
  if (ext === '.doc') {
    const theme = getComfyTheme()
    return `
      <div style="text-align: center; padding: 40px;">
        <i class="pi pi-file-word" style="font-size: 64px; color: ${theme.textSecondary};"></i>
        <div style="margin-top: 15px;">${escapeHtml(fileName)}</div>
        <div style="margin-top: 10px;">.doc 格式暂不支持预览</div>
        <div style="margin-top: 5px; font-size: 11px;">请转换为 .docx 或点击"打开"按钮</div>
      </div>
    `
  }

  // TXT/RTF text preview
  if (ext === '.txt' || ext === '.rtf') {
    try {
      const response = await fetch(docUrl)
      if (!response.ok) throw new Error('Failed to load file')

      const text = await response.text()
      const contentId = `dm-doc-content-${Date.now()}`

      return `
        <div style="display: flex; flex-direction: column; gap: 0; height: 100%;">
          <div id="${contentId}" class="dm-text-content"
               style="flex: 1; overflow-y: auto; padding: 15px; box-sizing: border-box;
                      font-family: 'Consolas', 'Monaco', monospace;
                      font-size: 13px; line-height: 1.6;
                      word-break: break-word; white-space: pre-wrap;">${escapeHtml(text)}</div>
          <div class="dm-doc-controls" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px;">
            <button class="comfy-btn dm-doc-fullscreen-btn" data-doc-path="${escapeHtml(path)}" title="全屏">
              <i class="pi pi-window-maximize"></i> 全屏
            </button>
          </div>
        </div>
      `
    } catch (error) {
      return `
        <div style="text-align: center; padding: 40px; color: #e74c3c;">
          <i class="pi pi-exclamation-triangle" style="font-size: 48px;"></i>
          <div style="margin-top: 15px;">${escapeHtml(fileName)}</div>
          <div style="margin-top: 10px;">预览加载失败</div>
          <div style="margin-top: 5px; font-size: 11px;">${escapeHtml((error as Error).message)}</div>
        </div>
      `
    }
  }

  const theme = getComfyTheme()
  return `
    <div style="text-align: center; padding: 40px;">
      <i class="pi pi-file" style="font-size: 64px; color: ${theme.textSecondary};"></i>
      <div style="margin-top: 15px; font-size: 14px;">${escapeHtml(fileName)}</div>
      <div style="margin-top: 8px; font-size: 12px; color: ${theme.textSecondary};">文档预览</div>
    </div>
  `
}

/**
 * Create spreadsheet preview HTML
 */
async function createSpreadsheetPreviewHTML(path: string, ext: string): Promise<string> {
  const { parseSpreadsheet } = await import('../../utils/table.js')
  try {
    const rows = await parseSpreadsheet(path, ext)
    const { createTableHTML } = await import('../../utils/table.js')
    return createTableHTML(rows, { type: 'panel', path })
  } catch (error) {
    const theme = getComfyTheme()
    return `
      <div style="text-align: center; padding: 40px; color: ${theme.errorColor};">
        <i class="pi pi-exclamation-triangle" style="font-size: 48px;"></i>
        <div style="margin-top: 15px;">表格解析失败</div>
        <div style="margin-top: 5px; font-size: 11px;">${escapeHtml((error as Error).message)}</div>
      </div>
    `
  }
}

/**
 * Update file info area
 */
async function updateFileInfo(path: string): Promise<void> {
  const infoSection = document.getElementById('dm-file-info')
  if (!infoSection) return

  try {
    const info = await getFileInfo(path)
    infoSection.innerHTML = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <span>文件名:</span>
        <span>${escapeHtml(info.name)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <span><i class="pi pi-database"></i> 大小:</span>
        <span>${formatSize(info.size)}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span><i class="pi pi-clock"></i> 修改时间:</span>
        <span>${info.modified ? new Date(info.modified).toLocaleString('zh-CN') : '-'}</span>
      </div>
    `
  } catch (error) {
    infoSection.innerHTML = `<div style="text-align: center;">无法获取文件信息</div>`
  }
}

/**
 * Setup image zoom controls
 * @param imageId - Image element ID
 */
export function setupImageZoomControls(imageId: string): void {
  const image = document.getElementById(imageId) as HTMLImageElement
  if (!image) return

  const zoomOutBtn = document.querySelector(
    `.dm-zoom-out-btn[data-image-id="${imageId}"]`
  ) as HTMLButtonElement
  const zoomInBtn = document.querySelector(
    `.dm-zoom-in-btn[data-image-id="${imageId}"]`
  ) as HTMLButtonElement
  const resetBtn = document.querySelector(
    `.dm-zoom-reset-btn[data-image-id="${imageId}"]`
  ) as HTMLButtonElement
  const zoomDisplay = document.getElementById(`${imageId}-zoom`) as HTMLElement

  if (!zoomOutBtn || !zoomInBtn || !zoomDisplay) return

  let zoom = 100
  let imageTranslateX = 0
  let imageTranslateY = 0
  let isDraggingImage = false
  let dragStart = { x: 0, y: 0 }

  function updateZoom(): void {
    const scale = zoom / 100
    // Translate first, then scale - this way drag distance is consistent
    image.style.transform = `translate(${imageTranslateX}px, ${imageTranslateY}px) scale(${scale})`
    if (zoomDisplay) zoomDisplay.textContent = `${zoom}%`

    // Remove max-width/max-height constraints when zoomed in
    if (zoom > 100) {
      image.style.maxWidth = 'none'
      image.style.maxHeight = 'none'
    } else {
      image.style.maxWidth = '100%'
      image.style.maxHeight = '100%'
    }
  }

  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
      zoom = Math.min(zoom + LIMITS.DEFAULT_ZOOM_STEP, LIMITS.MAX_ZOOM_DISPLAY)
      updateZoom()
    })
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
      zoom = Math.max(zoom - LIMITS.DEFAULT_ZOOM_STEP, LIMITS.MIN_ZOOM_DISPLAY)
      updateZoom()
    })
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      // Reset to original state
      zoom = 100
      imageTranslateX = 0
      imageTranslateY = 0
      updateZoom()
    })
  }

  // Mouse wheel zoom
  const container = image.parentElement
  if (container) {
    container.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -LIMITS.DEFAULT_ZOOM_STEP : LIMITS.DEFAULT_ZOOM_STEP
        zoom = Math.max(LIMITS.MIN_ZOOM_DISPLAY, Math.min(LIMITS.MAX_ZOOM_DISPLAY, zoom + delta))
        updateZoom()
      },
      { passive: false }
    )
  }

  // Image drag (pan)
  image.addEventListener('mousedown', (e) => {
    if (zoom <= 100) return
    isDraggingImage = true
    dragStart = { x: e.clientX - imageTranslateX, y: e.clientY - imageTranslateY }
    image.style.cursor = 'grabbing'
  })

  document.addEventListener('mousemove', (e) => {
    if (!isDraggingImage) return
    imageTranslateX = e.clientX - dragStart.x
    imageTranslateY = e.clientY - dragStart.y
    updateZoom()
  })

  document.addEventListener('mouseup', () => {
    if (isDraggingImage) {
      isDraggingImage = false
      image.style.cursor = 'grab'
    }
  })
}

/**
 * Setup document fullscreen controls
 * @param content - Content container element
 */
function setupDocFullscreenControls(content: HTMLElement): void {
  const fullscreenBtns = content.querySelectorAll('.dm-doc-fullscreen-btn')
  fullscreenBtns.forEach((btn) => {
    const path = (btn as HTMLElement).getAttribute('data-doc-path')
    if (path) {
      btn.addEventListener('click', async () => {
        const fileName = path.split(/[\\/]/).pop() || path
        const { openFloatingPreview } = await import('../floating/window.js')
        openFloatingPreview(path, fileName)
      })
    }
  })
}
