/**
 * ui-preview-actions.js - 预览功能
 */

import { FILE_TYPES } from './core-constants.js';
import { getTypeByExt } from './utils-file-type.js';
import { getPreviewUrl, getFileInfo } from './api-index.js';
import { escapeHtml } from './utils-format.js';
import { updateStatus, getFileName, getExt } from './utils-helpers.js';
import { openFloatingPreview } from './floating-window.js';
import { FileManagerState } from './core-state.js';
import { loadScript } from './utils-script.js';
import { parseCSV } from './utils-csv.js';
import { highlightCode, highlightJSON, highlightPython, highlightJavaScript, highlightHTML, highlightCSS, highlightYAML, highlightXML, highlightGeneric } from './utils-syntax-highlight.js';
import { createTableHTML, setupTableControls } from './utils-table.js';

/**
 * 预览文件
 * @param {string} path - 文件路径
 */
export async function previewFile(path) {
    // 保存当前预览文件
    FileManagerState.currentPreviewFile = path;

    const content = document.getElementById("dm-preview-content");
    const floatingBtn = document.getElementById("dm-open-floating-preview-btn");

    if (!content) return;

    content.innerHTML = `
        <div class="dm-panel-loading" style="text-align: center; padding: 20px;">
            <i class="pi pi-spin pi-spinner"></i>
        </div>
    `;

    const ext = getExt(path);
    const fileName = path.split(/[/\\]/).pop();
    const fileType = getTypeByExt(ext);

    try {
        let previewHTML = "";
        let canOpenExternally = false;

        // 图像预览
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
        // 音频预览
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
        // 视频预览
        else if (FILE_TYPES.video.exts.includes(ext)) {
            const videoUrl = getPreviewUrl(path);
            const videoId = `dm-panel-video-${Date.now()}`;
            previewHTML = createVideoPreviewHTML(videoId, videoUrl);
            canOpenExternally = true;
        }
        // 代码预览
        else if (FILE_TYPES.code.exts.includes(ext)) {
            try {
                const response = await fetch(getPreviewUrl(path));
                if (response.ok) {
                    const text = await response.text();
                    previewHTML = createCodePreviewHTML(text, ext);
                    canOpenExternally = true;
                } else {
                    throw new Error('Failed to load file');
                }
            } catch (error) {
                console.error('[DataManager] Code preview error:', error);
                previewHTML = createUnavailablePreview(fileName, 'code');
            }
        }
        // 文档预览
        else if (FILE_TYPES.document.exts.includes(ext)) {
            const docUrl = getPreviewUrl(path);
            previewHTML = await createDocumentPreviewHTML(path, ext, docUrl);
            canOpenExternally = true;
        }
        // 表格预览
        else if (FILE_TYPES.spreadsheet.exts.includes(ext)) {
            previewHTML = await createSpreadsheetPreviewHTML(path, ext);
            canOpenExternally = true;
        }
        // 其他文件
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

        // 绑定视频控件事件
        if (FILE_TYPES.video.exts.includes(ext)) {
            setupVideoControls(content);
        }

        // 更新按钮
        if (floatingBtn) {
            floatingBtn.style.display = "block";
            floatingBtn.onclick = () => openFloatingPreview(path, fileName);
        }

        updateStatus(`预览: ${fileName}`);

        // 更新文件信息区域
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
 * 创建视频预览 HTML
 */
function createVideoPreviewHTML(videoId, videoUrl) {
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
 * 设置视频控件事件
 */
function setupVideoControls(content) {
    const video = content.querySelector('video');
    const playBtn = content.querySelector('.dm-video-play-btn');
    const volumeBtn = content.querySelector('.dm-video-volume-btn');
    const fullscreenBtn = content.querySelector('.dm-video-fullscreen-btn');
    const timeDisplay = content.querySelector(`[id$="-time"]`);

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

    if (volumeBtn) {
        volumeBtn.addEventListener('click', () => {
            video.muted = !video.muted;
            volumeBtn.innerHTML = video.muted ? '<i class="pi pi-volume-off"></i>' : '<i class="pi pi-volume-up"></i>';
        });
    }

    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            if (video.requestFullscreen) {
                video.requestFullscreen();
            }
        });
    }

    video.addEventListener('loadedmetadata', () => {
        timeDisplay.textContent = `0:00 / ${formatTime(video.duration)}`;
    });

    video.addEventListener('timeupdate', () => {
        timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration || 0)}`;
    });
}

function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 创建代码预览 HTML
 */
function createCodePreviewHTML(text, ext = '') {
    const maxLength = 50000;
    const displayText = text.length > maxLength ? text.substring(0, maxLength) + '\n\n... (文件过大，已截断)' : text;

    // 使用通用语法高亮函数
    const highlighted = highlightCode(displayText, ext);

    return `
        <div class="dm-panel-code-preview" style="padding: 15px;
                    font-family: 'Consolas', 'Monaco', monospace; font-size: 12px; line-height: 1.5;
                    overflow-x: auto; max-height: 400px; overflow-y: auto; border-radius: 0;">
            <pre class="dm-panel-code-content" style="margin: 0; white-space: pre-wrap;">${highlighted}</pre>
        </div>
    `;
}

/**
 * 创建文档预览 HTML（异步获取内容）
 */
async function createDocumentPreviewHTML(path, ext, docUrl) {
    if (ext === '.pdf') {
        return `
            <div style="width: 100%; height: 400px; border-radius: 8px; overflow: hidden;">
                <embed src="${docUrl}" type="application/pdf" width="100%" height="100%" />
            </div>
        `;
    } else if (ext === '.md') {
        return `
            <div style="width: 100%; height: 400px; border-radius: 8px; overflow: hidden; border: 1px solid #3a3a3a;">
                <iframe src="${docUrl}" style="width: 100%; height: 100%; border: none;"></iframe>
            </div>
        `;
    } else if (ext === '.doc') {
        // 旧版 Word 文档无法预览
        return `
            <div class="dm-panel-doc-unsupported" style="text-align: center; padding: 40px;">
                <i class="pi pi-file-word dm-doc-unsupported-icon" style="font-size: 64px; margin-bottom: 15px;"></i>
                <div class="dm-preview-filename" style="margin-top: 15px; font-size: 14px;">${path.split(/[/\\]/).pop()}</div>
                <div class="dm-unsupported-message" style="margin-top: 10px; font-size: 12px;">.doc 格式暂不支持预览</div>
                <div class="dm-unsupported-sub" style="margin-top: 5px; font-size: 11px;">请转换为 .docx 或点击"打开"按钮</div>
            </div>
        `;
    } else if (ext === '.docx') {
        // .docx 文件使用 mammoth.js 转换为 HTML
        try {
            const response = await fetch(docUrl);
            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();

                // 检查 mammoth.js 是否已加载
                if (typeof mammoth === 'undefined') {
                    // 动态加载 mammoth.js
                    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js');
                }

                if (typeof mammoth !== 'undefined') {
                    const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
                    return `
                        <div id="dm-panel-doc-content" class="dm-document-content dm-docx-content dm-panel-docx-content"
                             style="width: 100%; height: 400px; border-radius: 8px;
                                    font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px;
                                    line-height: 1.6; overflow: auto; box-sizing: border-box;
                                    padding: 20px;">
                            <style>
                                #dm-panel-doc-content img {
                                    max-width: 100%;
                                    height: auto;
                                    display: inline-block;
                                    margin: 10px 0;
                                }
                                #dm-panel-doc-content p {
                                    word-wrap: break-word;
                                    overflow-wrap: break-word;
                                    margin: 0.5em 0;
                                }
                                #dm-panel-doc-content table {
                                    max-width: 100%;
                                    overflow: auto;
                                    display: block;
                                    margin: 10px 0;
                                }
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
            return `
                <div class="dm-panel-preview-error" style="text-align: center; padding: 40px;">
                    <i class="pi pi-exclamation-triangle dm-error-icon" style="font-size: 48px;"></i>
                    <div class="dm-preview-filename" style="margin-top: 15px;">${path.split(/[/\\]/).pop()}</div>
                    <div class="dm-error-title" style="margin-top: 10px; font-size: 12px;">预览加载失败</div>
                    <div class="dm-error-detail" style="margin-top: 5px; font-size: 11px;">${error.message}</div>
                </div>
            `;
        }
    } else {
        // txt, rtf 等文本文档 - 异步获取内容
        try {
            const response = await fetch(docUrl);
            if (response.ok) {
                const text = await response.text();
                return `
                    <div id="dm-panel-doc-content" class="dm-document-content dm-panel-text-content"
                         style="width: 100%; height: 400px; border-radius: 8px;
                                font-family: 'Consolas', 'Monaco', monospace; font-size: 13px;
                                line-height: 1.6; overflow: auto; box-sizing: border-box;
                                word-break: break-word; white-space: pre-wrap; padding: 15px;">${escapeHtml(text)}</div>
                `;
            }
        } catch (e) {
            console.error('[DataManager] 加载文档失败:', e);
        }
        return `
            <div class="dm-panel-unavailable" style="text-align: center; padding: 30px;">
                <i class="pi pi-file dm-unavailable-icon" style="font-size: 48px;"></i>
                <div class="dm-preview-filename" style="margin-top: 15px;">${path.split(/[/\\]/).pop()}</div>
                <div class="dm-unavailable-message" style="margin-top: 8px; font-size: 12px;">点击"打开"按钮查看文件</div>
            </div>
        `;
    }
}


/**
 * 创建不可用预览
 */
function createUnavailablePreview(fileName, type) {
    const icons = { document: 'pi-file-pdf', code: 'pi-code', default: 'pi-file' };
    return `
        <div class="dm-panel-unavailable-preview" style="text-align: center; padding: 30px;">
            <i class="pi ${icons[type] || icons.default} dm-unavailable-icon" style="font-size: 64px;"></i>
            <div class="dm-preview-filename" style="margin-top: 15px; font-size: 14px;">${escapeHtml(fileName)}</div>
            <div class="dm-unavailable-message" style="margin-top: 8px; font-size: 12px;">双击"打开"按钮查看文件</div>
        </div>
    `;
}

/**
 * 更新文件信息区域
 * @param {string} path - 文件路径
 */
async function updateFileInfo(path) {
    const infoSection = document.getElementById("dm-file-info");
    if (!infoSection) return;

    try {
        const info = await getFileInfo(path);
        const fileName = path.split(/[/\\]/).pop();
        const size = formatFileSize(info.size || 0);
        const date = formatDate(info.mtime || info.ctime || Date.now());

        infoSection.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="dm-info-filename" style="font-weight: 500; word-break: break-all;">${escapeHtml(fileName)}</span>
                </div>
                <div class="dm-info-details" style="display: flex; justify-content: space-between; font-size: 11px;">
                    <span><i class="pi pi-database" style="margin-right: 4px;"></i>${size}</span>
                    <span><i class="pi pi-clock" style="margin-right: 4px;"></i>${date}</span>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('[DataManager] updateFileInfo error:', error);
        const fileName = path.split(/[/\\]/).pop();
        infoSection.innerHTML = `
            <div class="dm-info-error" style="text-align: center; font-size: 12px;">
                ${escapeHtml(fileName)}
            </div>
        `;
    }
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节大小
 * @returns {string} 格式化后的大小字符串
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 格式化日期
 * @param {number} timestamp - 时间戳
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 创建表格预览 HTML（CSV/Excel）
 */
async function createSpreadsheetPreviewHTML(path, ext) {
    const fileUrl = getPreviewUrl(path);

    try {
        // CSV 文件直接解析
        if (ext === '.csv') {
            const response = await fetch(fileUrl);
            if (!response.ok) throw new Error('Failed to load CSV');

            const text = await response.text();
            const rows = parseCSV(text);

            if (rows.length === 0) {
                return `
                    <div class="dm-panel-empty-table" style="text-align: center; padding: 40px;">
                        <i class="pi pi-table dm-empty-table-icon" style="font-size: 48px; margin-bottom: 15px;"></i>
                        <div class="dm-preview-filename" style="font-size: 14px;">${path.split(/[/\\]/).pop()}</div>
                        <div class="dm-empty-table-message" style="margin-top: 10px; font-size: 12px;">空表格文件</div>
                    </div>
                `;
            }

            return createTableHTML(rows, { type: 'panel', maxRows: 100 });
        }

        // Excel 文件使用 SheetJS 解析
        if (ext === '.xls' || ext === '.xlsx') {
            // 检查 xlsx 库是否已加载
            if (typeof XLSX === 'undefined') {
                await loadScript('https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js');
            }

            const response = await fetch(fileUrl);
            if (!response.ok) throw new Error('Failed to load Excel');

            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });

            // 读取第一个工作表
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // 转换为二维数组
            const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (rows.length === 0) {
                return `
                    <div class="dm-panel-empty-table" style="text-align: center; padding: 40px;">
                        <i class="pi pi-table dm-empty-table-icon" style="font-size: 48px; margin-bottom: 15px;"></i>
                        <div class="dm-preview-filename" style="font-size: 14px;">${path.split(/[/\\]/).pop()}</div>
                        <div class="dm-empty-table-message" style="margin-top: 10px; font-size: 12px;">空表格文件</div>
                    </div>
                `;
            }

            return createTableHTML(rows, { type: 'panel', maxRows: 100 });
        }

        // 其他表格格式不支持预览
        return `
            <div class="dm-panel-unsupported-table" style="text-align: center; padding: 40px;">
                <i class="pi pi-table dm-unsupported-table-icon" style="font-size: 64px; margin-bottom: 15px;"></i>
                <div class="dm-preview-filename" style="font-size: 14px;">${path.split(/[/\\]/).pop()}</div>
                <div class="dm-unsupported-message" style="margin-top: 10px; font-size: 12px;">此格式暂不支持预览</div>
            </div>
        `;

    } catch (error) {
        console.error('[DataManager] Spreadsheet preview error:', error);
        return `
            <div class="dm-panel-preview-error" style="text-align: center; padding: 40px;">
                <i class="pi pi-exclamation-triangle dm-error-icon" style="font-size: 48px;"></i>
                <div class="dm-preview-filename" style="margin-top: 15px;">${path.split(/[/\\]/).pop()}</div>
                <div class="dm-error-title" style="margin-top: 10px; font-size: 12px;">预览加载失败</div>
                <div class="dm-error-detail" style="margin-top: 5px; font-size: 11px;">${error.message}</div>
            </div>
        `;
    }
}


