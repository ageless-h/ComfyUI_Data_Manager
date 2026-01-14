/**
 * ComfyUI Data Manager - Floating Window Preview Content Loading
 */

import { FILE_TYPES, LIMITS } from '../../core/constants.js';
import { getFileType } from '../../utils/file-type.js';
import { escapeHtml } from '../../utils/format.js';
import { highlightCode } from '../../utils/syntax-highlight.js';
import { createTableHTML, setupTableControls, createEmptyTableHTML, createUnsupportedTableHTML, createTableErrorHTML, parseSpreadsheet } from '../../utils/table.js';
import { loadScript } from '../../utils/script.js';

/**
 * Load preview content into container
 * @param content - Content container element
 * @param path - File path
 * @param ext - File extension
 * @param scale - Initial scale (for images only)
 */
export async function loadPreviewContent(content: HTMLElement, path: string, ext: string, scale: number = 1): Promise<void> {
  content.innerHTML = `
    <div class="dm-loading" style="text-align: center; padding: 20px;">
      <i class="pi pi-spin pi-spinner" style="font-size: 24px;"></i>
      <div style="margin-top: 10px;">正在加载...</div>
    </div>
  `;

  try {
    let previewHTML = "";

    // Image preview
    if (FILE_TYPES.image.exts.includes(ext)) {
      const imageUrl = `/dm/preview?path=${encodeURIComponent(path)}`;
      previewHTML = `
        <img src="${imageUrl}"
             class="dm-zoomable-image dm-preview-image"
             style="max-width: 100%; max-height: 400px;
                    border-radius: 8px; border: 1px solid;
                    transform-origin: center center;
                    will-change: transform;"
             onerror="this.parentElement.innerHTML='<div class=\\'dm-error-message\\' style=\\'padding: 20px;\\'>无法加载图像</div>'"
             onload="this.style.opacity=1; this.style.display='block';">
      `;
    }
    // Audio preview
    else if (FILE_TYPES.audio.exts.includes(ext)) {
      const audioUrl = `/dm/preview?path=${encodeURIComponent(path)}`;
      const audioId = `dm-preview-audio-${Date.now()}`;
      const displayName = escapeHtml(path.split(/[/\\]/).pop() || "");
      previewHTML = `
        <div class="dm-audio-preview" style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px;">
          <i class="pi pi-volume-up dm-audio-icon" style="font-size: 64px; margin-bottom: 15px;"></i>
          <div class="dm-preview-filename" style="margin-bottom: 15px; font-size: 14px;">${displayName}</div>
          <audio id="${audioId}" preload="metadata" style="width: 100%; max-width: 400px;">
            <source src="${audioUrl}">
            您的浏览器不支持音频播放
          </audio>
        </div>
      `;
    }
    // Video preview (browser supported)
    else if (FILE_TYPES.video.exts.includes(ext)) {
      const videoUrl = `/dm/preview?path=${encodeURIComponent(path)}`;
      const videoId = `dm-preview-video-${Date.now()}`;
      previewHTML = `
        <div class="dm-video-preview" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
          <video id="${videoId}"
                 preload="metadata"
                 style="width: 100%; height: 100%; max-height: 100%; object-fit: contain; border-radius: 8px;">
            <source src="${videoUrl}">
            您的浏览器不支持视频播放
          </video>
        </div>
      `;
    }
    // External video format preview (requires external player)
    else if (FILE_TYPES.videoExternal && FILE_TYPES.videoExternal.exts.includes(ext)) {
      const extUpper = ext.toUpperCase().replace('.', '');
      const displayName = escapeHtml(path.split(/[\\/]/).pop() || "");
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
      `;
    }
    // Code preview
    else if (FILE_TYPES.code.exts.includes(ext)) {
      const response = await fetch(`/dm/preview?path=${encodeURIComponent(path)}`);
      if (response.ok) {
        const text = await response.text();
        const highlighted = highlightCode(text, ext);
        previewHTML = `
          <div class="dm-code-preview" style="width: 100%; padding: 15px;
                      font-family: 'Consolas', 'Monaco', monospace; font-size: 12px; line-height: 1.5;
                      overflow-x: auto; max-height: 400px; overflow-y: auto; border-radius: 0;">
            <pre class="dm-code-content" style="margin: 0; white-space: pre-wrap;">${highlighted}</pre>
          </div>
        `;
      } else {
        throw new Error('Failed to load file');
      }
    }
    // Document preview
    else if (FILE_TYPES.document.exts.includes(ext)) {
      const docUrl = `/dm/preview?path=${encodeURIComponent(path)}`;
      const isPDF = ext === '.pdf';
      const isMarkdown = ext === '.md';
      const isDocx = ext === '.docx';
      const isDoc = ext === '.doc';

      if (isDoc) {
        // Old Word documents cannot be previewed
        const displayName = escapeHtml(path.split(/[/\\]/).pop() || "");
        previewHTML = `
          <div class="dm-doc-unsupported" style="text-align: center; padding: 40px;">
            <i class="pi pi-file-word dm-doc-unsupported-icon" style="font-size: 64px; margin-bottom: 15px;"></i>
            <div class="dm-preview-filename" style="margin-top: 15px; font-size: 14px;">${displayName}</div>
            <div class="dm-unsupported-message" style="margin-top: 10px; font-size: 12px;">.doc 格式暂不支持预览</div>
            <div class="dm-unsupported-sub" style="margin-top: 5px; font-size: 11px;">请转换为 .docx 或点击"打开"按钮</div>
          </div>
        `;
      } else if (isDocx) {
        // .docx files use mammoth.js to convert to HTML
        try {
          const response = await fetch(docUrl);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();

            // Check if mammoth.js is loaded
            if (typeof (window as unknown as { mammoth?: unknown }).mammoth === 'undefined') {
              // Dynamically load mammoth.js
              await loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js');
            }

            const mammoth = (window as unknown as { mammoth: { convertToHtml: (options: { arrayBuffer: ArrayBuffer }) => { value: string } } }).mammoth;
            if (typeof mammoth !== 'undefined') {
              const result = mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
              const contentId = `dm-doc-content-${Date.now()}`;
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
                  ${result.value}
                </div>
              `;
            } else {
              throw new Error('mammoth.js not available');
            }
          } else {
            throw new Error('Failed to load file');
          }
        } catch (error) {
          console.error('[DataManager] DOCX preview error:', error);
          const displayName = escapeHtml(path.split(/[/\\]/).pop() || "");
          previewHTML = `
            <div class="dm-preview-error" style="text-align: center; padding: 40px;">
              <i class="pi pi-exclamation-triangle dm-error-icon" style="font-size: 48px;"></i>
              <div class="dm-preview-filename" style="margin-top: 15px;">${displayName}</div>
              <div class="dm-error-title" style="margin-top: 10px; font-size: 12px;">预览加载失败</div>
              <div class="dm-error-detail" style="margin-top: 5px; font-size: 11px;">${escapeHtml((error as Error).message)}</div>
            </div>
          `;
        }
      } else if (isPDF) {
        previewHTML = `
          <div style="width: 100%; height: 100%; overflow: hidden;">
            <embed id="dm-floating-pdf-embed" src="${docUrl}" type="application/pdf"
                   style="width: 100%; height: 100%; border: none; display: block;" />
          </div>
        `;
      } else if (isMarkdown) {
        // Markdown preview
        const response = await fetch(docUrl);
        const text = await response.text();
        previewHTML = `
          <div class="dm-markdown-preview" style="padding: 20px; font-size: 13px; line-height: 1.6; overflow-y: auto; max-height: 100%;">
            <pre style="white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(text)}</pre>
          </div>
        `;
      } else {
        // Other documents
        const displayName = escapeHtml(path.split(/[/\\]/).pop() || "");
        previewHTML = `
          <div style="text-align: center; padding: 40px;">
            <i class="pi pi-file" style="font-size: 64px; color: #888;"></i>
            <div style="margin-top: 15px; font-size: 14px;">${displayName}</div>
            <div style="margin-top: 8px; font-size: 12px; color: #888;">点击"打开"按钮查看文档</div>
          </div>
        `;
      }
    }
    // Spreadsheet preview
    else if (FILE_TYPES.spreadsheet.exts.includes(ext)) {
      try {
        const rows = await parseSpreadsheet(path, ext);
        previewHTML = createTableHTML(rows, { type: 'floating' });
      } catch (error) {
        previewHTML = createTableErrorHTML((error as Error).message);
      }
    }
    // Other files
    else {
      const fileName = path.split(/[/\\]/).pop() || "";
      const fileType = getFileType({ name: path });
      const icon = FILE_TYPES[fileType]?.icon || FILE_TYPES.unknown.icon;
      const color = FILE_TYPES[fileType]?.color || FILE_TYPES.unknown.color;
      previewHTML = `
        <div style="text-align: center; padding: 30px;">
          <i class="pi ${icon}" style="font-size: 64px; color: ${color};"></i>
          <div style="margin-top: 15px; color: #fff; font-size: 14px;">${escapeHtml(fileName)}</div>
          <div style="margin-top: 8px; color: #888; font-size: 12px;">此文件类型不支持预览</div>
        </div>
      `;
    }

    content.innerHTML = previewHTML;

  } catch (error) {
    content.innerHTML = `
      <div class="dm-preview-error" style="text-align: center; padding: 40px;">
        <i class="pi pi-exclamation-triangle dm-error-icon" style="font-size: 48px;"></i>
        <div class="dm-error-title" style="margin-top: 15px; font-size: 14px;">加载失败</div>
        <div class="dm-error-detail" style="margin-top: 5px; font-size: 11px;">${escapeHtml((error as Error).message)}</div>
      </div>
    `;
  }
}
