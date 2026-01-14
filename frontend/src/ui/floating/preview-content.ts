/**
 * ComfyUI Data Manager - Floating Window Preview Content Loading
 */

import { FILE_TYPES, LIMITS } from '../../core/constants.js'
import { getFileType } from '../../utils/file-type.js'
import { escapeHtml, formatSize } from '../../utils/format.js'
import { highlightCode } from '../../utils/syntax-highlight.js'
import {
  createTableHTML,
  setupTableControls,
  createEmptyTableHTML,
  createUnsupportedTableHTML,
  createTableErrorHTML,
  parseSpreadsheet,
} from '../../utils/table.js'
import { loadScript } from '../../utils/script.js'
import { getFileInfo } from '../../api/endpoints/file.js'
import { getComfyTheme } from '../../utils/theme.js'

/**
 * Clean mammoth.js output to remove internal function references
 * mammoth.js sometimes includes internal object references like `function(){return value.call(this._target())}`
 * in the HTML output, which need to be filtered out.
 */
function cleanMammothOutput(html: unknown): string {
  // Ensure input is a string
  if (typeof html !== 'string') {
    return String(html ?? '')
  }

  let cleaned = html

  // Remove function() {...} patterns (including multi-line)
  const functionPattern = /function\s*\(\s*\)\s*\{[\s\S]*?\}/g
  cleaned = cleaned.replace(functionPattern, '')

  // Remove specific mammoth internal references
  const targetPattern = /function\s*\(\s*\)\s*\{\s*(return\s+)?[\w.]*\.?(?:_?target|value)\s*(?:\.call\([^)]*\))?[\s;]*\}/g
  cleaned = cleaned.replace(targetPattern, '')

  // Remove any remaining object-like patterns (e.g., {value:..., _target:...})
  const objectPattern = /\{[^}]*_target[^}]*\}/g
  cleaned = cleaned.replace(objectPattern, '')

  return cleaned
}

/**
 * Load preview content into container
 * @param content - Content container element
 * @param path - File path
 * @param ext - File extension
 * @param scale - Initial scale (for images only)
 * @param imageId - Pre-generated image ID (for images only)
 */
export async function loadPreviewContent(
  content: HTMLElement,
  path: string,
  ext: string,
  scale: number = 1,
  imageId?: string
): Promise<void> {
  const theme = getComfyTheme()
  content.innerHTML = `
    <div class="dm-loading" style="text-align: center; padding: 20px;">
      <i class="pi pi-spin pi-spinner" style="font-size: 24px;"></i>
      <div style="margin-top: 10px;">正在加载...</div>
    </div>
  `

  try {
    let previewHTML = ''

    // Image preview
    // Note: Image zoom controls are in the toolbar (right section), not embedded
    if (FILE_TYPES.image.exts.includes(ext)) {
      const imageUrl = `/dm/preview?path=${encodeURIComponent(path)}`
      // Use provided imageId or generate a new one (fallback)
      const imgId = imageId || `dm-floating-image-${Date.now()}`
      previewHTML = `
        <div style="display: flex; flex-direction: column; gap: 0; height: 100%;">
          <div class="dm-floating-image-container" style="position: relative; overflow: hidden; flex: 1; display: flex; align-items: center; justify-content: center;">
            <img id="${imgId}" src="${imageUrl}"
                 class="dm-zoomable-image dm-preview-image"
                 style="width: auto; height: auto; max-width: 100%; max-height: 100%;
                        border-radius: 8px; border: 1px solid;
                        transform-origin: center center;
                        will-change: transform; cursor: grab;"
                 onerror="this.parentElement.innerHTML='<div class=\\'dm-error-message\\' style=\\'padding: 20px;\\'>无法加载图像</div>'"
                 onload="this.style.opacity=1; this.style.display='block';">
          </div>
        </div>
      `
    }
    // Audio preview
    // Note: Audio controls are in the window toolbar, created by window.ts
    else if (FILE_TYPES.audio.exts.includes(ext)) {
      const audioUrl = `/dm/preview?path=${encodeURIComponent(path)}`
      // Use provided mediaId or generate a new one (fallback)
      const audioId = imageId || `dm-preview-audio-${Date.now()}`
      const displayName = escapeHtml(path.split(/[/\\]/).pop() || '')
      const audioExt = ext.toLowerCase()
      const audioMimeType =
        audioExt === '.mp3'
          ? 'audio/mpeg'
          : audioExt === '.wav'
            ? 'audio/wav'
            : audioExt === '.flac'
              ? 'audio/flac'
              : audioExt === '.aac'
                ? 'audio/aac'
                : audioExt === '.ogg'
                  ? 'audio/ogg'
                  : audioExt === '.m4a'
                    ? 'audio/mp4'
                    : 'audio/mpeg'
      previewHTML = `
        <div class="dm-audio-preview" style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px;">
          <i class="pi pi-volume-up dm-audio-icon" style="font-size: 64px; margin-bottom: 15px;"></i>
          <div class="dm-preview-filename" style="margin-bottom: 15px; font-size: 14px;">${displayName}</div>
          <audio id="${audioId}" data-audio-id="${audioId}" preload="metadata" style="width: 100%; max-width: 400px; display: none;">
            <source src="${audioUrl}" type="${audioMimeType}">
            您的浏览器不支持音频播放
          </audio>
        </div>
      `
    }
    // Video preview (browser supported)
    // Note: Video controls are in the window toolbar, created by window.ts
    else if (FILE_TYPES.video.exts.includes(ext)) {
      const videoUrl = `/dm/preview?path=${encodeURIComponent(path)}`
      // Use provided mediaId or generate a new one (fallback)
      const videoId = imageId || `dm-preview-video-${Date.now()}`
      previewHTML = `
        <div class="dm-video-preview-container" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: ${theme.bgPrimary};">
          <video id="${videoId}" data-video-id="${videoId}" preload="metadata" style="width: 100%; height: 100%; display: block; object-fit: contain;">
            <source src="${videoUrl}" type="video/mp4">
          </video>
        </div>
      `
    }
    // External video format preview (requires external player)
    else if (FILE_TYPES.videoExternal && FILE_TYPES.videoExternal.exts.includes(ext)) {
      const extUpper = ext.toUpperCase().replace('.', '')
      const displayName = escapeHtml(path.split(/[\\/]/).pop() || '')
      previewHTML = `
        <div class="dm-external-video" style="text-align: center; padding: 40px;">
          <i class="pi pi-video dm-external-video-icon" style="font-size: 64px; margin-bottom: 15px;"></i>
          <div class="dm-preview-filename" style="font-size: 16px; margin-bottom: 8px;">${displayName}</div>
          <div class="dm-external-video-type" style="font-size: 14px; font-weight: 600; margin-bottom: 15px;">${extUpper} 格式</div>
          <div class="dm-external-video-desc" style="margin-top: 10px; font-size: 12px; max-width: 300px; margin-left: auto; margin-right: auto;">
            此格式需要使用外部播放器打开<br>
            <span class="dm-external-video-sub">（VLC、Windows Media Player 等）</span>
          </div>
          <div class="dm-external-video-tip" style="margin-top: 15px; padding: 10px; border-radius: 6px; font-size: 11px;">
            提示：点击下方"打开"按钮可用外部播放器播放
          </div>
        </div>
      `
    }
    // Code preview
    else if (FILE_TYPES.code.exts.includes(ext)) {
      const response = await fetch(`/dm/preview?path=${encodeURIComponent(path)}`)
      if (response.ok) {
        const text = await response.text()
        const highlighted = highlightCode(text, ext)
        previewHTML = `
          <div class="dm-code-preview" style="width: 100%; padding: 15px;
                      font-family: 'Consolas', 'Monaco', monospace; font-size: 12px; line-height: 1.5;
                      overflow-x: auto; max-height: 400px; overflow-y: auto; border-radius: 0;">
            <pre class="dm-code-content" style="margin: 0; white-space: pre-wrap;">${highlighted}</pre>
          </div>
        `
      } else {
        throw new Error('Failed to load file')
      }
    }
    // Document preview
    else if (FILE_TYPES.document.exts.includes(ext)) {
      const docUrl = `/dm/preview?path=${encodeURIComponent(path)}`
      const isPDF = ext === '.pdf'
      const isMarkdown = ext === '.md'
      const isDocx = ext === '.docx'
      const isDoc = ext === '.doc'

      if (isDoc) {
        // Old Word documents cannot be previewed
        const displayName = escapeHtml(path.split(/[/\\]/).pop() || '')
        previewHTML = `
          <div class="dm-doc-unsupported" style="text-align: center; padding: 40px;">
            <i class="pi pi-file-word dm-doc-unsupported-icon" style="font-size: 64px; margin-bottom: 15px;"></i>
            <div class="dm-preview-filename" style="margin-top: 15px; font-size: 14px;">${displayName}</div>
            <div class="dm-unsupported-message" style="margin-top: 10px; font-size: 12px;">.doc 格式暂不支持预览</div>
            <div class="dm-unsupported-sub" style="margin-top: 5px; font-size: 11px;">请转换为 .docx 或点击"打开"按钮</div>
          </div>
        `
      } else if (isDocx) {
        // .docx files use mammoth.js to convert to HTML
        try {
          const response = await fetch(docUrl)
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer()

            // Check if mammoth.js is loaded
            if (typeof (window as unknown as { mammoth?: unknown }).mammoth === 'undefined') {
              // Dynamically load mammoth.js
              console.log('[DataManager] Loading mammoth.js...')
              try {
                await loadScript(
                  'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js'
                )
                console.log('[DataManager] mammoth.js loaded successfully')
              } catch (scriptError) {
                console.error('[DataManager] Failed to load mammoth.js:', scriptError)
                throw new Error('无法加载 mammoth.js，请检查网络连接')
              }
            }

            const mammoth = (
              window as unknown as {
                mammoth?: {
                  convertToHtml: (options: { arrayBuffer: ArrayBuffer }) => Promise<{
                    value: string
                    messages: unknown[]
                  }>
                }
              }
            ).mammoth
            if (mammoth) {
              // mammoth.convertToHtml returns a Promise, so we need to await it
              const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer })
              const rawHtml = result.value

              // Clean mammoth output to remove internal function references
              const cleanedHtml = cleanMammothOutput(rawHtml)
              const contentId = `dm-doc-content-${Date.now()}`
              previewHTML = `
                <div id="${contentId}" class="dm-document-content dm-docx-content"
                     style="width: 100%; height: 100%;
                            font-family: 'Segoe UI', Arial, sans-serif;
                            font-size: 13px;
                            line-height: 1.6;
                            overflow: auto;
                            box-sizing: border-box;
                            padding: 20px;">
                  <style>
                    #${contentId} img { max-width: 100%; height: auto; display: inline-block; margin: 10px 0; }
                    #${contentId} p { word-wrap: break-word; overflow-wrap: break-word; margin: 0.5em 0; }
                    #${contentId} table { max-width: 100%; overflow: auto; display: block; margin: 10px 0; }
                  </style>
                  ${cleanedHtml}
                </div>
              `
            } else {
              throw new Error('mammoth.js 加载后未找到全局变量')
            }
          } else {
            throw new Error('Failed to load file')
          }
        } catch (error) {
          console.error('[DataManager] DOCX preview error:', error)
          const displayName = escapeHtml(path.split(/[/\\]/).pop() || '')
          previewHTML = `
            <div class="dm-preview-error" style="text-align: center; padding: 40px;">
              <i class="pi pi-exclamation-triangle dm-error-icon" style="font-size: 48px;"></i>
              <div class="dm-preview-filename" style="margin-top: 15px;">${displayName}</div>
              <div class="dm-error-title" style="margin-top: 10px; font-size: 12px;">预览加载失败</div>
              <div class="dm-error-detail" style="margin-top: 5px; font-size: 11px;">${escapeHtml((error as Error).message)}</div>
            </div>
          `
        }
      } else if (isPDF) {
        previewHTML = `
          <div style="width: 100%; height: 100%; overflow: hidden;">
            <embed id="dm-floating-pdf-embed" src="${docUrl}" type="application/pdf"
                   style="width: 100%; height: 100%; border: none; display: block;" />
          </div>
        `
      } else if (isMarkdown) {
        // Markdown preview - use iframe for backend rendering
        previewHTML = `
          <div style="width: 100%; height: 100%; border: 1px solid ${theme.borderColor}; overflow: hidden;">
            <iframe src="${docUrl}" style="width: 100%; height: 100%; border: none;"></iframe>
          </div>
        `
      } else if (ext === '.txt' || ext === '.rtf') {
        // TXT/RTF text preview - fetch and display content
        try {
          const response = await fetch(docUrl)
          if (response.ok) {
            const text = await response.text()
            const contentId = `dm-doc-content-${Date.now()}`
            previewHTML = `
              <div id="${contentId}" class="dm-document-content dm-text-content"
                   style="width: 100%; height: 100%;
                          font-family: 'Consolas', 'Monaco', monospace;
                          font-size: 13px;
                          line-height: 1.6;
                          overflow: auto;
                          word-break: break-word;
                          white-space: pre-wrap;
                          padding: 15px;">${escapeHtml(text)}</div>
            `
          } else {
            throw new Error('Failed to load file')
          }
        } catch (error) {
          console.error('[DataManager] Text preview error:', error)
          const displayName = escapeHtml(path.split(/[/\\]/).pop() || '')
          previewHTML = `
            <div class="dm-preview-error" style="text-align: center; padding: 40px;">
              <i class="pi pi-exclamation-triangle dm-error-icon" style="font-size: 48px;"></i>
              <div class="dm-preview-filename" style="margin-top: 15px;">${displayName}</div>
              <div class="dm-error-title" style="margin-top: 10px; font-size: 12px;">预览加载失败</div>
              <div class="dm-error-detail" style="margin-top: 5px; font-size: 11px;">${escapeHtml((error as Error).message)}</div>
            </div>
          `
        }
      } else {
        // Other documents
        const displayName = escapeHtml(path.split(/[/\\]/).pop() || '')
        previewHTML = `
          <div style="text-align: center; padding: 40px;">
            <i class="pi pi-file" style="font-size: 64px; color: ${theme.textSecondary};"></i>
            <div style="margin-top: 15px; font-size: 14px;">${displayName}</div>
            <div style="margin-top: 8px; font-size: 12px; color: ${theme.textSecondary};">点击"打开"按钮查看文档</div>
          </div>
        `
      }
    }
    // Spreadsheet preview
    else if (FILE_TYPES.spreadsheet.exts.includes(ext)) {
      try {
        const rows = await parseSpreadsheet(path, ext)
        previewHTML = createTableHTML(rows, { type: 'floating', hasFullscreen: true, path })
      } catch (error) {
        previewHTML = createTableErrorHTML((error as Error).message)
      }
    }
    // Other files
    else {
      const fileName = path.split(/[/\\]/).pop() || ''
      const fileType = getFileType({ name: path })
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

    // Update file info
    updateFileInfo(content, path)
  } catch (error) {
    content.innerHTML = `
      <div class="dm-preview-error" style="text-align: center; padding: 40px;">
        <i class="pi pi-exclamation-triangle dm-error-icon" style="font-size: 48px;"></i>
        <div class="dm-error-title" style="margin-top: 15px; font-size: 14px;">加载失败</div>
        <div class="dm-error-detail" style="margin-top: 5px; font-size: 11px;">${escapeHtml((error as Error).message)}</div>
      </div>
    `
  }
}

/**
 * Update file info display
 */
async function updateFileInfo(content: HTMLElement, path: string): Promise<void> {
  // Find file info element within the floating window
  const fileInfo = content.parentElement?.querySelector('.dm-floating-file-info') as HTMLElement
  if (!fileInfo) return

  try {
    const info = await getFileInfo(path)
    fileInfo.innerHTML = `
      <div style="display: flex; justify-content: space-between; gap: 15px;">
        <span>${escapeHtml(info.name)}</span>
        <span>${formatSize(info.size)}</span>
      </div>
    `
  } catch (error) {
    fileInfo.innerHTML = '<span style="opacity: 0.5;">无法获取文件信息</span>'
  }
}
