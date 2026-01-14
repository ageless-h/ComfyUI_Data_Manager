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

/**
 * Create floating preview window toolbar button
 */
function createToolbarButton(
  icon: string,
  title: string,
  onClick: () => void
): HTMLButtonElement {
  const button = document.createElement("button");
  button.className = "comfy-btn";
  button.innerHTML = `<i class="pi ${icon}"></i>`;
  button.style.cssText = "padding: 6px 10px; background: transparent; border: none; color: #888; cursor: pointer; border-radius: 4px;";
  button.title = title;
  button.onmouseover = () => button.style.background = "#3a3a3a";
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
    background: #1a1a1a;
    border: 1px solid #3a3a3a;
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
  `;
  previewWindow.appendChild(content);

  // Create toolbar
  const toolbar = createPreviewToolbar(path, ext, isImage, isVideo, isAudio, isPDF, isMarkdown, isCode, isSpreadsheet, content, previewWindow);
  previewWindow.appendChild(toolbar);

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

  // Load content
  loadPreviewContent(content, path, ext, DEFAULT_IMAGE_SCALE);

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
 * Create preview toolbar
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
): HTMLElement {
  const toolbar = document.createElement("div");
  toolbar.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 10px;
    border-top: 1px solid #2a2a2a;
    background: #1f1f1f;
  `;

  // Open button
  const openBtn = createToolbarButton("pi-external-link", "打开", () => {
    window.open(`/dm/preview?path=${encodeURIComponent(path)}`, '_blank');
  });
  toolbar.appendChild(openBtn);

  // Image-specific controls
  if (isImage) {
    const zoomInBtn = createToolbarButton("pi-search-plus", "放大", () => {
      // Zoom in logic
    });
    const zoomOutBtn = createToolbarButton("pi-search-minus", "缩小", () => {
      // Zoom out logic
    });
    const fitBtn = createToolbarButton("pi-arrows-alt", "适应", () => {
      // Fit to window logic
    });

    toolbar.appendChild(zoomInBtn);
    toolbar.appendChild(zoomOutBtn);
    toolbar.appendChild(fitBtn);
  }

  // Refresh button
  const refreshBtn = createToolbarButton("pi-refresh", "刷新", () => {
    loadPreviewContent(content, path, ext);
  });
  toolbar.appendChild(refreshBtn);

  return toolbar;
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
