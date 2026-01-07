/**
 * preview-content.js - 浮动窗口预览内容加载
 */

import { FILE_TYPES } from './core-constants.js';
import { getFileType } from './utils-file-type.js';
import { escapeHtml } from './utils-format.js';
import { openFileExternally } from './floating-actions.js';

/**
 * 加载预览内容
 * @param {HTMLElement} content - 内容容器
 * @param {string} path - 文件路径
 * @param {string} ext - 文件扩展名
 * @param {number} scale - 初始缩放比例（仅用于图像）
 */
export async function loadPreviewContent(content, path, ext, scale = 1) {
    content.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #888;">
            <i class="pi pi-spin pi-spinner" style="font-size: 24px;"></i>
            <div style="margin-top: 10px;">正在加载...</div>
        </div>
    `;

    try {
        let previewHTML = "";

        // 图像预览
        if (FILE_TYPES.image.exts.includes(ext)) {
            const imageUrl = `/dm/preview?path=${encodeURIComponent(path)}`;
            previewHTML = `
                <img src="${imageUrl}"
                     class="dm-zoomable-image"
                     style="max-width: 100%; max-height: 400px;
                            border-radius: 8px; border: 1px solid #3a3a3a;
                            transform-origin: center center;
                            will-change: transform;"
                     onerror="this.parentElement.innerHTML='<div style=\\'color:#e74c3c; padding: 20px;\\'>无法加载图像</div>'"
                     onload="this.style.opacity=1; this.style.display='block';">
            `;
        }
        // 音频预览
        else if (FILE_TYPES.audio.exts.includes(ext)) {
            const audioUrl = `/dm/preview?path=${encodeURIComponent(path)}`;
            const audioId = `dm-preview-audio-${Date.now()}`;
            previewHTML = `
                <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px;">
                    <i class="pi pi-volume-up" style="font-size: 64px; color: #3498db; margin-bottom: 15px;"></i>
                    <div style="color: #fff; margin-bottom: 15px; font-size: 14px;">${path.split(/[/\\]/).pop()}</div>
                    <audio id="${audioId}" preload="metadata" style="width: 100%; max-width: 400px;">
                        <source src="${audioUrl}">
                        您的浏览器不支持音频播放
                    </audio>
                </div>
            `;
        }
        // 视频预览
        else if (FILE_TYPES.video.exts.includes(ext)) {
            const videoUrl = `/dm/preview?path=${encodeURIComponent(path)}`;
            const videoId = `dm-preview-video-${Date.now()}`;
            previewHTML = `
                <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #000;">
                    <video id="${videoId}"
                           preload="metadata"
                           style="width: 100%; height: 100%; max-height: 100%; object-fit: contain; border-radius: 8px;">
                        <source src="${videoUrl}">
                        您的浏览器不支持视频播放
                    </video>
                </div>
            `;
        }
        // 代码预览
        else if (FILE_TYPES.code.exts.includes(ext)) {
            const response = await fetch(`/dm/preview?path=${encodeURIComponent(path)}`);
            if (response.ok) {
                const text = await response.text();
                const highlighted = highlightCode(text, ext);
                previewHTML = `
                    <div style="width: 100%; background: #1e1e1e; padding: 15px;
                                font-family: 'Consolas', 'Monaco', monospace; font-size: 12px; line-height: 1.5;
                                overflow-x: auto; max-height: 400px; overflow-y: auto; border-radius: 0;">
                        <pre style="margin: 0; white-space: pre-wrap; color: #d4d4d4;">${highlighted}</pre>
                    </div>
                `;
            } else {
                throw new Error('Failed to load file');
            }
        }
        // 文档预览
        else if (FILE_TYPES.document.exts.includes(ext)) {
            const docUrl = `/dm/preview?path=${encodeURIComponent(path)}`;
            const isPDF = ext === '.pdf';
            const isMarkdown = ext === '.md';
            const isDocx = ext === '.docx';
            const isDoc = ext === '.doc';

            if (isDoc) {
                // 旧版 Word 文档无法预览，显示提示
                previewHTML = `
                    <div style="text-align: center; padding: 40px; color: #888;">
                        <i class="pi pi-file-word" style="font-size: 64px; color: #2b579a; margin-bottom: 15px;"></i>
                        <div style="margin-top: 15px; color: #fff; font-size: 14px;">${path.split(/[/\\]/).pop()}</div>
                        <div style="margin-top: 10px; color: #888; font-size: 12px;">.doc 格式暂不支持预览</div>
                        <div style="margin-top: 5px; color: #666; font-size: 11px;">请转换为 .docx 或点击"打开"按钮</div>
                    </div>
                `;
            } else if (isDocx) {
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
                            const contentId = `dm-doc-content-${Date.now()}`;
                            previewHTML = `
                                <div id="${contentId}" class="dm-document-content dm-docx-content"
                                     style="width: 100%; height: 100%; background: #1e1e1e;
                                            font-family: 'Segoe UI', Arial, sans-serif;
                                            font-size: 13px;
                                            line-height: 1.6;
                                            overflow: auto;
                                            box-sizing: border-box;
                                            padding: 20px;
                                            color: #d4d4d4;">
                                    <style>
                                        #${contentId} img {
                                            max-width: 100%;
                                            height: auto;
                                            display: inline-block;
                                            margin: 10px 0;
                                        }
                                        #${contentId} p {
                                            word-wrap: break-word;
                                            overflow-wrap: break-word;
                                            margin: 0.5em 0;
                                        }
                                        #${contentId} table {
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
                    previewHTML = `
                        <div style="text-align: center; padding: 40px; color: #888;">
                            <i class="pi pi-exclamation-triangle" style="font-size: 48px; color: #e74c3c;"></i>
                            <div style="margin-top: 15px; color: #fff;">${path.split(/[/\\]/).pop()}</div>
                            <div style="margin-top: 10px; color: #e74c3c; font-size: 12px;">预览加载失败</div>
                            <div style="margin-top: 5px; color: #666; font-size: 11px;">${error.message}</div>
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
                previewHTML = `
                    <div style="width: 100%; height: 100%; border: none;">
                        <iframe src="${docUrl}" style="width: 100%; height: 100%; border: none;"></iframe>
                    </div>
                `;
            } else {
                // txt, rtf 等文本文档
                try {
                    const response = await fetch(docUrl);
                    if (response.ok) {
                        const text = await response.text();
                        const contentId = `dm-doc-content-${Date.now()}`;
                        previewHTML = `
                            <div id="${contentId}" class="dm-document-content"
                                 style="width: 100%; height: 100%; background: #1e1e1e;
                                        font-family: 'Consolas', 'Monaco', monospace;
                                        font-size: 13px;
                                        line-height: 1.6;
                                        overflow: auto;
                                        box-sizing: border-box;
                                        word-break: break-word;
                                        white-space: pre-wrap;
                                        padding: 15px;">
                                ${escapeHtml(text)}
                            </div>
                        `;
                    } else {
                        throw new Error('Failed to load file');
                    }
                } catch {
                    previewHTML = createUnavailablePreviewHTML(path);
                }
            }
        }
        // 其他文件
        else {
            const icon = FILE_TYPES[getFileType({ name: path })]?.icon || FILE_TYPES.unknown.icon;
            const color = FILE_TYPES[getFileType({ name: path })]?.color || FILE_TYPES.unknown.color;
            previewHTML = `
                <div style="text-align: center; padding: 30px;">
                    <i class="pi ${icon}" style="font-size: 64px; color: ${color};"></i>
                    <div style="margin-top: 15px; color: #fff; font-size: 14px;">${path.split(/[/\\]/).pop()}</div>
                    <div style="margin-top: 8px; color: #888; font-size: 12px;">此文件类型不支持预览</div>
                </div>
            `;
        }

        content.innerHTML = previewHTML;

    } catch (error) {
        content.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #e74c3c;">
                <i class="pi pi-exclamation-triangle" style="font-size: 32px;"></i>
                <div style="margin-top: 10px;">加载预览失败</div>
                <div style="margin-top: 5px; color: #888; font-size: 12px;">${error.message}</div>
            </div>
        `;
    }
}

/**
 * 创建不可用预览 HTML
 */
function createUnavailablePreviewHTML(path) {
    return `
        <div style="text-align: center; padding: 30px;">
            <i class="pi pi-file" style="font-size: 64px; color: #e74c3c;"></i>
            <div style="margin-top: 15px; color: #fff;">${path.split(/[/\\]/).pop()}</div>
            <div style="margin-top: 8px; color: #888; font-size: 12px;">无法加载文件</div>
        </div>
    `;
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
    tag: '#569cd6',          // HTML 标签
    attrName: '#9cdcfe',     // 属性名
    attrValue: '#ce9178',    // 属性值
};

/**
 * 通用语法高亮函数
 */
function highlightCode(code, ext) {
    let result = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    switch (ext) {
        case '.json': result = highlightJSON(result); break;
        case '.py': result = highlightPython(result); break;
        case '.js': case '.ts': case '.jsx': case '.tsx': result = highlightJavaScript(result); break;
        case '.html': case '.htm': result = highlightHTML(result); break;
        case '.css': result = highlightCSS(result); break;
        case '.yaml': case '.yml': result = highlightYAML(result); break;
        case '.xml': result = highlightXML(result); break;
        default: result = highlightGeneric(result);
    }
    return result;
}

function highlightJSON(code) {
    return code.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        let color = CODE_COLORS.number;
        if (/^"/.test(match)) color = /:$/.test(match) ? CODE_COLORS.attrName : CODE_COLORS.string;
        else if (/true|false|null/.test(match)) color = CODE_COLORS.boolean;
        return `<span style="color: ${color};">${match}</span>`;
    });
}

function highlightPython(code) {
    const keywords = /\b(def|class|import|from|if|elif|else|while|for|in|try|except|finally|with|as|return|yield|raise|pass|break|continue|and|or|not|is|lambda|True|False|None|async|await)\b/g;
    const decorators = /@[\w.]+/g;
    const strings = /("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
    const comments = /#.*$/gm;
    const numbers = /\b(\d+\.?\d*)\b/g;
    const functions = /\b([a-zA-Z_]\w*)\s*(?=\()/g;
    return code.replace(comments, `<span style="color: ${CODE_COLORS.comment};">$&</span>`)
        .replace(strings, `<span style="color: ${CODE_COLORS.string};">$&</span>`)
        .replace(keywords, `<span style="color: ${CODE_COLORS.keyword};">$&</span>`)
        .replace(decorators, `<span style="color: ${CODE_COLORS.function};">$&</span>`)
        .replace(functions, `<span style="color: ${CODE_COLORS.function};">$1</span>(`)
        .replace(numbers, `<span style="color: ${CODE_COLORS.number};">$1</span>`);
}

function highlightJavaScript(code) {
    const keywords = /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|this|class|extends|import|export|from|async|await|try|catch|finally|throw|null|undefined|true|false|in|instanceof|typeof|void)\b/g;
    const templateStrings = /`(?:[^`\\]|\\.)*`/g;
    const strings = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
    const comments = /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm;
    const numbers = /\b(\d+\.?\d*)\b/g;
    const functions = /\b([a-zA-Z_]\w*)\s*(?=\()/g;
    const arrowFunc = /(&gt;|=>)/g;
    return code.replace(comments, `<span style="color: ${CODE_COLORS.comment};">$&</span>`)
        .replace(templateStrings, `<span style="color: ${CODE_COLORS.string};">$&</span>`)
        .replace(strings, `<span style="color: ${CODE_COLORS.string};">$&</span>`)
        .replace(keywords, `<span style="color: ${CODE_COLORS.keyword};">$&</span>`)
        .replace(functions, `<span style="color: ${CODE_COLORS.function};">$1</span>(`)
        .replace(arrowFunc, `<span style="color: ${CODE_COLORS.keyword};">$&</span>`)
        .replace(numbers, `<span style="color: ${CODE_COLORS.number};">$1</span>`);
}

function highlightHTML(code) {
    return code.replace(/(&lt;\/?)([\w-]+)/g, `$1<span style="color: ${CODE_COLORS.tag};">$2</span>`)
        .replace(/([\w-]+)(=)/g, `<span style="color: ${CODE_COLORS.attrName};">$1</span>$2`)
        .replace(/(=)("(?:[^"\\]|\\.)*")/g, `$1<span style="color: ${CODE_COLORS.attrValue};">$2</span>`);
}

function highlightCSS(code) {
    return code.replace(/(\/\*[\s\S]*?\*\/)/g, `<span style="color: ${CODE_COLORS.comment};">$1</span>`)
        .replace(/^([\s]*)([.#@][\w-]+|[\w]+|::?[\w-]+)/gm, `$1<span style="color: ${CODE_COLORS.class};">$2</span>`)
        .replace(/([\w-]+)(?=\s*:)/g, `<span style="color: ${CODE_COLORS.attrName};">$1</span>`)
        .replace(/:\s*([^;{]+)/g, `: <span style="color: ${CODE_COLORS.attrValue};">$1</span>`);
}

function highlightYAML(code) {
    return code.replace(/^(\s*)([\w-]+)(?=\s*:)/gm, `$1<span style="color: ${CODE_COLORS.attrName};">$2</span>:`)
        .replace(/: ['"]([^'"]+)['"]/g, `: <span style="color: ${CODE_COLORS.string};">'$1'</span>`)
        .replace(/\b(true|false|yes|no|on|off)\b/gi, `<span style="color: ${CODE_COLORS.boolean};">$&</span>`)
        .replace(/\b(\d+\.?\d*)\b/g, `<span style="color: ${CODE_COLORS.number};">$1</span>`);
}

function highlightXML(code) {
    return code.replace(/(&lt;\/?)([\w-:]+)/g, `$1<span style="color: ${CODE_COLORS.tag};">$2</span>`)
        .replace(/([\w-:]+)(=)/g, `<span style="color: ${CODE_COLORS.attrName};">$1</span>$2`)
        .replace(/(=)("(?:[^"\\]|\\.)*")/g, `$1<span style="color: ${CODE_COLORS.attrValue};">$2</span>`);
}

function highlightGeneric(code) {
    const strings = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
    const numbers = /\b(\d+\.?\d*)\b/g;
    const comments = /(#|\/\/).*$/gm;
    return code.replace(comments, `<span style="color: ${CODE_COLORS.comment};">$&</span>`)
        .replace(strings, `<span style="color: ${CODE_COLORS.string};">$&</span>`)
        .replace(numbers, `<span style="color: ${CODE_COLORS.number};">$1</span>`);
}
