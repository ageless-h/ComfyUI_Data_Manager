/**
 * preview-content.js - 浮动窗口预览内容加载
 */

import { FILE_TYPES } from './core-constants.js';
import { getFileType } from './utils-file-type.js';
import { escapeHtml } from './utils-format.js';
import { loadScript } from './utils-script.js';
import { parseCSV } from './utils-csv.js';
import { highlightCode, highlightJSON, highlightPython, highlightJavaScript, highlightHTML, highlightCSS, highlightYAML, highlightXML, highlightGeneric } from './utils-syntax-highlight.js';

/**
 * 加载预览内容
 * @param {HTMLElement} content - 内容容器
 * @param {string} path - 文件路径
 * @param {string} ext - 文件扩展名
 * @param {number} scale - 初始缩放比例（仅用于图像）
 */
export async function loadPreviewContent(content, path, ext, scale = 1) {
    content.innerHTML = `
        <div class="dm-loading" style="text-align: center; padding: 20px;">
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
                     class="dm-zoomable-image dm-preview-image"
                     style="max-width: 100%; max-height: 400px;
                            border-radius: 8px; border: 1px solid;
                            transform-origin: center center;
                            will-change: transform;"
                     onerror="this.parentElement.innerHTML='<div class=\\'dm-error-message\\' style=\\'padding: 20px;\\'>无法加载图像</div>'"
                     onload="this.style.opacity=1; this.style.display='block';">
            `;
        }
        // 音频预览
        else if (FILE_TYPES.audio.exts.includes(ext)) {
            const audioUrl = `/dm/preview?path=${encodeURIComponent(path)}`;
            const audioId = `dm-preview-audio-${Date.now()}`;
            previewHTML = `
                <div class="dm-audio-preview" style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px;">
                    <i class="pi pi-volume-up dm-audio-icon" style="font-size: 64px; margin-bottom: 15px;"></i>
                    <div class="dm-preview-filename" style="margin-bottom: 15px; font-size: 14px;">${path.split(/[/\\]/).pop()}</div>
                    <audio id="${audioId}" preload="metadata" style="width: 100%; max-width: 400px;">
                        <source src="${audioUrl}">
                        您的浏览器不支持音频播放
                    </audio>
                </div>
            `;
        }
        // 视频预览（浏览器支持）
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
        // 外部视频格式预览（需要外部播放器）
        else if (FILE_TYPES.videoExternal && FILE_TYPES.videoExternal.exts.includes(ext)) {
            const extUpper = ext.toUpperCase().replace('.', '');
            previewHTML = `
                <div class="dm-external-video" style="text-align: center; padding: 40px;">
                    <i class="pi pi-video dm-external-video-icon" style="font-size: 64px; margin-bottom: 15px;"></i>
                    <div class="dm-preview-filename" style="font-size: 16px; margin-bottom: 8px;">${path.split(/[\\/]/).pop()}</div>
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
        // 代码预览
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
                    <div class="dm-doc-unsupported" style="text-align: center; padding: 40px;">
                        <i class="pi pi-file-word dm-doc-unsupported-icon" style="font-size: 64px; margin-bottom: 15px;"></i>
                        <div class="dm-preview-filename" style="margin-top: 15px; font-size: 14px;">${path.split(/[/\\]/).pop()}</div>
                        <div class="dm-unsupported-message" style="margin-top: 10px; font-size: 12px;">.doc 格式暂不支持预览</div>
                        <div class="dm-unsupported-sub" style="margin-top: 5px; font-size: 11px;">请转换为 .docx 或点击"打开"按钮</div>
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
                                     style="width: 100%; height: 100%;
                                            font-family: 'Segoe UI', Arial, sans-serif;
                                            font-size: 13px;
                                            line-height: 1.6;
                                            overflow: auto;
                                            box-sizing: border-box;
                                            padding: 20px;">
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
                        <div class="dm-preview-error" style="text-align: center; padding: 40px;">
                            <i class="pi pi-exclamation-triangle dm-error-icon" style="font-size: 48px;"></i>
                            <div class="dm-preview-filename" style="margin-top: 15px;">${path.split(/[/\\]/).pop()}</div>
                            <div class="dm-error-title" style="margin-top: 10px; font-size: 12px;">预览加载失败</div>
                            <div class="dm-error-detail" style="margin-top: 5px; font-size: 11px;">${error.message}</div>
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
                            <div id="${contentId}" class="dm-document-content dm-text-content"
                                 style="width: 100%; height: 100%;
                                        font-family: 'Consolas', 'Monaco', monospace;
                                        font-size: 13px;
                                        line-height: 1.6;
                                        overflow: auto;
                                        box-sizing: border-box;
                                        word-break: break-word;
                                        white-space: pre-wrap;
                                        padding: 15px;">${escapeHtml(text)}</div>
                        `;
                    } else {
                        throw new Error('Failed to load file');
                    }
                } catch {
                    previewHTML = createUnavailablePreviewHTML(path);
                }
            }
        }
        // 表格预览
        else if (FILE_TYPES.spreadsheet.exts.includes(ext)) {
            previewHTML = await createSpreadsheetPreviewHTML(path, ext);
        }
        // 其他文件
        else {
            const icon = FILE_TYPES[getFileType({ name: path })]?.icon || FILE_TYPES.unknown.icon;
            const color = FILE_TYPES[getFileType({ name: path })]?.color || FILE_TYPES.unknown.color;
            previewHTML = `
                <div class="dm-unknown-file" style="text-align: center; padding: 30px;">
                    <i class="pi ${icon} dm-unknown-file-icon" style="font-size: 64px;"></i>
                    <div class="dm-preview-filename" style="margin-top: 15px; font-size: 14px;">${path.split(/[/\\]/).pop()}</div>
                    <div class="dm-unknown-message" style="margin-top: 8px; font-size: 12px;">此文件类型不支持预览</div>
                </div>
            `;
        }

        content.innerHTML = previewHTML;

    } catch (error) {
        content.innerHTML = `
            <div class="dm-preview-error" style="text-align: center; padding: 20px;">
                <i class="pi pi-exclamation-triangle dm-error-icon" style="font-size: 32px;"></i>
                <div style="margin-top: 10px;">加载预览失败</div>
                <div class="dm-error-detail" style="margin-top: 5px; font-size: 12px;">${error.message}</div>
            </div>
        `;
    }
}

/**
 * 创建不可用预览 HTML
 */
function createUnavailablePreviewHTML(path) {
    return `
        <div class="dm-unavailable-preview" style="text-align: center; padding: 30px;">
            <i class="pi pi-file dm-unavailable-icon" style="font-size: 64px;"></i>
            <div class="dm-preview-filename" style="margin-top: 15px;">${path.split(/[/\\]/).pop()}</div>
            <div class="dm-unavailable-message" style="margin-top: 8px; font-size: 12px;">无法加载文件</div>
        </div>
    `;
}


/**
 * 创建表格预览 HTML（CSV/Excel）
 */
async function createSpreadsheetPreviewHTML(path, ext) {
    const fileUrl = `/dm/preview?path=${encodeURIComponent(path)}`;

    try {
        // CSV 文件直接解析
        if (ext === '.csv') {
            const response = await fetch(fileUrl);
            if (!response.ok) throw new Error('Failed to load CSV');

            const text = await response.text();
            const rows = parseCSV(text);

            if (rows.length === 0) {
                return `
                    <div class="dm-empty-table" style="text-align: center; padding: 40px;">
                        <i class="pi pi-table dm-empty-table-icon" style="font-size: 48px; margin-bottom: 15px;"></i>
                        <div class="dm-preview-filename" style="font-size: 14px;">${path.split(/[/\\]/).pop()}</div>
                        <div class="dm-empty-table-message" style="margin-top: 10px; font-size: 12px;">空表格文件</div>
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
                    <div class="dm-empty-table" style="text-align: center; padding: 40px;">
                        <i class="pi pi-table dm-empty-table-icon" style="font-size: 48px; margin-bottom: 15px;"></i>
                        <div class="dm-preview-filename" style="font-size: 14px;">${path.split(/[/\\]/).pop()}</div>
                        <div class="dm-empty-table-message" style="margin-top: 10px; font-size: 12px;">空表格文件</div>
                    </div>
                `;
            }

            return createTableHTML(rows, 100);
        }

        // 其他表格格式不支持预览
        return `
            <div class="dm-unsupported-table" style="text-align: center; padding: 40px;">
                <i class="pi pi-table dm-unsupported-table-icon" style="font-size: 64px; margin-bottom: 15px;"></i>
                <div class="dm-preview-filename" style="font-size: 14px;">${path.split(/[/\\]/).pop()}</div>
                <div class="dm-unsupported-message" style="margin-top: 10px; font-size: 12px;">此格式暂不支持预览</div>
            </div>
        `;

    } catch (error) {
        console.error('[DataManager] Spreadsheet preview error:', error);
        return `
            <div class="dm-preview-error" style="text-align: center; padding: 40px;">
                <i class="pi pi-exclamation-triangle dm-error-icon" style="font-size: 48px;"></i>
                <div class="dm-preview-filename" style="margin-top: 15px;">${path.split(/[/\\]/).pop()}</div>
                <div class="dm-error-title" style="margin-top: 10px; font-size: 12px;">预览加载失败</div>
                <div class="dm-error-detail" style="margin-top: 5px; font-size: 11px;">${error.message}</div>
            </div>
        `;
    }
}

/**
 * 创建表格 HTML
 */
function createTableHTML(rows, maxRows = 100) {
    const displayRows = rows.slice(0, maxRows);
    const isTruncated = rows.length > maxRows;
    const tableId = `dm-floating-table-${Date.now()}`;

    let tableHTML = `
        <div style="display: flex; flex-direction: column; gap: 0; height: 100%;">
            <div class="dm-table-container" style="position: relative; flex: 1; overflow: hidden;">
                <div id="${tableId}-wrapper" class="dm-table-wrapper"
                     style="width: 100%; height: 100%; overflow: auto; padding: 15px;">
                    <table id="${tableId}" class="dm-data-table"
                           style="width: 100%; border-collapse: collapse; font-size: 12px; transform-origin: top left;">
    `;

    displayRows.forEach((row, rowIndex) => {
        const isHeader = rowIndex === 0;
        tableHTML += '<tr>';

        row.forEach(cell => {
            const cellContent = escapeHtml(String(cell || ''));
            if (isHeader) {
                tableHTML += `<th class="dm-table-header">${cellContent}</th>`;
            } else {
                tableHTML += `<td class="dm-table-cell">${cellContent}</td>`;
            }
        });

        tableHTML += '</tr>';
    });

    tableHTML += `
                    </table>
                </div>
            </div>
            <div id="${tableId}-controls" class="dm-table-controls" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; flex-shrink: 0;">
                <button class="comfy-btn dm-table-zoom-out-btn" data-table-id="${tableId}" title="缩小">
                    <i class="pi pi-search-minus"></i>
                </button>
                <span id="${tableId}-zoom" class="dm-table-zoom-display">100%</span>
                <button class="comfy-btn dm-table-zoom-in-btn" data-table-id="${tableId}" title="放大">
                    <i class="pi pi-search-plus"></i>
                </button>
                <button class="comfy-btn dm-table-fit-btn" data-table-id="${tableId}" title="自动缩放">
                    <i class="pi pi-arrows-alt"></i>
                </button>
            </div>
        </div>
    `;

    if (isTruncated) {
        tableHTML = tableHTML.replace(`</div>`, `<div class="dm-table-truncated" style="text-align: center; padding: 10px; font-size: 11px;">... (仅显示前 ${maxRows} 行，共 ${rows.length} 行)</div></div>`);
    }

    // 延迟设置控件
    setTimeout(() => setupFloatingTableControls(tableId), 0);

    return tableHTML;
}

/**
 * 设置浮动窗口表格控件
 */
function setupFloatingTableControls(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;

    let zoom = 100;
    const wrapper = document.getElementById(`${tableId}-wrapper`);
    const zoomDisplay = document.getElementById(`${tableId}-zoom`);
    const zoomInBtn = document.querySelector(`.dm-table-zoom-in-btn[data-table-id="${tableId}"]`);
    const zoomOutBtn = document.querySelector(`.dm-table-zoom-out-btn[data-table-id="${tableId}"]`);
    const fitBtn = document.querySelector(`.dm-table-fit-btn[data-table-id="${tableId}"]`);

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
}
