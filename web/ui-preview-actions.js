/**
 * ui-preview-actions.js - 预览功能
 */

import { FILE_TYPES } from './core-constants.js';
import { getTypeByExt } from './utils-file-type.js';
import { getPreviewUrl, getFileInfo } from './api-index.js';
import { escapeHtml } from './utils-format.js';
import { updateStatus, getFileName, getExt } from './utils-helpers.js';
import { openFloatingPreview } from './floating-window.js';
import { openFileExternally } from './floating-actions.js';
import { FileManagerState } from './core-state.js';

/**
 * 预览文件
 * @param {string} path - 文件路径
 */
export async function previewFile(path) {
    // 保存当前预览文件
    FileManagerState.currentPreviewFile = path;

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
                    previewHTML = createCodePreviewHTML(text, ext);
                    canOpenExternally = true;
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
function createCodePreviewHTML(text, ext = '') {
    const maxLength = 50000;
    const displayText = text.length > maxLength ? text.substring(0, maxLength) + '\n\n... (文件过大，已截断)' : text;

    // 使用通用语法高亮函数
    const highlighted = highlightCode(displayText, ext);

    return `
        <div style="background: #1e1e1e; padding: 15px;
                    font-family: 'Consolas', 'Monaco', monospace; font-size: 12px; line-height: 1.5;
                    overflow-x: auto; max-height: 400px; overflow-y: auto; border-radius: 0;">
            <pre style="margin: 0; white-space: pre-wrap; color: #d4d4d4;">${highlighted}</pre>
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

// 语法高亮颜色主题（VS Code Dark 风格）
const CODE_COLORS = {
    keyword: '#569cd6',      // 关键字 (blue)
    string: '#ce9178',       // 字符串 (orange)
    number: '#b5cea8',       // 数字 (light green)
    boolean: '#569cd6',      // 布尔值 (blue)
    null: '#569cd6',         // null (blue)
    comment: '#6a9955',      // 注释 (green)
    function: '#dcdcaa',     // 函数 (yellow)
    class: '#4ec9b0',        // 类 (cyan)
    operator: '#d4d4d4',     // 操作符
    tag: '#569cd6',          // HTML 标签
    attrName: '#9cdcfe',     // 属性名
    attrValue: '#ce9178',    // 属性值
    punctuation: '#d4d4d4',  // 标点
    plain: '#d4d4d4',        // 普通文本
};

/**
 * 通用语法高亮函数
 * @param {string} code - 源代码
 * @param {string} ext - 文件扩展名
 * @returns {string} 高亮后的 HTML
 */
function highlightCode(code, ext) {
    // HTML 转义
    let result = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // 根据扩展名选择高亮规则
    switch (ext) {
        case '.json':
            result = highlightJSON(result);
            break;
        case '.py':
            result = highlightPython(result);
            break;
        case '.js':
        case '.ts':
        case '.jsx':
        case '.tsx':
            result = highlightJavaScript(result);
            break;
        case '.html':
        case '.htm':
            result = highlightHTML(result);
            break;
        case '.css':
            result = highlightCSS(result);
            break;
        case '.yaml':
        case '.yml':
            result = highlightYAML(result);
            break;
        case '.xml':
            result = highlightXML(result);
            break;
        default:
            // 默认：只高亮字符串和数字
            result = highlightGeneric(result);
    }

    return result;
}

/**
 * JSON 语法高亮
 */
function highlightJSON(code) {
    return code.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        let color = CODE_COLORS.number;
        if (/^"/.test(match)) {
            color = /:$/.test(match) ? CODE_COLORS.key : CODE_COLORS.string;
        } else if (/true|false/.test(match)) {
            color = CODE_COLORS.boolean;
        } else if (/null/.test(match)) {
            color = CODE_COLORS.null;
        }
        return `<span style="color: ${color};">${match}</span>`;
    });
}

/**
 * Python 语法高亮
 */
function highlightPython(code) {
    const keywords = /\b(def|class|import|from|if|elif|else|while|for|in|try|except|finally|with|as|return|yield|raise|pass|break|continue|and|or|not|is|lambda|True|False|None|async|await)\b/g;
    const decorators = /@[\w.]+/g;
    const strings = /("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
    const comments = /#.*$/gm;
    const numbers = /\b(\d+\.?\d*)\b/g;
    const functions = /\b([a-zA-Z_]\w*)\s*(?=\()/g;

    // 顺序很重要：注释 -> 字符串 -> 关键字 -> 函数 -> 数字
    return code
        .replace(comments, `<span style="color: ${CODE_COLORS.comment};">$&</span>`)
        .replace(strings, `<span style="color: ${CODE_COLORS.string};">$&</span>`)
        .replace(keywords, `<span style="color: ${CODE_COLORS.keyword};">$&</span>`)
        .replace(decorators, `<span style="color: ${CODE_COLORS.function};">$&</span>`)
        .replace(functions, `<span style="color: ${CODE_COLORS.function};">$1</span>(`)
        .replace(numbers, `<span style="color: ${CODE_COLORS.number};">$1</span>`);
}

/**
 * JavaScript/TypeScript 语法高亮
 */
function highlightJavaScript(code) {
    const keywords = /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|this|class|extends|import|export|from|async|await|try|catch|finally|throw|null|undefined|true|false|in|instanceof|typeof|void)\b/g;
    const templateStrings = /`(?:[^`\\]|\\.)*`/g;
    const strings = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
    const comments = /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm;
    const numbers = /\b(\d+\.?\d*)\b/g;
    const functions = /\b([a-zA-Z_]\w*)\s*(?=\()/g;
    const arrowFunc = /(&gt;|=>)/g;

    return code
        .replace(comments, `<span style="color: ${CODE_COLORS.comment};">$&</span>`)
        .replace(templateStrings, `<span style="color: ${CODE_COLORS.string};">$&</span>`)
        .replace(strings, `<span style="color: ${CODE_COLORS.string};">$&</span>`)
        .replace(keywords, `<span style="color: ${CODE_COLORS.keyword};">$&</span>`)
        .replace(functions, `<span style="color: ${CODE_COLORS.function};">$1</span>(`)
        .replace(arrowFunc, `<span style="color: ${CODE_COLORS.keyword};">$&</span>`)
        .replace(numbers, `<span style="color: ${CODE_COLORS.number};">$1</span>`);
}

/**
 * HTML 语法高亮
 */
function highlightHTML(code) {
    // HTML 标签
    code = code.replace(/(&lt;\/?)([\w-]+)/g, `$1<span style="color: ${CODE_COLORS.tag};">$2</span>`);
    // 属性名
    code = code.replace(/([\w-]+)(=)/g, `<span style="color: ${CODE_COLORS.attrName};">$1</span>$2`);
    // 属性值
    code = code.replace(/(=)("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, `$1<span style="color: ${CODE_COLORS.attrValue};">$2</span>`);
    return code;
}

/**
 * CSS 语法高亮
 */
function highlightCSS(code) {
    // 注释
    code = code.replace(/(\/\*[\s\S]*?\*\/)/g, `<span style="color: ${CODE_COLORS.comment};">$1</span>`);
    // 选择器
    code = code.replace(/^([\s]*)([.#@][\w-]+|[\w]+|::?[\w-]+)/gm, `$1<span style="color: ${CODE_COLORS.class};">$2</span>`);
    // 属性名
    code = code.replace(/([\w-]+)(?=\s*:)/g, `<span style="color: ${CODE_COLORS.attrName};">$1</span>`);
    // 属性值
    code = code.replace(/:\s*([^;{]+)/g, `: <span style="color: ${CODE_COLORS.attrValue};">$1</span>`);
    return code;
}

/**
 * YAML 语法高亮
 */
function highlightYAML(code) {
    // 键
    code = code.replace(/^(\s*)([\w-]+)(?=\s*:)/gm, `$1<span style="color: ${CODE_COLORS.key};">$2</span>:`);
    // 字符串值
    code = code.replace(/: ['"]([^'"]+)['"]/g, `: <span style="color: ${CODE_COLORS.string};">'$1'</span>`);
    // 布尔值和数字
    code = code.replace(/\b(true|false|yes|no|on|off)\b/gi, `<span style="color: ${CODE_COLORS.boolean};">$&</span>`);
    code = code.replace(/\b(\d+\.?\d*)\b/g, `<span style="color: ${CODE_COLORS.number};">$1</span>`);
    return code;
}

/**
 * XML 语法高亮
 */
function highlightXML(code) {
    // 标签名
    code = code.replace(/(&lt;\/?)([\w-:]+)/g, `$1<span style="color: ${CODE_COLORS.tag};">$2</span>`);
    // 属性名
    code = code.replace(/([\w-:]+)(=)/g, `<span style="color: ${CODE_COLORS.attrName};">$1</span>$2`);
    // 属性值
    code = code.replace(/(=)("(?:[^"\\]|\\.)*")/g, `$1<span style="color: ${CODE_COLORS.attrValue};">$2</span>`);
    return code;
}

/**
 * 通用语法高亮（只高亮字符串和数字）
 */
function highlightGeneric(code) {
    const strings = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
    const numbers = /\b(\d+\.?\d*)\b/g;
    const comments = /(#|\/\/).*$/gm;

    return code
        .replace(comments, `<span style="color: ${CODE_COLORS.comment};">$&</span>`)
        .replace(strings, `<span style="color: ${CODE_COLORS.string};">$&</span>`)
        .replace(numbers, `<span style="color: ${CODE_COLORS.number};">$1</span>`);
}

/**
 * JSON 语法高亮（保留兼容性）
 */
function syntaxHighlight(json) {
    if (typeof json !== 'string') {
        json = JSON.stringify(json, null, 2);
    }
    return highlightJSON(json);
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
                    <span style="color: #fff; font-weight: 500; word-break: break-all;">${fileName}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 11px; color: #888;">
                    <span><i class="pi pi-database" style="margin-right: 4px;"></i>${size}</span>
                    <span><i class="pi pi-clock" style="margin-right: 4px;"></i>${date}</span>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('[DataManager] updateFileInfo error:', error);
        const fileName = path.split(/[/\\]/).pop();
        infoSection.innerHTML = `
            <div style="text-align: center; color: #888; font-size: 12px;">
                ${fileName}
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
                    <div style="text-align: center; padding: 40px; color: #888;">
                        <i class="pi pi-table" style="font-size: 48px; margin-bottom: 15px;"></i>
                        <div style="color: #fff; font-size: 14px;">${path.split(/[/\\]/).pop()}</div>
                        <div style="margin-top: 10px; color: #888; font-size: 12px;">空表格文件</div>
                    </div>
                `;
            }

            return createTableHTML(rows, 100);
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
                    <div style="text-align: center; padding: 40px; color: #888;">
                        <i class="pi pi-table" style="font-size: 48px; margin-bottom: 15px;"></i>
                        <div style="color: #fff; font-size: 14px;">${path.split(/[/\\]/).pop()}</div>
                        <div style="margin-top: 10px; color: #888; font-size: 12px;">空表格文件</div>
                    </div>
                `;
            }

            return createTableHTML(rows, 100);
        }

        // 其他表格格式不支持预览
        return `
            <div style="text-align: center; padding: 40px; color: #888;">
                <i class="pi pi-table" style="font-size: 64px; color: #27ae60; margin-bottom: 15px;"></i>
                <div style="color: #fff; font-size: 14px;">${path.split(/[/\\]/).pop()}</div>
                <div style="margin-top: 10px; color: #888; font-size: 12px;">此格式暂不支持预览</div>
            </div>
        `;

    } catch (error) {
        console.error('[DataManager] Spreadsheet preview error:', error);
        return `
            <div style="text-align: center; padding: 40px; color: #888;">
                <i class="pi pi-exclamation-triangle" style="font-size: 48px; color: #e74c3c;"></i>
                <div style="margin-top: 15px; color: #fff;">${path.split(/[/\\]/).pop()}</div>
                <div style="margin-top: 10px; color: #e74c3c; font-size: 12px;">预览加载失败</div>
                <div style="margin-top: 5px; color: #666; font-size: 11px;">${error.message}</div>
            </div>
        `;
    }
}

/**
 * 解析 CSV 文本
 * @param {string} text - CSV 文本
 * @returns {Array} 二维数组
 */
function parseCSV(text) {
    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (inQuotes) {
            if (char === '"') {
                if (nextChar === '"') {
                    currentCell += '"';
                    i++; // 跳过下一个引号
                } else {
                    inQuotes = false;
                }
            } else {
                currentCell += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                currentRow.push(currentCell);
                currentCell = '';
            } else if (char === '\r' && nextChar === '\n') {
                currentRow.push(currentCell);
                rows.push(currentRow);
                currentRow = [];
                currentCell = '';
                i++; // 跳过 \n
            } else if (char === '\n') {
                currentRow.push(currentCell);
                rows.push(currentRow);
                currentRow = [];
                currentCell = '';
            } else if (char !== '\r') {
                currentCell += char;
            }
        }
    }

    // 添加最后一个单元格和行
    currentRow.push(currentCell);
    if (currentRow.length > 0 || rows.length > 0) {
        rows.push(currentRow);
    }

    return rows;
}

/**
 * 创建表格 HTML
 * @param {Array} rows - 二维数组数据
 * @param {number} maxRows - 最大显示行数
 * @returns {string} HTML 字符串
 */
function createTableHTML(rows, maxRows = 100) {
    const displayRows = rows.slice(0, maxRows);
    const isTruncated = rows.length > maxRows;
    const tableId = `dm-table-${Date.now()}`;

    let tableHTML = `
        <div style="display: flex; flex-direction: column; gap: 0;">
            <div style="position: relative; background: #1e1e1e; border-radius: 8px; overflow: hidden;">
                <div id="${tableId}-wrapper" class="dm-table-wrapper"
                     style="width: 100%; height: 400px; overflow: auto; padding: 15px;">
                    <table id="${tableId}" class="dm-data-table"
                           style="width: 100%; border-collapse: collapse; font-size: 12px; color: #d4d4d4; transform-origin: top left;">
    `;

    displayRows.forEach((row, rowIndex) => {
        const isHeader = rowIndex === 0;
        tableHTML += '<tr>';

        row.forEach(cell => {
            const cellContent = escapeHtml(String(cell || ''));
            if (isHeader) {
                tableHTML += `<th style="background: #2d2d2d; border: 1px solid #3a3a3a; padding: 8px 12px; text-align: left; font-weight: 600; color: #fff;">${cellContent}</th>`;
            } else {
                tableHTML += `<td style="border: 1px solid #3a3a3a; padding: 8px 12px;">${cellContent}</td>`;
            }
        });

        tableHTML += '</tr>';
    });

    tableHTML += `
                    </table>
                </div>
            </div>
            <div id="${tableId}-controls" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; background: #252525; border-radius: 0 0 8px 8px; margin-top: -2px;">
                <button class="comfy-btn dm-table-zoom-out-btn" data-table-id="${tableId}" style="padding: 6px 10px; background: #3a3a3a; border: 1px solid #4a4a4a; border-radius: 6px; color: #fff; cursor: pointer;" title="缩小">
                    <i class="pi pi-search-minus"></i>
                </button>
                <span id="${tableId}-zoom" style="color: #aaa; font-size: 11px; min-width: 45px; text-align: center;">100%</span>
                <button class="comfy-btn dm-table-zoom-in-btn" data-table-id="${tableId}" style="padding: 6px 10px; background: #3a3a3a; border: 1px solid #4a4a4a; border-radius: 6px; color: #fff; cursor: pointer;" title="放大">
                    <i class="pi pi-search-plus"></i>
                </button>
                <button class="comfy-btn dm-table-fit-btn" data-table-id="${tableId}" style="padding: 6px 10px; background: #3a3a3a; border: 1px solid #4a4a4a; border-radius: 6px; color: #fff; cursor: pointer;" title="自动缩放">
                    <i class="pi pi-arrows-alt"></i>
                </button>
                <button class="comfy-btn dm-table-fullscreen-btn" data-table-id="${tableId}" style="padding: 6px 10px; background: #3a3a3a; border: 1px solid #4a4a4a; border-radius: 6px; color: #fff; cursor: pointer;" title="全屏">
                    <i class="pi pi-window-maximize"></i>
                </button>
            </div>
        </div>
    `;

    if (isTruncated) {
        tableHTML = tableHTML.replace(`</div>`, `<div style="text-align: center; padding: 10px; color: #888; font-size: 11px;">... (仅显示前 ${maxRows} 行，共 ${rows.length} 行)</div></div>`);
    }

    // 存储缩放状态
    setTimeout(() => setupTableControls(tableId), 0);

    return tableHTML;
}

/**
 * 设置表格控件
 */
function setupTableControls(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;

    let zoom = 100;
    let isFullscreen = false;
    const originalParent = table.closest('.dm-table-wrapper')?.parentElement;
    const wrapper = document.getElementById(`${tableId}-wrapper`);
    const zoomDisplay = document.getElementById(`${tableId}-zoom`);
    const zoomInBtn = document.querySelector(`.dm-table-zoom-in-btn[data-table-id="${tableId}"]`);
    const zoomOutBtn = document.querySelector(`.dm-table-zoom-out-btn[data-table-id="${tableId}"]`);
    const fitBtn = document.querySelector(`.dm-table-fit-btn[data-table-id="${tableId}"]`);
    const fullscreenBtn = document.querySelector(`.dm-table-fullscreen-btn[data-table-id="${tableId}"]`);

    function updateZoom() {
        table.style.transform = `scale(${zoom / 100})`;
        if (zoomDisplay) zoomDisplay.textContent = `${zoom}%`;
        // 调整 wrapper 宽度以适应缩放
        if (wrapper) {
            wrapper.style.width = zoom > 100 ? `${zoom}%` : '100%';
        }
    }

    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            zoom = Math.min(zoom + 25, 300);
            updateZoom();
        });
    }

    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            zoom = Math.max(zoom - 25, 25);
            updateZoom();
        });
    }

    if (fitBtn) {
        fitBtn.addEventListener('click', () => {
            // 自动缩放以适应容器
            const containerWidth = wrapper?.clientWidth || 400;
            const tableWidth = table.scrollWidth;
            const newZoom = Math.min(Math.floor((containerWidth / tableWidth) * 100), 100);
            zoom = Math.max(newZoom, 25);
            updateZoom();
        });
    }

    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            isFullscreen = !isFullscreen;
            const container = wrapper?.parentElement;

            if (isFullscreen) {
                // 全屏模式
                if (wrapper) {
                    wrapper.style.height = 'calc(100vh - 200px)';
                    wrapper.style.maxHeight = 'none';
                }
                fullscreenBtn.innerHTML = '<i class="pi pi-window-minimize"></i>';
                fullscreenBtn.title = '退出全屏';
            } else {
                // 退出全屏
                if (wrapper) {
                    wrapper.style.height = '400px';
                }
                fullscreenBtn.innerHTML = '<i class="pi pi-window-maximize"></i>';
                fullscreenBtn.title = '全屏';
            }
        });
    }
}
