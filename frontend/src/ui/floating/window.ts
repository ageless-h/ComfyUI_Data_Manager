/**
 * ComfyUI Data Manager - Floating Preview Window
 */

import { FILE_TYPES, LIMITS } from '../../core/constants.js';
import { getFileType } from '../../utils/file-type.js';
import { setupWindowDrag } from '../../utils/drag.js';
import { updateStatus, getExt } from '../../utils/helpers.js';
import { loadPreviewContent } from './preview-content.js';
import { updateDock } from './dock.js';
import { previewFloatingWindows } from '../../core/state.js';
import { applyComfyTheme, getComfyTheme, addThemeListener, type ComfyTheme } from '../../utils/theme.js';
import type { FloatingWindowData } from './dock.js';

// ==================== Local Constants ====================
const DEFAULT_IMAGE_SCALE = 1;
const DEFAULT_DOC_FONT_SIZE = 13;
const DEFAULT_CODE_FONT_SIZE = 12;

/**
 * Create floating preview window toolbar button
 */
function createToolbarButton(
  icon: string,
  title: string,
  onClick: () => void
): HTMLButtonElement {
  const theme = getComfyTheme();
  const button = document.createElement("button");
  button.className = "comfy-btn";
  button.innerHTML = `<i class="pi ${icon}"></i>`;
  button.style.cssText = `padding: 6px 10px; background: transparent; border: none; color: ${theme.textSecondary}; cursor: pointer; border-radius: 4px;`;
  button.title = title;
  button.onmouseover = () => button.style.background = theme.bgTertiary;
  button.onmouseout = () => button.style.background = "transparent";
  button.onclick = onClick;
  return button;
}

/**
 * Open floating preview window
 * @param path - File path
 * @param fileName - File name
 */
export function openFloatingPreview(path: string, fileName: string): void {
  // Check if preview window already opened for this file
  const existingWindow = (previewFloatingWindows as FloatingWindowData[]).find(w => w.path === path);
  if (existingWindow) {
    existingWindow.window.focus();
    return;
  }

  const theme = getComfyTheme();

  const ext = getExt(path);
  const fileType = getFileType({ name: path });
  const fileConfig = FILE_TYPES[fileType] || FILE_TYPES.unknown;
  const isImage = FILE_TYPES.image.exts.includes(ext);
  const isVideo = FILE_TYPES.video.exts.includes(ext);
  const isAudio = FILE_TYPES.audio.exts.includes(ext);
  const isPDF = ext === '.pdf';
  const isMarkdown = ext === '.md';
  const isDocument = isPDF || isMarkdown || FILE_TYPES.document.exts.includes(ext);
  const isCode = FILE_TYPES.code.exts.includes(ext);
  const isSpreadsheet = FILE_TYPES.spreadsheet.exts.includes(ext);

  // Create floating preview window
  const previewWindow = document.createElement("div");
  previewWindow.id = `dm-preview-${Date.now()}`;
  previewWindow.className = "dm-floating-preview";
  previewWindow.style.cssText = `
    position: fixed;
    top: 100px;
    right: 50px;
    width: 500px;
    height: 600px;
    background: ${theme.bgPrimary};
    border: 1px solid ${theme.borderColor};
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    z-index: ${LIMITS.FLOATING_Z_INDEX};
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `;

  // Create title bar
  const header = createPreviewHeader(fileName, fileConfig, isImage, isVideo, isAudio, isDocument, isCode, isSpreadsheet, previewWindow, path);
  previewWindow.appendChild(header);

  // Create content area
  const content = document.createElement("div");
  content.id = `dm-preview-content-${Date.now()}`;
  content.style.cssText = `
    flex: 1;
    overflow: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${theme.bgPrimary};
  `;
  previewWindow.appendChild(content);

  // Create toolbar (returns mediaId for image/video/audio files)
  const { toolbar, mediaId } = createPreviewToolbar(path, ext, isImage, isVideo, isAudio, isPDF, isMarkdown, isCode, isSpreadsheet, content, previewWindow);
  previewWindow.appendChild(toolbar);

  // Create file info area
  const fileInfo = document.createElement("div");
  fileInfo.id = `dm-fileinfo-${Date.now()}`;
  fileInfo.className = "dm-floating-file-info";
  fileInfo.style.cssText = `
    padding: 10px 15px;
    background: ${theme.bgSecondary};
    border-top: 1px solid ${theme.borderColor};
    font-size: 12px;
    color: ${theme.textSecondary};
    text-align: center;
  `;
  fileInfo.innerHTML = '<span style="opacity: 0.5;">正在加载...</span>';
  previewWindow.appendChild(fileInfo);

  document.body.appendChild(previewWindow);

  // Apply ComfyUI theme
  applyComfyTheme();

  // Setup drag
  setupWindowDrag(previewWindow, header);

  // Store window reference
  const windowData: FloatingWindowData = {
    path: path,
    fileName: fileName,
    fileConfig: fileConfig,
    window: previewWindow,
    minimized: false
  };
  (previewFloatingWindows as FloatingWindowData[]).push(windowData);

  // Load content (pass mediaId for image/video/audio files)
  loadPreviewContent(content, path, ext, DEFAULT_IMAGE_SCALE, mediaId);

  updateStatus(`已打开预览: ${fileName}`);
}

/**
 * Create preview window title bar
 */
function createPreviewHeader(
  fileName: string,
  fileConfig: { icon: string; color: string },
  isImage: boolean,
  isVideo: boolean,
  isAudio: boolean,
  isDocument: boolean,
  isCode: boolean,
  isSpreadsheet: boolean,
  previewWindow: HTMLElement,
  path: string
): HTMLElement {
  const theme = getComfyTheme();
  const textColor = theme.isLight ? '#222' : '#fff';

  const header = document.createElement("div");
  header.className = "dm-preview-header";
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 15px;
    background: linear-gradient(135deg, ${theme.bgSecondary} 0%, ${theme.bgPrimary} 100%);
    border-bottom: 1px solid ${theme.borderColor};
    cursor: move;
    user-select: none;
  `;

  // macOS traffic lights
  const trafficLights = document.createElement("div");
  trafficLights.className = "dm-traffic-lights";
  trafficLights.style.cssText = "display: flex; gap: 8px;";

  // Close button
  const closeBtn = createTrafficLightButton("pi-times", textColor, "关闭", () => closeFloatingPreview(previewWindow));
  trafficLights.appendChild(closeBtn);

  // Minimize button
  const minimizeBtn = createTrafficLightButton("pi-minus", textColor, "最小化", () => minimizeFloatingPreview(previewWindow, path, fileName, fileConfig));
  trafficLights.appendChild(minimizeBtn);

  // Fullscreen button - for image, video, audio, document, code, spreadsheet files
  // Note: Video has two fullscreen buttons: one here (window fullscreen) and one in toolbar (video element fullscreen)
  if (isImage || isVideo || isAudio || isDocument || isCode || isSpreadsheet) {
    const fullscreenBtn = createTrafficLightButton("pi-window-maximize", textColor, "全屏", () => toggleFullscreen(previewWindow));
    trafficLights.appendChild(fullscreenBtn);
  }

  header.appendChild(trafficLights);

  // Title area
  const title = document.createElement("div");
  title.className = "dm-header-title-area";
  title.style.cssText = "display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; flex: 1; justify-content: center;";
  title.innerHTML = `
    <i class="pi ${fileConfig.icon}" style="color: ${fileConfig.color};"></i>
    <span style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${fileName}</span>
  `;

  header.appendChild(title);

  // Register theme change listener
  addThemeListener((newTheme: ComfyTheme) => {
    const newTextColor = newTheme.isLight ? '#222' : '#fff';
    header.style.background = `linear-gradient(135deg, ${newTheme.bgSecondary} 0%, ${newTheme.bgPrimary} 100%)`;
    header.style.borderColor = newTheme.borderColor;
    title.style.color = newTextColor;

    // Update button colors
    const btns = header.querySelectorAll('.dm-traffic-btn');
    btns.forEach(btn => { (btn as HTMLElement).style.color = newTextColor; });
  });

  return header;
}

/**
 * Create traffic light button (macOS style)
 */
function createTrafficLightButton(
  icon: string,
  textColor: string,
  title: string,
  onClick: () => void
): HTMLElement {
  const button = document.createElement("button");
  button.className = "comfy-btn dm-traffic-btn";
  button.innerHTML = `<i class="pi ${icon}" style="font-size: 10px; color: ${textColor};"></i>`;
  button.style.cssText = `
    width: 14px;
    height: 14px;
    padding: 0px;
    background: transparent;
    border: none;
    cursor: pointer;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: 0.15s;
  `;
  button.title = title;

  button.onclick = (e) => {
    e.stopPropagation();
    onClick();
  };

  return button;
}

/**
 * Add document font size controls to toolbar
 */
function addDocumentFontSizeControls(
  toolbarLeft: HTMLElement,
  content: HTMLElement,
  ext: string,
  createToolbarButton: (icon: string, title: string, onClick: () => void) => HTMLElement,
  createToolbarSeparator: () => HTMLElement
): void {
  const theme = getComfyTheme();
  let fontSize = DEFAULT_DOC_FONT_SIZE;

  toolbarLeft.appendChild(createToolbarSeparator());

  const fontDownBtn = createToolbarButton("pi-minus", "减小字号", () => {
    fontSize = Math.max(8, fontSize - 1);
    updateFontSize();
  });
  toolbarLeft.appendChild(fontDownBtn);

  const fontDisplay = document.createElement("span");
  fontDisplay.style.cssText = `min-width: 30px; text-align: center; color: ${theme.textSecondary};`;
  fontDisplay.textContent = fontSize.toString();
  toolbarLeft.appendChild(fontDisplay);

  const fontUpBtn = createToolbarButton("pi-plus", "增大字号", () => {
    fontSize = Math.min(32, fontSize + 1);
    updateFontSize();
  });
  toolbarLeft.appendChild(fontUpBtn);

  const resetBtn = createToolbarButton("pi-undo", "重置字号", () => {
    fontSize = DEFAULT_DOC_FONT_SIZE;
    updateFontSize();
  });
  toolbarLeft.appendChild(resetBtn);

  function updateFontSize(): void {
    fontDisplay.textContent = fontSize.toString();
    const textElement = content.querySelector('.dm-document-content, .dm-docx-content');
    if (textElement) {
      (textElement as HTMLElement).style.fontSize = `${fontSize}px`;
    }
  }
}

/**
 * Add code font size controls to toolbar
 */
function addCodeFontSizeControls(
  toolbarLeft: HTMLElement,
  content: HTMLElement,
  ext: string,
  createToolbarButton: (icon: string, title: string, onClick: () => void) => HTMLElement,
  createToolbarSeparator: () => HTMLElement
): void {
  const theme = getComfyTheme();
  let fontSize = DEFAULT_CODE_FONT_SIZE;

  toolbarLeft.appendChild(createToolbarSeparator());

  const fontDownBtn = createToolbarButton("pi-minus", "减小字号", () => {
    fontSize = Math.max(8, fontSize - 1);
    updateFontSize();
  });
  toolbarLeft.appendChild(fontDownBtn);

  const fontDisplay = document.createElement("span");
  fontDisplay.style.cssText = `min-width: 30px; text-align: center; color: ${theme.textSecondary};`;
  fontDisplay.textContent = fontSize.toString();
  toolbarLeft.appendChild(fontDisplay);

  const fontUpBtn = createToolbarButton("pi-plus", "增大字号", () => {
    fontSize = Math.min(32, fontSize + 1);
    updateFontSize();
  });
  toolbarLeft.appendChild(fontUpBtn);

  const resetBtn = createToolbarButton("pi-undo", "重置字号", () => {
    fontSize = DEFAULT_CODE_FONT_SIZE;
    updateFontSize();
  });
  toolbarLeft.appendChild(resetBtn);

  function updateFontSize(): void {
    fontDisplay.textContent = fontSize.toString();
    const codeElement = content.querySelector('.dm-code-content');
    if (codeElement) {
      (codeElement as HTMLElement).style.fontSize = `${fontSize}px`;
    }
  }
}

/**
 * Add media controls to toolbar (video/audio)
 */
function addMediaControls(
  toolbarRight: HTMLElement,
  content: HTMLElement,
  path: string,
  isVideo: boolean,
  createToolbarButton: (icon: string, title: string, onClick: () => void) => HTMLElement,
  createToolbarSeparator: () => HTMLElement,
  previewWindow: HTMLElement,
  mediaId: string
): void {
  const theme = getComfyTheme();
  const mediaElement = content.querySelector(`#${mediaId}`) as HTMLVideoElement | HTMLAudioElement;
  if (!mediaElement) {
    // Retry after a short delay if media element not found yet
    setTimeout(() => addMediaControls(toolbarRight, content, path, isVideo, createToolbarButton, createToolbarSeparator, previewWindow, mediaId), 50);
    return;
  }

  // Time display
  const timeDisplay = document.createElement("span");
  timeDisplay.className = "dm-media-time";
  timeDisplay.style.cssText = `min-width: 80px; text-align: center; color: ${theme.textSecondary}; font-size: 11px; font-family: monospace;`;
  timeDisplay.textContent = "0:00 / 0:00";
  timeDisplay.id = `${mediaId}-time`;
  toolbarRight.appendChild(timeDisplay);

  toolbarRight.appendChild(createToolbarSeparator());

  // Volume button
  const volumeBtn = createToolbarButton("pi-volume-up", "音量", () => {
    if (mediaElement.muted) {
      mediaElement.muted = false;
      volumeBtn.innerHTML = '<i class="pi pi-volume-up"></i>';
      volumeBtn.title = "音量";
    } else {
      mediaElement.muted = true;
      volumeBtn.innerHTML = '<i class="pi pi-volume-off"></i>';
      volumeBtn.title = "静音";
    }
  });
  toolbarRight.appendChild(volumeBtn);

  mediaElement.addEventListener('volumechange', () => {
    if (mediaElement.muted || mediaElement.volume === 0) {
      volumeBtn.innerHTML = '<i class="pi pi-volume-off"></i>';
    } else if (mediaElement.volume < 0.5) {
      volumeBtn.innerHTML = '<i class="pi pi-volume-down"></i>';
    } else {
      volumeBtn.innerHTML = '<i class="pi pi-volume-up"></i>';
    }
  });

  toolbarRight.appendChild(createToolbarSeparator());

  // Play/Pause button
  const playPauseBtn = createToolbarButton("pi-play", "播放", () => {
    if (mediaElement.paused) {
      mediaElement.play().then(() => {
        playPauseBtn.innerHTML = '<i class="pi pi-pause"></i>';
        playPauseBtn.title = "暂停";
      }).catch((err: Error) => console.error('[DataManager] 播放失败:', err));
    } else {
      mediaElement.pause();
      playPauseBtn.innerHTML = '<i class="pi pi-play"></i>';
      playPauseBtn.title = "播放";
    }
  });
  toolbarRight.appendChild(playPauseBtn);

  mediaElement.addEventListener('play', () => {
    playPauseBtn.innerHTML = '<i class="pi pi-pause"></i>';
    playPauseBtn.title = "暂停";
  });

  mediaElement.addEventListener('pause', () => {
    playPauseBtn.innerHTML = '<i class="pi pi-play"></i>';
    playPauseBtn.title = "播放";
  });

  // Format time helper
  function formatTime(seconds: number): string {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // Update time display
  mediaElement.addEventListener('loadedmetadata', () => {
    timeDisplay.textContent = `0:00 / ${formatTime(mediaElement.duration)}`;
  });

  mediaElement.addEventListener('timeupdate', () => {
    timeDisplay.textContent = `${formatTime(mediaElement.currentTime)} / ${formatTime(mediaElement.duration || 0)}`;
  });

  // Video fullscreen button (use window fullscreen, not video element fullscreen)
  if (isVideo) {
    toolbarRight.appendChild(createToolbarSeparator());
    const videoFullscreenBtn = createToolbarButton("pi-arrows-alt", "全屏", () => {
      toggleFullscreen(previewWindow);
    });
    toolbarRight.appendChild(videoFullscreenBtn);
  }

  // Open button (for media files)
  toolbarRight.appendChild(createToolbarSeparator());
  const openBtn = createToolbarButton("pi-external-link", "打开", () => {
    window.open(`/dm/preview?path=${encodeURIComponent(path)}`, '_blank');
  });
  toolbarRight.appendChild(openBtn);
}

/**
 * Create preview toolbar
 * Returns { toolbar, mediaId } - mediaId is set for image/video/audio files to be used by loadPreviewContent
 */
function createPreviewToolbar(
  path: string,
  ext: string,
  isImage: boolean,
  isVideo: boolean,
  isAudio: boolean,
  isPDF: boolean,
  isMarkdown: boolean,
  isCode: boolean,
  isSpreadsheet: boolean,
  content: HTMLElement,
  previewWindow: HTMLElement
): { toolbar: HTMLElement; mediaId?: string } {
  const theme = getComfyTheme();
  const toolbar = document.createElement("div");
  toolbar.className = "dm-preview-toolbar";
  toolbar.style.cssText = `
    padding: 12px 16px;
    background: linear-gradient(to bottom, ${theme.bgTertiary}, ${theme.bgSecondary});
    border-top: 1px solid ${theme.borderColor};
    display: flex;
    align-items: center;
    font-size: 12px;
    color: ${theme.textSecondary};
  `;

  // Three-section structure
  const toolbarLeft = document.createElement("div");
  toolbarLeft.style.cssText = "display: flex; gap: 8px; align-items: center; flex-shrink: 0;";

  const toolbarCenter = document.createElement("div");
  toolbarCenter.style.cssText = "flex: 1; text-align: center; overflow: hidden; padding: 0 20px;";

  const toolbarRight = document.createElement("div");
  toolbarRight.style.cssText = "display: flex; gap: 8px; align-items: center; flex-shrink: 0;";

  // Helper: Create toolbar separator
  function createToolbarSeparator(): HTMLElement {
    const separator = document.createElement("div");
    separator.style.cssText = `width: 1px; height: 16px; background: ${theme.borderColor}; margin: 0 4px;`;
    return separator;
  }

  // ===== Left Section: Control Buttons =====

  // Image zoom controls (left side)
  if (isImage) {
    toolbarLeft.appendChild(createToolbarSeparator());
    // Note: Image has built-in controls in content, so minimal toolbar needed
  }

  // Document font size controls (txt/rtf/md/docx)
  if (ext === '.txt' || ext === '.rtf' || ext === '.md' || ext === '.docx') {
    addDocumentFontSizeControls(toolbarLeft, content, ext, createToolbarButton, createToolbarSeparator);
  }

  // Code font size controls
  if (isCode) {
    addCodeFontSizeControls(toolbarLeft, content, ext, createToolbarButton, createToolbarSeparator);
  }

  // ===== Center Section: File Path =====
  const filePath = document.createElement("div");
  filePath.className = "dm-file-path";
  filePath.style.cssText = `overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: ${theme.textSecondary};`;
  filePath.textContent = path;
  filePath.title = path;
  toolbarCenter.appendChild(filePath);

  // ===== Right Section: Media Controls & Actions =====
  toolbarRight.appendChild(createToolbarSeparator());

  let mediaId: string | undefined;

  // Image zoom controls
  if (isImage) {
    // Generate mediaId here (before loadPreviewContent is called)
    mediaId = `dm-floating-image-${Date.now()}`;
    setupImageToolbarControls(toolbarRight, mediaId, content, path, createToolbarButton, createToolbarSeparator);
  }
  // Video/Audio playback controls
  else if (isVideo || isAudio) {
    // Generate mediaId here (before loadPreviewContent is called)
    mediaId = isVideo ? `dm-preview-video-${Date.now()}` : `dm-preview-audio-${Date.now()}`;
    addMediaControls(toolbarRight, content, path, isVideo, createToolbarButton, createToolbarSeparator, previewWindow, mediaId);
  } else {
    // Open button for non-media files
    const openBtn = createToolbarButton("pi-external-link", "打开", () => {
      window.open(`/dm/preview?path=${encodeURIComponent(path)}`, '_blank');
    });
    toolbarRight.appendChild(openBtn);
  }

  // PDF fullscreen button
  if (isPDF) {
    toolbarRight.appendChild(createToolbarSeparator());
    const pdfFullscreenBtn = createToolbarButton("pi-arrows-alt", "PDF 全屏", () => {
      const embed = document.getElementById('dm-floating-pdf-embed');
      if (embed && (embed as any).requestFullscreen) {
        (embed as any).requestFullscreen().catch((err: Error) => console.error('[DataManager] PDF 全屏失败:', err));
      } else if (embed && (embed as any).webkitRequestFullscreen) {
        (embed as any).webkitRequestFullscreen();
      }
    });
    toolbarRight.appendChild(pdfFullscreenBtn);
  }

  // Markdown/Txt/RTF fullscreen button
  if (ext === '.md' || ext === '.txt' || ext === '.rtf') {
    toolbarRight.appendChild(createToolbarSeparator());
    const docFullscreenBtn = createToolbarButton("pi-arrows-alt", "全屏预览", () => toggleFullscreen(previewWindow));
    toolbarRight.appendChild(docFullscreenBtn);
  }

  // Code fullscreen button
  if (isCode) {
    toolbarRight.appendChild(createToolbarSeparator());
    const codeFullscreenBtn = createToolbarButton("pi-arrows-alt", "全屏预览", () => toggleFullscreen(previewWindow));
    toolbarRight.appendChild(codeFullscreenBtn);
  }

  // Spreadsheet fullscreen button
  if (isSpreadsheet) {
    toolbarRight.appendChild(createToolbarSeparator());
    const spreadsheetFullscreenBtn = createToolbarButton("pi-arrows-alt", "全屏预览", () => toggleFullscreen(previewWindow));
    toolbarRight.appendChild(spreadsheetFullscreenBtn);
  }

  // Assemble toolbar
  toolbar.appendChild(toolbarLeft);
  toolbar.appendChild(toolbarCenter);
  toolbar.appendChild(toolbarRight);

  return { toolbar, mediaId };
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
 * Setup video controls in toolbar
 */
export function setupVideoToolbarControls(toolbar: HTMLElement, videoId: string, content: HTMLElement, videoPath: string): void {
  const theme = getComfyTheme();
  // Find video element within content
  const video = content.querySelector(`#${videoId}`) as HTMLVideoElement;
  if (!video) {
    // Retry after a short delay if video not found yet
    setTimeout(() => setupVideoToolbarControls(toolbar, videoId, content, videoPath), 50);
    return;
  }

  // Clear toolbar and add video controls
  toolbar.innerHTML = '';

  // Play/Pause button
  const playBtn = createToolbarButton("pi-play", "播放", () => {
    if (video.paused) {
      video.play().then(() => {
        playBtn.innerHTML = '<i class="pi pi-pause"></i>';
        playBtn.title = "暂停";
      });
    } else {
      video.pause();
      playBtn.innerHTML = '<i class="pi pi-play"></i>';
      playBtn.title = "播放";
    }
  });
  toolbar.appendChild(playBtn);

  // Time display
  const timeDisplay = document.createElement("span");
  timeDisplay.id = `${videoId}-time`;
  timeDisplay.className = "dm-video-time-display";
  timeDisplay.style.cssText = `min-width: 80px; text-align: center; font-size: 12px; color: ${theme.textSecondary};`;
  timeDisplay.textContent = "0:00 / 0:00";
  toolbar.appendChild(timeDisplay);

  // Volume button
  const volumeBtn = createToolbarButton("pi-volume-up", "音量", () => {
    video.muted = !video.muted;
    volumeBtn.innerHTML = video.muted
      ? '<i class="pi pi-volume-off"></i>'
      : '<i class="pi pi-volume-up"></i>';
    volumeBtn.title = video.muted ? "取消静音" : "静音";
  });
  toolbar.appendChild(volumeBtn);

  // Fullscreen button
  const fullscreenBtn = createToolbarButton("pi-arrows-alt", "视频全屏", () => {
    if (video.requestFullscreen) {
      video.requestFullscreen();
    }
  });
  toolbar.appendChild(fullscreenBtn);

  // Setup event listeners
  video.addEventListener('play', () => {
    playBtn.innerHTML = '<i class="pi pi-pause"></i>';
    playBtn.title = "暂停";
  });

  video.addEventListener('pause', () => {
    playBtn.innerHTML = '<i class="pi pi-play"></i>';
    playBtn.title = "播放";
  });

  video.addEventListener('timeupdate', () => {
    const current = formatTime(video.currentTime);
    const duration = formatTime(video.duration);
    timeDisplay.textContent = `${current} / ${duration}`;
  });

  // Open button (separated by spacer)
  const spacer = document.createElement("div");
  spacer.style.cssText = `width: 1px; height: 20px; background: ${theme.borderColor}; margin: 0 5px;`;
  toolbar.appendChild(spacer);

  const openBtn = createToolbarButton("pi-external-link", "打开", () => {
    window.open(`/dm/preview?path=${encodeURIComponent(videoPath)}`, '_blank');
  });
  toolbar.appendChild(openBtn);
}

/**
 * Setup image zoom controls in toolbar
 */
export function setupImageToolbarControls(
  toolbarRight: HTMLElement,
  imageId: string,
  content: HTMLElement,
  imagePath: string,
  createToolbarButton: (icon: string, title: string, onClick: () => void) => HTMLButtonElement,
  createToolbarSeparator: () => HTMLElement
): void {
  const theme = getComfyTheme();
  // Find image element within content
  const image = content.querySelector(`#${imageId}`) as HTMLImageElement;
  if (!image) {
    // Retry after a short delay if image not found yet
    setTimeout(() => setupImageToolbarControls(toolbarRight, imageId, content, imagePath, createToolbarButton, createToolbarSeparator), 50);
    return;
  }

  let zoom = 100;
  let imageTranslateX = 0;
  let imageTranslateY = 0;

  // Create zoom level display
  const zoomDisplay = document.createElement("span");
  zoomDisplay.id = `${imageId}-zoom`;
  zoomDisplay.className = "dm-zoom-level";
  zoomDisplay.style.cssText = `min-width: 45px; text-align: center; font-size: 13px; color: ${theme.textSecondary};`;
  zoomDisplay.textContent = "100%";
  toolbarRight.appendChild(zoomDisplay);

  function updateZoom(): void {
    const scale = zoom / 100;
    image.style.transform = `translate(${imageTranslateX}px, ${imageTranslateY}px) scale(${scale})`;
    zoomDisplay.textContent = `${zoom}%`;

    // Remove max-width/max-height constraints when zoomed in
    if (zoom > 100) {
      image.style.maxWidth = 'none';
      image.style.maxHeight = 'none';
    } else {
      image.style.maxWidth = '100%';
      image.style.maxHeight = '100%';
    }
  }

  // Zoom out button
  const zoomOutBtn = createToolbarButton("pi-search-minus", "缩小", () => {
    zoom = Math.max(zoom - LIMITS.DEFAULT_ZOOM_STEP, LIMITS.MIN_ZOOM_DISPLAY);
    updateZoom();
  });
  toolbarRight.appendChild(zoomOutBtn);

  // Zoom in button
  const zoomInBtn = createToolbarButton("pi-search-plus", "放大", () => {
    zoom = Math.min(zoom + LIMITS.DEFAULT_ZOOM_STEP, LIMITS.MAX_ZOOM_DISPLAY);
    updateZoom();
  });
  toolbarRight.appendChild(zoomInBtn);

  // Reset button
  const resetBtn = createToolbarButton("pi-undo", "重置", () => {
    zoom = 100;
    imageTranslateX = 0;
    imageTranslateY = 0;
    updateZoom();
  });
  toolbarRight.appendChild(resetBtn);

  // Separator
  toolbarRight.appendChild(createToolbarSeparator());

  // Open button
  const openBtn = createToolbarButton("pi-external-link", "打开", () => {
    window.open(`/dm/preview?path=${encodeURIComponent(imagePath)}`, '_blank');
  });
  toolbarRight.appendChild(openBtn);

  // Mouse wheel zoom
  const container = image.parentElement;
  if (container) {
    container.addEventListener("wheel", (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -LIMITS.DEFAULT_ZOOM_STEP : LIMITS.DEFAULT_ZOOM_STEP;
      zoom = Math.max(LIMITS.MIN_ZOOM_DISPLAY, Math.min(LIMITS.MAX_ZOOM_DISPLAY, zoom + delta));
      updateZoom();
    }, { passive: false });
  }

  // Image drag (pan)
  let isDraggingImage = false;
  let dragStart = { x: 0, y: 0 };

  image.addEventListener("mousedown", (e) => {
    if (zoom <= 100) return;
    isDraggingImage = true;
    dragStart = { x: e.clientX - imageTranslateX, y: e.clientY - imageTranslateY };
    image.style.cursor = "grabbing";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDraggingImage) return;
    imageTranslateX = e.clientX - dragStart.x;
    imageTranslateY = e.clientY - dragStart.y;
    updateZoom();
  });

  document.addEventListener("mouseup", () => {
    if (isDraggingImage) {
      isDraggingImage = false;
      image.style.cursor = "grab";
    }
  });
}

/**
 * Close floating preview window
 */
function closeFloatingPreview(window: HTMLElement): void {
  // Remove from floating windows array
  const idx = (previewFloatingWindows as FloatingWindowData[]).findIndex(w => w.window === window);
  if (idx > -1) {
    (previewFloatingWindows as FloatingWindowData[]).splice(idx, 1);
  }

  // Remove window element
  window.remove();

  // Update dock
  updateDock();
}

/**
 * Minimize floating preview window
 */
function minimizeFloatingPreview(
  window: HTMLElement,
  path: string,
  fileName: string,
  fileConfig: { icon: string; color: string }
): void {
  const windowData = (previewFloatingWindows as FloatingWindowData[]).find(w => w.window === window);
  if (windowData) {
    windowData.minimized = true;
  }
  window.style.display = "none";

  // Update dock
  updateDock();
}

/**
 * Toggle fullscreen for floating window
 */
function toggleFullscreen(window: HTMLElement): void {
  if (window.dataset.fullscreen === "true") {
    window.dataset.fullscreen = "false";
    window.style.top = "100px";
    window.style.right = "50px";
    window.style.width = "500px";
    window.style.height = "600px";
  } else {
    window.dataset.fullscreen = "true";
    window.style.top = "0";
    window.style.right = "0";
    window.style.width = "100vw";
    window.style.height = "100vh";
    window.style.borderRadius = "0";
  }
}
