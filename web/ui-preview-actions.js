/**
 * ui-preview-actions.js - 预览功能
 */

import { FILE_TYPES } from './core-constants.js';
import { getTypeByExt } from './utils-file-type.js';
import { getPreviewUrl } from './api-index.js';
import { escapeHtml } from './utils-format.js';
import { updateStatus, getFileName, getExt } from './utils-helpers.js';
import { openFloatingPreview } from './floating-window.js';
import { openFileExternally } from './floating-actions.js';

/**
 * 预览文件
 * @param {string} path - 文件路径
 */
export async function previewFile(path) {
    const content = document.getElementById("dm-preview-content");
    const floatingBtn = document.getElementById("dm-open-floating-preview-btn");
    const openBtn = document.getElementById("dm-open-preview-btn");

    if (!content) return;

    content.innerHTML = `
        <div style="text-align: center; padding: 20px;">
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
                         style="max-width: 100%; max-height: 300px;
                                border-radius: 8px; border: 1px solid #3a3a3a;"
                         onerror="this.parentElement.innerHTML='<div style=\\'color:#e74c3c\\'>无法加载图像</div>'">
                </div>
            `;
            canOpenExternally = true;
        }
        // 音频预览
        else if (FILE_TYPES.audio.exts.includes(ext)) {
            const audioUrl = getPreviewUrl(path);
            previewHTML = `
                <div style="text-align: center; padding: 20px;">
                    <i class="pi pi-volume-up" style="font-size: 64px; color: #3498db;"></i>
                    <div style="margin-top: 15px; color: #fff;">${fileName}</div>
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
                    previewHTML = createCodePreviewHTML(text);
                } else {
                    throw new Error('Failed to load file');
                }
            } catch {
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
            previewHTML = createUnavailablePreview(fileName, 'spreadsheet');
            canOpenExternally = true;
        }
        // 其他文件
        else {
            const icon = FILE_TYPES[fileType]?.icon || FILE_TYPES.unknown.icon;
            const color = FILE_TYPES[fileType]?.color || FILE_TYPES.unknown.color;
            previewHTML = `
                <div style="text-align: center; padding: 30px;">
                    <i class="pi ${icon}" style="font-size: 64px; color: ${color};"></i>
                    <div style="margin-top: 15px; color: #fff; font-size: 14px;">${fileName}</div>
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

        if (openBtn) {
            openBtn.style.display = canOpenExternally ? "block" : "none";
            if (canOpenExternally) {
                openBtn.onclick = () => openFileExternally(path);
            }
        }

        updateStatus(`预览: ${fileName}`);

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
            <div style="position: relative; background: #000; border-radius: 8px; overflow: hidden;">
                <video id="${videoId}" preload="metadata" style="width: 100%; max-height: 300px; display: block; object-fit: contain;">
                    <source src="${videoUrl}" type="video/mp4">
                </video>
            </div>
            <div id="${videoId}-controls" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; background: #252525; border-radius: 0 0 8px 8px; margin-top: -2px;">
                <button class="comfy-btn dm-video-play-btn" data-video-id="${videoId}" style="padding: 6px 12px; background: #3a3a3a; border: 1px solid #4a4a4a; border-radius: 6px; color: #fff; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 5px;">
                    <i class="pi pi-play"></i> 播放
                </button>
                <span id="${videoId}-time" style="color: #aaa; font-size: 11px; font-family: monospace; min-width: 80px; text-align: center;">0:00 / 0:00</span>
                <button class="comfy-btn dm-video-volume-btn" data-video-id="${videoId}" style="padding: 6px 10px; background: #3a3a3a; border: 1px solid #4a4a4a; border-radius: 6px; color: #fff; cursor: pointer;" title="音量">
                    <i class="pi pi-volume-up"></i>
                </button>
                <button class="comfy-btn dm-video-fullscreen-btn" data-video-id="${videoId}" style="padding: 6px 10px; background: #3a3a3a; border: 1px solid #4a4a4a; border-radius: 6px; color: #fff; cursor: pointer;" title="视频全屏">
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
function createCodePreviewHTML(text) {
    return `
        <div style="background: #1e1e1e; padding: 15px; border-radius: 8px;
                    font-family: 'Consolas', 'Monaco', monospace; font-size: 12px;
                    overflow-x: auto; max-height: 400px; overflow-y: auto;">
            <pre style="margin: 0; color: #d4d4d4;">${escapeHtml(text.substring(0, 5000))}${text.length > 5000 ? '\n\n... (文件过大，仅显示前 5000 字符)' : ''}</pre>
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
            <div style="text-align: center; padding: 40px; color: #888;">
                <i class="pi pi-file-word" style="font-size: 64px; color: #2b579a; margin-bottom: 15px;"></i>
                <div style="margin-top: 15px; color: #fff; font-size: 14px;">${path.split(/[/\\]/).pop()}</div>
                <div style="margin-top: 10px; color: #888; font-size: 12px;">.doc 格式暂不支持预览</div>
                <div style="margin-top: 5px; color: #666; font-size: 11px;">请转换为 .docx 或点击"打开"按钮</div>
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
                        <div id="dm-panel-doc-content" class="dm-document-content dm-docx-content"
                             style="width: 100%; height: 400px; background: #1e1e1e; border-radius: 8px;
                                    font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px;
                                    line-height: 1.6; overflow: auto; box-sizing: border-box;
                                    padding: 20px; color: #d4d4d4;">
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
                <div style="text-align: center; padding: 40px; color: #888;">
                    <i class="pi pi-exclamation-triangle" style="font-size: 48px; color: #e74c3c;"></i>
                    <div style="margin-top: 15px; color: #fff;">${path.split(/[/\\]/).pop()}</div>
                    <div style="margin-top: 10px; color: #e74c3c; font-size: 12px;">预览加载失败</div>
                    <div style="margin-top: 5px; color: #666; font-size: 11px;">${error.message}</div>
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
                    <div id="dm-panel-doc-content" class="dm-document-content"
                         style="width: 100%; height: 400px; background: #1e1e1e; border-radius: 8px;
                                font-family: 'Consolas', 'Monaco', monospace; font-size: 13px;
                                line-height: 1.6; overflow: auto; box-sizing: border-box;
                                word-break: break-word; white-space: pre-wrap; padding: 15px;">
                        ${escapeHtml(text)}
                    </div>
                `;
            }
        } catch (e) {
            console.error('[DataManager] 加载文档失败:', e);
        }
        return `
            <div style="text-align: center; padding: 30px; color: #666;">
                <i class="pi pi-file" style="font-size: 48px;"></i>
                <div style="margin-top: 15px; color: #fff;">${path.split(/[/\\]/).pop()}</div>
                <div style="margin-top: 8px; font-size: 12px;">点击"打开"按钮查看文件</div>
            </div>
        `;
    }
}

/**
 * 动态加载脚本
 */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

/**
 * 创建不可用预览
 */
function createUnavailablePreview(fileName, type) {
    const icons = { document: 'pi-file-pdf', code: 'pi-code', default: 'pi-file' };
    return `
        <div style="text-align: center; padding: 30px;">
            <i class="pi ${icons[type] || icons.default}" style="font-size: 64px; color: #e74c3c;"></i>
            <div style="margin-top: 15px; color: #fff; font-size: 14px;">${fileName}</div>
            <div style="margin-top: 8px; color: #888; font-size: 12px;">双击"打开"按钮查看文件</div>
        </div>
    `;
}
