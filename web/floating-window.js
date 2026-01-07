/**
 * floating-window.js - 浮动预览窗口
 */

import { FILE_TYPES } from './core-constants.js';
import { getFileType } from './utils-file-type.js';
import { setupWindowDrag } from './utils-drag.js';
import { updateStatus, getExt } from './utils-helpers.js';
import { loadPreviewContent } from './preview-content.js';
import { openFileExternally } from './floating-actions.js';
import { updateDock } from './floating-dock.js';
import { previewFloatingWindows } from './core-state.js';

/**
 * 创建浮动预览窗口工具栏按钮
 */
function createToolbarButton(icon, title, onClick) {
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
 * 更新图像缩放
 */
export function updateImageScale(container, scale, translateX, translateY) {
    const img = container.querySelector("img");
    if (img) {
        img.style.transform = `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)`;
        img.style.transition = "transform 0.1s ease-out";
    }
}

/**
 * 打开浮动预览窗口
 * @param {string} path - 文件路径
 * @param {string} fileName - 文件名
 */
export function openFloatingPreview(path, fileName) {
    // 检查是否已经打开了该文件的预览窗口
    const existingWindow = previewFloatingWindows.find(w => w.path === path);
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
    // 修复：包含所有文档类型
    const isDocument = isPDF || isMarkdown || FILE_TYPES.document.exts.includes(ext);
    // 代码文件类型
    const isCode = FILE_TYPES.code.exts.includes(ext);

    // 创建浮动预览窗口
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
        z-index: 10001;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    `;

    // 创建标题栏
    const header = createPreviewHeader(fileName, fileConfig, isImage, isVideo, isAudio, isDocument, isCode, previewWindow, path);
    previewWindow.appendChild(header);

    // 创建内容区域
    const content = createPreviewContent(path, ext, isImage);
    previewWindow.appendChild(content);

    // 创建工具栏
    const toolbar = createPreviewToolbar(path, ext, isImage, isVideo, isAudio, isPDF, isMarkdown, isCode, content, previewWindow);
    previewWindow.appendChild(toolbar);

    document.body.appendChild(previewWindow);

    // 设置拖动
    setupWindowDrag(previewWindow, header);

    // 存储窗口引用
    const windowData = {
        path: path,
        fileName: fileName,
        fileConfig: fileConfig,
        window: previewWindow,
        minimized: false
    };
    previewFloatingWindows.push(windowData);

    updateStatus(`已打开预览: ${fileName}`);
}

/**
 * 创建预览窗口标题栏
 */
function createPreviewHeader(fileName, fileConfig, isImage, isVideo, isAudio, isDocument, isCode, previewWindow, path) {
    const header = document.createElement("div");
    header.className = "dm-preview-header";
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 15px;
        background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
        border-bottom: 1px solid #3a3a3a;
        cursor: move;
        user-select: none;
    `;

    // macOS 交通灯按钮组
    const trafficLights = document.createElement("div");
    trafficLights.className = "dm-traffic-lights";
    trafficLights.style.cssText = "display: flex; gap: 8px;";

    // 关闭按钮（红色）
    const closeBtn = createTrafficLightButton("pi-times", "#ff5f57", "关闭", () => closeFloatingPreview(previewWindow));
    trafficLights.appendChild(closeBtn);

    // 最小化按钮（黄色）
    const minimizeBtn = createTrafficLightButton("pi-minus", "#ffbd2e", "最小化", () => minimizeFloatingPreview(previewWindow, path, fileName, fileConfig));
    trafficLights.appendChild(minimizeBtn);

    // 全屏按钮（绿色）- 图像、视频、音频、文档、代码文件
    if (isImage || isVideo || isAudio || isDocument || isCode) {
        const fullscreenBtn = createTrafficLightButton("pi-window-maximize", "#28c940", "全屏", () => toggleFullscreen(previewWindow));
        trafficLights.appendChild(fullscreenBtn);
    }

    header.appendChild(trafficLights);

    const title = document.createElement("div");
    title.style.cssText = "display: flex; align-items: center; gap: 8px; color: #fff; font-size: 14px; font-weight: 600; flex: 1; justify-content: center;";
    title.innerHTML = `
        <i class="pi ${fileConfig.icon}" style="color: ${fileConfig.color};"></i>
        <span style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${fileName}</span>
    `;

    header.appendChild(title);

    return header;
}

/**
 * 创建交通灯按钮
 */
function createTrafficLightButton(icon, hoverColor, title, onClick) {
    const button = document.createElement("button");
    button.className = "comfy-btn";
    button.innerHTML = `<i class="pi ${icon}" style="font-size: 10px;"></i>`;
    button.style.cssText = `
        width: 14px;
        height: 14px;
        padding: 0;
        background: transparent;
        border: none;
        color: #fff;
        cursor: pointer;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s ease;
    `;
    button.title = title;
    button.onmouseover = () => button.style.background = hoverColor;
    button.onmouseout = () => button.style.background = "transparent";
    button.onclick = onClick;
    return button;
}

/**
 * 创建预览内容区域
 */
function createPreviewContent(path, ext, isImage) {
    const content = document.createElement("div");
    content.className = "dm-preview-content";
    content.style.cssText = `
        flex: 1;
        overflow: hidden;
        padding: 15px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #0f0f0f;
        position: relative;
    `;

    let imageScale = 1;
    let imageTranslateX = 0;
    let imageTranslateY = 0;

    const imageContainer = document.createElement("div");
    imageContainer.className = "dm-image-container";
    imageContainer.style.cssText = `
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        cursor: ${isImage ? 'grab' : 'default'};
    `;

    // 加载预览内容
    loadPreviewContent(imageContainer, path, ext, imageScale);

    content.appendChild(imageContainer);

    return content;
}

/**
 * 创建预览工具栏
 */
function createPreviewToolbar(path, ext, isImage, isVideo, isAudio, isPDF, isMarkdown, isCode, content, previewWindow) {
    const toolbar = document.createElement("div");
    toolbar.className = "dm-preview-toolbar";
    toolbar.style.cssText = `
        padding: 12px 16px;
        background: linear-gradient(to bottom, #2a2a2a, #222);
        border-top: 1px solid #3a3a3a;
        display: flex;
        align-items: center;
        font-size: 12px;
        color: #888;
    `;

    const toolbarLeft = document.createElement("div");
    toolbarLeft.style.cssText = "display: flex; gap: 8px; align-items: center; flex-shrink: 0;";

    const toolbarCenter = document.createElement("div");
    toolbarCenter.style.cssText = "flex: 1; text-align: center; overflow: hidden; padding: 0 20px;";

    const toolbarRight = document.createElement("div");
    toolbarRight.style.cssText = "display: flex; gap: 8px; align-items: center; flex-shrink: 0;";

    // 图像缩放控制
    if (isImage) {
        addImageZoomControls(toolbarLeft, content);
    }

    // 文档字号控制 (txt, rtf, docx 等文本文档)
    if (ext === '.txt' || ext === '.rtf' || ext === '.md' || ext === '.docx') {
        addDocumentFontSizeControls(toolbarLeft, content, ext);
    }

    // 代码文件字号控制
    if (isCode) {
        addCodeFontSizeControls(toolbarLeft, content, ext);
    }

    // 文件路径
    const filePath = document.createElement("div");
    filePath.className = "dm-file-path";
    filePath.style.cssText = "overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #999;";
    filePath.textContent = path;
    filePath.title = path;
    toolbarCenter.appendChild(filePath);

    // 分隔符
    toolbarRight.appendChild(createToolbarSeparator());

    // 视频/音频播放控制
    if (isVideo || isAudio) {
        addMediaControls(toolbarRight, content, isVideo);
    }

    // PDF 全屏按钮
    if (isPDF) {
        toolbarRight.appendChild(createToolbarSeparator());
        const pdfFullscreenBtn = createToolbarButton("pi-arrows-alt", "PDF 全屏", () => {
            const embed = document.getElementById('dm-floating-pdf-embed');
            if (embed && embed.requestFullscreen) {
                embed.requestFullscreen().catch(err => console.error('[DataManager] PDF 全屏失败:', err));
            } else if (embed && embed.webkitRequestFullscreen) {
                embed.webkitRequestFullscreen();
            }
        });
        toolbarRight.appendChild(pdfFullscreenBtn);
    }

    // Markdown/Txt 全屏按钮
    if (ext === '.md' || ext === '.txt' || ext === '.rtf') {
        toolbarRight.appendChild(createToolbarSeparator());
        const docFullscreenBtn = createToolbarButton("pi-arrows-alt", "全屏预览", () => toggleFullscreen(previewWindow));
        toolbarRight.appendChild(docFullscreenBtn);
    }

    // 代码文件全屏按钮
    if (isCode) {
        toolbarRight.appendChild(createToolbarSeparator());
        const codeFullscreenBtn = createToolbarButton("pi-arrows-alt", "全屏预览", () => toggleFullscreen(previewWindow));
        toolbarRight.appendChild(codeFullscreenBtn);
    }

    // 打开按钮
    const openBtn = createToolbarButton("pi-external-link", "打开", () => openFileExternally(path));
    toolbarRight.appendChild(openBtn);

    toolbar.appendChild(toolbarLeft);
    toolbar.appendChild(toolbarCenter);
    toolbar.appendChild(toolbarRight);

    return toolbar;
}

/**
 * 创建工具栏分隔符
 */
function createToolbarSeparator() {
    const separator = document.createElement("div");
    separator.style.cssText = "width: 1px; height: 16px; background: #3a3a3a; margin: 0 4px;";
    return separator;
}

/**
 * 添加图像缩放控制
 */
function addImageZoomControls(toolbarLeft, content) {
    let imageScale = 1;
    let imageTranslateX = 0;
    let imageTranslateY = 0;
    let isDraggingImage = false;
    let dragStart = { x: 0, y: 0 };

    const imageContainer = content.querySelector(".dm-image-container");
    if (!imageContainer) return;

    toolbarLeft.appendChild(createToolbarSeparator());

    const zoomOutBtn = createToolbarButton("pi-search-minus", "缩小", () => {
        imageScale = Math.max(0.1, imageScale - 0.1);
        updateImageScale(imageContainer, imageScale, imageTranslateX, imageTranslateY);
        updateZoomDisplay();
    });
    toolbarLeft.appendChild(zoomOutBtn);

    const zoomDisplay = document.createElement("span");
    zoomDisplay.className = "dm-zoom-display";
    zoomDisplay.style.cssText = "min-width: 50px; text-align: center; color: #aaa; font-weight: 500;";
    zoomDisplay.textContent = "100%";
    toolbarLeft.appendChild(zoomDisplay);

    const zoomInBtn = createToolbarButton("pi-search-plus", "放大", () => {
        imageScale = Math.min(5, imageScale + 0.1);
        updateImageScale(imageContainer, imageScale, imageTranslateX, imageTranslateY);
        updateZoomDisplay();
    });
    toolbarLeft.appendChild(zoomInBtn);

    const resetBtn = createToolbarButton("pi-refresh", "重置", () => {
        imageScale = 1;
        imageTranslateX = 0;
        imageTranslateY = 0;
        updateImageScale(imageContainer, imageScale, imageTranslateX, imageTranslateY);
        updateZoomDisplay();
    });
    toolbarLeft.appendChild(resetBtn);

    function updateZoomDisplay() {
        zoomDisplay.textContent = Math.round(imageScale * 100) + "%";
    }

    // 鼠标滚轮缩放
    content.addEventListener("wheel", (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        imageScale = Math.max(0.1, Math.min(5, imageScale + delta));
        updateImageScale(imageContainer, imageScale, imageTranslateX, imageTranslateY);
        updateZoomDisplay();
    }, { passive: false });

    // 图像拖动
    imageContainer.addEventListener("mousedown", (e) => {
        if (imageScale <= 1) return;
        isDraggingImage = true;
        dragStart = { x: e.clientX - imageTranslateX, y: e.clientY - imageTranslateY };
        imageContainer.style.cursor = "grabbing";
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDraggingImage) return;
        imageTranslateX = e.clientX - dragStart.x;
        imageTranslateY = e.clientY - dragStart.y;
        updateImageScale(imageContainer, imageScale, imageTranslateX, imageTranslateY);
    });

    document.addEventListener("mouseup", () => {
        if (isDraggingImage) {
            isDraggingImage = false;
            imageContainer.style.cursor = "grab";
        }
    });
}

/**
 * 添加媒体控制
 */
function addMediaControls(toolbarRight, content, isVideo) {
    const mediaElement = content.querySelector('video, audio');
    if (!mediaElement) return;

    // 时间显示
    const timeDisplay = document.createElement("span");
    timeDisplay.className = "dm-media-time";
    timeDisplay.style.cssText = "min-width: 80px; text-align: center; color: #aaa; font-size: 11px; font-family: monospace;";
    timeDisplay.textContent = "0:00 / 0:00";
    toolbarRight.appendChild(timeDisplay);

    toolbarRight.appendChild(createToolbarSeparator());

    // 音量控制
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

    // 播放/暂停按钮
    const playPauseBtn = createToolbarButton("pi-play", "播放", () => {
        if (mediaElement.paused) {
            mediaElement.play().then(() => {
                playPauseBtn.innerHTML = '<i class="pi pi-pause"></i>';
                playPauseBtn.title = "暂停";
            }).catch(err => console.error('[DataManager] 播放失败:', err));
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

    // 更新时间显示
    const formatTime = (seconds) => {
        if (isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    mediaElement.addEventListener('loadedmetadata', () => {
        timeDisplay.textContent = `0:00 / ${formatTime(mediaElement.duration)}`;
    });

    mediaElement.addEventListener('timeupdate', () => {
        timeDisplay.textContent = `${formatTime(mediaElement.currentTime)} / ${formatTime(mediaElement.duration || 0)}`;
    });

    // 视频全屏按钮
    if (isVideo) {
        toolbarRight.appendChild(createToolbarSeparator());
        const videoFullscreenBtn = createToolbarButton("pi-arrows-alt", "视频全屏", () => {
            if (mediaElement.requestFullscreen) {
                mediaElement.requestFullscreen().catch(err => console.error('[DataManager] 全屏失败:', err));
            } else if (mediaElement.webkitRequestFullscreen) {
                mediaElement.webkitRequestFullscreen();
            }
        });
        toolbarRight.appendChild(videoFullscreenBtn);
    }
}

/**
 * 切换全屏模式（macOS 风格）
 */
export function toggleFullscreen(window) {
    const isFullscreen = window.dataset.fullscreen === "true";
    const header = window.querySelector(".dm-preview-header");
    const fullscreenBtn = header?.querySelector('[title="全屏"], [title="退出全屏"]');

    if (!isFullscreen) {
        // 进入全屏
        window.dataset.originalStyle = window.style.cssText;
        window.dataset.originalTop = window.style.top;
        window.dataset.originalLeft = window.style.left;
        window.dataset.originalWidth = window.style.width;
        window.dataset.originalHeight = window.style.height;

        window.style.cssText = `
            position: fixed;
            top: 20px !important;
            left: 20px !important;
            right: 20px !important;
            bottom: 20px !important;
            width: auto !important;
            height: auto !important;
            max-height: none !important;
            background: #1a1a1a;
            border: 1px solid #3a3a3a;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
            z-index: 10002;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        `;
        window.dataset.fullscreen = "true";

        if (fullscreenBtn) {
            fullscreenBtn.innerHTML = '<i class="pi pi-window-minimize"></i>';
            fullscreenBtn.title = "退出全屏";
        }

        const escHandler = (e) => {
            if (e.key === "Escape") {
                toggleFullscreen(window);
                document.removeEventListener("keydown", escHandler);
            }
        };
        window._escHandler = escHandler;
        document.addEventListener("keydown", escHandler);

    } else {
        // 退出全屏
        window.style.cssText = window.dataset.originalStyle || "";
        window.style.top = window.dataset.originalTop || "100px";
        window.style.left = window.dataset.originalLeft || "50px";
        window.dataset.fullscreen = "false";

        if (fullscreenBtn) {
            fullscreenBtn.innerHTML = '<i class="pi pi-window-maximize"></i>';
            fullscreenBtn.title = "全屏";
        }

        if (window._escHandler) {
            document.removeEventListener("keydown", window._escHandler);
            window._escHandler = null;
        }
    }
}

/**
 * 关闭浮动预览窗口
 */
export function closeFloatingPreview(window) {
    const index = previewFloatingWindows.findIndex(w => w.window === window);
    if (index !== -1) {
        previewFloatingWindows.splice(index, 1);
    }
    window.remove();
    updateDock();
}

/**
 * 最小化浮动预览窗口
 */
function minimizeFloatingPreview(window, path, fileName, fileConfig) {
    window.style.display = "none";
    const windowData = previewFloatingWindows.find(w => w.window === window);
    if (windowData) {
        windowData.minimized = true;
    }
    updateDock();
}

/**
 * 恢复浮动预览窗口
 */
export function restoreFloatingPreview(window) {
    window.style.display = "flex";
    const windowData = previewFloatingWindows.find(w => w.window === window);
    if (windowData) {
        windowData.minimized = false;
    }
    updateDock();
}

/**
 * 添加文档字号控制
 */
function addDocumentFontSizeControls(toolbarLeft, content, ext) {
    let fontSize = 13;

    // 查找文档内容元素
    const findDocumentContent = () => {
        if (ext === '.md') {
            // Markdown 是在 iframe 中
            return null; // Markdown 暂不支持字号调整
        }
        // 查找文档内容（支持 txt, rtf, docx）
        return content.querySelector('.dm-document-content');
    };

    toolbarLeft.appendChild(createToolbarSeparator());

    const fontSizeDown = createToolbarButton("pi-minus", "减小字号", () => {
        fontSize = Math.max(8, fontSize - 1);
        updateFontSize();
    });
    toolbarLeft.appendChild(fontSizeDown);

    const fontSizeDisplay = document.createElement("span");
    fontSizeDisplay.className = "dm-font-size-display";
    fontSizeDisplay.style.cssText = "min-width: 40px; text-align: center; color: #aaa; font-weight: 500;";
    fontSizeDisplay.textContent = fontSize + "px";
    toolbarLeft.appendChild(fontSizeDisplay);

    const fontSizeUp = createToolbarButton("pi-plus", "增大字号", () => {
        fontSize = Math.min(32, fontSize + 1);
        updateFontSize();
    });
    toolbarLeft.appendChild(fontSizeUp);

    const resetFont = createToolbarButton("pi-refresh", "重置字号", () => {
        fontSize = 13;
        updateFontSize();
    });
    toolbarLeft.appendChild(resetFont);

    function updateFontSize() {
        const docContent = findDocumentContent();
        if (docContent) {
            docContent.style.fontSize = fontSize + 'px';
            fontSizeDisplay.textContent = fontSize + 'px';
        }
    }
}

/**
 * 添加代码文件字号控制
 */
function addCodeFontSizeControls(toolbarLeft, content, ext) {
    let fontSize = 12;

    // 查找代码内容元素（在 pre 标签中）
    const findCodeContent = () => {
        const pre = content.querySelector('pre');
        if (pre) {
            return pre;
        }
        // 如果没有 pre，查找包含代码的 div
        return content.querySelector('div[style*="font-family"]');
    };

    toolbarLeft.appendChild(createToolbarSeparator());

    const fontSizeDown = createToolbarButton("pi-minus", "减小字号", () => {
        fontSize = Math.max(8, fontSize - 1);
        updateFontSize();
    });
    toolbarLeft.appendChild(fontSizeDown);

    const fontSizeDisplay = document.createElement("span");
    fontSizeDisplay.className = "dm-font-size-display";
    fontSizeDisplay.style.cssText = "min-width: 40px; text-align: center; color: #aaa; font-weight: 500;";
    fontSizeDisplay.textContent = fontSize + "px";
    toolbarLeft.appendChild(fontSizeDisplay);

    const fontSizeUp = createToolbarButton("pi-plus", "增大字号", () => {
        fontSize = Math.min(32, fontSize + 1);
        updateFontSize();
    });
    toolbarLeft.appendChild(fontSizeUp);

    const resetFont = createToolbarButton("pi-refresh", "重置字号", () => {
        fontSize = 12;
        updateFontSize();
    });
    toolbarLeft.appendChild(resetFont);

    function updateFontSize() {
        const codeContent = findCodeContent();
        if (codeContent) {
            codeContent.style.fontSize = fontSize + 'px';
            fontSizeDisplay.textContent = fontSize + 'px';
        }
    }
}
