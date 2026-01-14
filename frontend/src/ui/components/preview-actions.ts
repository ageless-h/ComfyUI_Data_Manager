/**
 * ComfyUI Data Manager - Preview Actions Component
 */

import { FILE_TYPES, LIMITS } from '../../core/constants.js';
import { getTypeByExt } from '../../utils/file-type.js';
import { getPreviewUrl, getFileInfo } from '../../api/endpoints/file.js';
import { escapeHtml, formatSize } from '../../utils/format.js';
import { updateStatus, getFileName, getExt } from '../../utils/helpers.js';
import type { FileItem } from '../../core/state.js';

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
  highlightGeneric
} from '../../utils/syntax-highlight.js';

// Re-export table functions
export {
  createTableHTML,
  setupTableControls,
  createEmptyTableHTML,
  createUnsupportedTableHTML,
  createTableErrorHTML,
  parseSpreadsheet
} from '../../utils/table.js';

/**
 * Preview file
 * @param path - File path
 */
export async function previewFile(path: string): Promise<void> {
  const { FileManagerState } = await import('../../core/state.js');
  const state = await import('../../core/state.js');
  const fmState = state.FileManagerState;

  // Save current preview file
  fmState.currentPreviewFile = path;

  const content = document.getElementById("dm-preview-content");
  const floatingBtn = document.getElementById("dm-open-floating-preview-btn");

  if (!content) return;

  content.innerHTML = `
    <div class="dm-panel-loading" style="text-align: center; padding: 20px;">
      <i class="pi pi-spin pi-spinner"></i>
    </div>
  `;

  const ext = getExt(path);
  const fileName = path.split(/[/\\]/).pop() || "";
  const fileType = getTypeByExt(ext);

  try {
    let previewHTML = "";
    let canOpenExternally = false;

    // Image preview
    if (FILE_TYPES.image.exts.includes(ext)) {
      const imageUrl = getPreviewUrl(path);
      previewHTML = `
        <div style="text-align: center;">
          <img src="${imageUrl}"
               class="dm-panel-preview-image"
               style="max-width: 100%; max-height: 300px;
                      border-radius: 8px; border: 1px solid;"
               onerror="this.parentElement.innerHTML='<div class=\\'dm-error-message\\'>无法加载图像</div>'">
        </div>
      `;
      canOpenExternally = true;
    }
    // Audio preview
    else if (FILE_TYPES.audio.exts.includes(ext)) {
      const audioUrl = getPreviewUrl(path);
      previewHTML = `
        <div class="dm-panel-audio-preview" style="text-align: center; padding: 20px;">
          <i class="pi pi-volume-up dm-audio-icon" style="font-size: 64px;"></i>
          <div class="dm-preview-filename" style="margin-top: 15px;">${escapeHtml(fileName)}</div>
          <audio controls style="width: 100%; margin-top: 15px;">
            <source src="${audioUrl}" type="audio/mpeg">
          </audio>
        </div>
      `;
      canOpenExternally = true;
    }
    // Video preview
    else if (FILE_TYPES.video.exts.includes(ext)) {
      const videoUrl = getPreviewUrl(path);
      const videoId = `dm-panel-video-${Date.now()}`;
      previewHTML = createVideoPreviewHTML(videoId, videoUrl);
      canOpenExternally = true;
    }
    // Code preview
    else if (FILE_TYPES.code.exts.includes(ext)) {
      const response = await fetch(getPreviewUrl(path));
      if (response.ok) {
        const text = await response.text();
        const { highlightCode } = await import('../../utils/syntax-highlight.js');
        previewHTML = createCodePreviewHTML(text, ext, highlightCode);
        canOpenExternally = true;
      } else {
        throw new Error('Failed to load file');
      }
    }
    // Document preview
    else if (FILE_TYPES.document.exts.includes(ext)) {
      const docUrl = getPreviewUrl(path);
      previewHTML = await createDocumentPreviewHTML(path, ext, docUrl);
      canOpenExternally = true;
    }
    // Spreadsheet preview
    else if (FILE_TYPES.spreadsheet.exts.includes(ext)) {
      previewHTML = await createSpreadsheetPreviewHTML(path, ext);
      canOpenExternally = true;
    }
    // Other files
    else {
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

    // Bind video controls
    if (FILE_TYPES.video.exts.includes(ext)) {
      setupVideoControls(content);
    }

    // Update button
    if (floatingBtn) {
      (floatingBtn as HTMLElement).style.display = "block";
      (floatingBtn as HTMLButtonElement).onclick = async () => {
        const { openFloatingPreview } = await import('../floating/window.js');
        openFloatingPreview(path, fileName);
      };
    }

    updateStatus(`预览: ${fileName}`);

    // Update file info area
    updateFileInfo(path);

  } catch (error) {
    content.innerHTML = `
      <div style="text-align: center; padding: 20px; color: #e74c3c;">
        <i class="pi pi-exclamation-triangle" style="font-size: 32px;"></i>
        <div style="margin-top: 10px;">加载预览失败</div>
      </div>
    `;
  }
}

/**
 * Create video preview HTML
 */
function createVideoPreviewHTML(videoId: string, videoUrl: string): string {
  return `
    <div style="display: flex; flex-direction: column; gap: 0;">
      <div class="dm-panel-video-container" style="position: relative; border-radius: 8px; overflow: hidden;">
        <video id="${videoId}" preload="metadata" style="width: 100%; max-height: 300px; display: block; object-fit: contain;">
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
  `;
}

/**
 * Setup video controls
 */
function setupVideoControls(content: HTMLElement): void {
  const video = content.querySelector('video') as HTMLVideoElement;
  const playBtn = content.querySelector('.dm-video-play-btn') as HTMLButtonElement;
  const volumeBtn = content.querySelector('.dm-video-volume-btn') as HTMLButtonElement;
  const fullscreenBtn = content.querySelector('.dm-video-fullscreen-btn') as HTMLButtonElement;
  const timeDisplay = content.querySelector(`[id$="-time"]`) as HTMLElement;

  if (!video || !playBtn) return;

  playBtn.addEventListener('click', () => {
    if (video.paused) {
      video.play().then(() => {
        playBtn.innerHTML = '<i class="pi pi-pause"></i> 暂停';
      });
    } else {
      video.pause();
      playBtn.innerHTML = '<i class="pi pi-play"></i> 播放';
    }
  });

  video.addEventListener('play', () => {
    playBtn.innerHTML = '<i class="pi pi-pause"></i> 暂停';
  });

  video.addEventListener('pause', () => {
    playBtn.innerHTML = '<i class="pi pi-play"></i> 播放';
  });

  video.addEventListener('timeupdate', () => {
    const current = formatTime(video.currentTime);
    const duration = formatTime(video.duration);
    timeDisplay.textContent = `${current} / ${duration}`;
  });

  if (volumeBtn) {
    volumeBtn.addEventListener('click', () => {
      video.muted = !video.muted;
      volumeBtn.innerHTML = video.muted
        ? '<i class="pi pi-volume-off"></i>'
        : '<i class="pi pi-volume-up"></i>';
    });
  }

  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      if (video.requestFullscreen) {
        video.requestFullscreen();
      }
    });
  }
}

/**
 * Format time in MM:SS format
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Create code preview HTML
 */
function createCodePreviewHTML(text: string, ext: string, highlightCode: (code: string, ext: string) => string): string {
  const highlighted = highlightCode(text, ext);
  return `
    <div class="dm-code-preview" style="width: 100%; padding: 15px;
                font-family: 'Consolas', 'Monaco', monospace; font-size: 12px; line-height: 1.5;
                overflow-x: auto; max-height: 400px; overflow-y: auto; border-radius: 0;">
      <pre class="dm-code-content" style="margin: 0; white-space: pre-wrap;">${highlighted}</pre>
    </div>
  `;
}

/**
 * Create document preview HTML
 */
async function createDocumentPreviewHTML(path: string, ext: string, docUrl: string): Promise<string> {
  const fileName = getFileName(path);

  if (ext === '.md') {
    const response = await fetch(docUrl);
    const text = await response.text();
    return `
      <div class="dm-markdown-preview" style="padding: 15px; font-size: 13px; line-height: 1.6; overflow-y: auto; max-height: 400px;">
        <pre style="white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(text)}</pre>
      </div>
    `;
  }

  if (ext === '.pdf') {
    return `
      <div style="width: 100%; height: 400px; overflow: hidden;">
        <embed src="${docUrl}" type="application/pdf" style="width: 100%; height: 100%; border: none;" />
      </div>
    `;
  }

  return `
    <div style="text-align: center; padding: 40px;">
      <i class="pi pi-file" style="font-size: 64px; color: #888;"></i>
      <div style="margin-top: 15px; font-size: 14px;">${escapeHtml(fileName)}</div>
      <div style="margin-top: 8px; font-size: 12px; color: #888;">文档预览</div>
    </div>
  `;
}

/**
 * Create spreadsheet preview HTML
 */
async function createSpreadsheetPreviewHTML(path: string, ext: string): Promise<string> {
  const { parseSpreadsheet } = await import('../../utils/table.js');
  try {
    const rows = await parseSpreadsheet(path, ext);
    const { createTableHTML } = await import('../../utils/table.js');
    return createTableHTML(rows, { type: 'panel' });
  } catch (error) {
    return `
      <div style="text-align: center; padding: 40px; color: #e74c3c;">
        <i class="pi pi-exclamation-triangle" style="font-size: 48px;"></i>
        <div style="margin-top: 15px;">表格解析失败</div>
        <div style="margin-top: 5px; font-size: 11px;">${escapeHtml((error as Error).message)}</div>
      </div>
    `;
  }
}

/**
 * Update file info area
 */
async function updateFileInfo(path: string): Promise<void> {
  const infoSection = document.getElementById("dm-file-info");
  if (!infoSection) return;

  try {
    const info = await getFileInfo(path);
    infoSection.innerHTML = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <span>文件名:</span>
        <span>${escapeHtml(info.name)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <span>大小:</span>
        <span>${formatSize(info.size)}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span>修改时间:</span>
        <span>${info.modified ? new Date(info.modified).toLocaleString('zh-CN') : '-'}</span>
      </div>
    `;
  } catch (error) {
    infoSection.innerHTML = `<div style="text-align: center;">无法获取文件信息</div>`;
  }
}
