/**
 * utils-table.js - 表格预览工具
 *
 * 提供 CSV/Excel 表格预览功能，支持浮动窗口和面板两种模式
 */

import { escapeHtml } from './utils-format.js';
import { loadScript } from './utils-script.js';
import { parseCSV } from './utils-csv.js';
import { LIMITS } from './core-constants.js';

/**
 * 表格模式类型
 * @typedef {Object} TableMode
 * @property {'floating'|'panel'} type - 模式类型
 * @property {number} [maxRows] - 最大显示行数
 */

/**
 * 默认配置
 */
const DEFAULT_OPTIONS = {
    type: 'floating',
    maxRows: LIMITS.MAX_PREVIEW_ROWS,
    height: null  // null 表示自动高度（浮动窗口）或固定 400px（面板）
};

/**
 * 表格模式配置
 */
const MODE_CONFIG = {
    floating: {
        containerClass: 'dm-table-container',
        controlsClass: 'dm-table-controls',
        height: null,  // 充满容器
        hasFullscreen: false,
        prefix: 'dm-floating-table'
    },
    panel: {
        containerClass: 'dm-panel-table-container',
        controlsClass: 'dm-table-controls-panel',
        height: '400px',
        hasFullscreen: true,
        prefix: 'dm-table'
    }
};

/**
 * 创建表格 HTML
 * @param {Array} rows - 二维数组数据
 * @param {Object} options - 配置选项
 * @returns {string} HTML 字符串
 */
export function createTableHTML(rows, options = {}) {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    const mode = MODE_CONFIG[mergedOptions.type] || MODE_CONFIG.floating;
    const displayRows = rows.slice(0, mergedOptions.maxRows);
    const isTruncated = rows.length > mergedOptions.maxRows;
    const tableId = `${mode.prefix}-${Date.now()}`;

    const heightStyle = mode.height !== null ? `height: ${mode.height};` : 'height: 100%;';
    const containerStyle = `position: relative; flex: 1; overflow: hidden; ${heightStyle}`;

    let tableHTML = `
        <div style="display: flex; flex-direction: column; gap: 0; ${mode.type === 'floating' ? 'height: 100%;' : ''}">
            <div class="${mode.containerClass}" style="${containerStyle}">
                <div id="${tableId}-wrapper" class="dm-table-wrapper"
                     style="width: 100%; overflow: auto; padding: 15px; ${heightStyle}">
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
            ${createTableControls(tableId, mode)}
        </div>
    `;

    if (isTruncated) {
        tableHTML = tableHTML.replace(
            '</div>',
            `<div class="dm-table-truncated" style="text-align: center; padding: 10px; font-size: 11px;">... (仅显示前 ${mergedOptions.maxRows} 行，共 ${rows.length} 行)</div></div>`
        );
    }

    // 延迟设置控件
    setTimeout(() => setupTableControls(tableId, mergedOptions.type), 0);

    return tableHTML;
}

/**
 * 创建表格控件 HTML
 * @param {string} tableId - 表格 ID
 * @param {Object} mode - 模式配置
 * @returns {string} 控件 HTML
 */
function createTableControls(tableId, mode) {
    let controlsHTML = `
        <div id="${tableId}-controls" class="${mode.controlsClass}" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; flex-shrink: 0;">
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
    `;

    if (mode.hasFullscreen) {
        controlsHTML += `
            <button class="comfy-btn dm-table-fullscreen-btn" data-table-id="${tableId}" title="全屏">
                <i class="pi pi-window-maximize"></i>
            </button>
        `;
    }

    controlsHTML += '</div>';
    return controlsHTML;
}

/**
 * 设置表格控件事件
 * @param {string} tableId - 表格 ID
 * @param {string} modeType - 模式类型 ('floating' | 'panel')
 */
export function setupTableControls(tableId, modeType = 'floating') {
    const table = document.getElementById(tableId);
    if (!table) return;

    const mode = MODE_CONFIG[modeType] || MODE_CONFIG.floating;
    let zoom = 100;
    let isFullscreen = false;

    const wrapper = document.getElementById(`${tableId}-wrapper`);
    const zoomDisplay = document.getElementById(`${tableId}-zoom`);
    const zoomInBtn = document.querySelector(`.dm-table-zoom-in-btn[data-table-id="${tableId}"]`);
    const zoomOutBtn = document.querySelector(`.dm-table-zoom-out-btn[data-table-id="${tableId}"]`);
    const fitBtn = document.querySelector(`.dm-table-fit-btn[data-table-id="${tableId}"]`);
    const fullscreenBtn = mode.hasFullscreen
        ? document.querySelector(`.dm-table-fullscreen-btn[data-table-id="${tableId}"]`)
        : null;

    function updateZoom() {
        table.style.transform = `scale(${zoom / 100})`;
        if (zoomDisplay) zoomDisplay.textContent = `${zoom}%`;
        if (wrapper) {
            wrapper.style.width = zoom > 100 ? `${zoom}%` : '100%';
        }
    }

    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            zoom = Math.min(zoom + LIMITS.DEFAULT_ZOOM_STEP, LIMITS.MAX_ZOOM_DISPLAY);
            updateZoom();
        });
    }

    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            zoom = Math.max(zoom - LIMITS.DEFAULT_ZOOM_STEP, LIMITS.MIN_ZOOM_DISPLAY);
            updateZoom();
        });
    }

    if (fitBtn) {
        fitBtn.addEventListener('click', () => {
            const containerWidth = wrapper?.clientWidth || 400;
            const tableWidth = table.scrollWidth;
            const newZoom = Math.min(Math.floor((containerWidth / tableWidth) * 100), 100);
            zoom = Math.max(newZoom, LIMITS.MIN_ZOOM_DISPLAY);
            updateZoom();
        });
    }

    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            isFullscreen = !isFullscreen;

            if (isFullscreen) {
                if (wrapper) {
                    wrapper.style.height = 'calc(100vh - 200px)';
                    wrapper.style.maxHeight = 'none';
                }
                fullscreenBtn.innerHTML = '<i class="pi pi-window-minimize"></i>';
                fullscreenBtn.title = '退出全屏';
            } else {
                if (wrapper) {
                    wrapper.style.height = '400px';
                }
                fullscreenBtn.innerHTML = '<i class="pi pi-window-maximize"></i>';
                fullscreenBtn.title = '全屏';
            }
        });
    }
}

/**
 * 创建空表格预览 HTML
 * @param {string} fileName - 文件名
 * @returns {string} HTML 字符串
 */
export function createEmptyTableHTML(fileName) {
    const displayName = escapeHtml(fileName);
    return `
        <div class="dm-empty-table" style="text-align: center; padding: 40px;">
            <i class="pi pi-table dm-empty-table-icon" style="font-size: 48px; margin-bottom: 15px;"></i>
            <div class="dm-preview-filename" style="font-size: 14px;">${displayName}</div>
            <div class="dm-empty-table-message" style="margin-top: 10px; font-size: 12px;">空表格文件</div>
        </div>
    `;
}

/**
 * 创建不支持格式预览 HTML
 * @param {string} fileName - 文件名
 * @returns {string} HTML 字符串
 */
export function createUnsupportedTableHTML(fileName) {
    const displayName = escapeHtml(fileName);
    return `
        <div class="dm-unsupported-table" style="text-align: center; padding: 40px;">
            <i class="pi pi-table dm-unsupported-table-icon" style="font-size: 64px; margin-bottom: 15px;"></i>
            <div class="dm-preview-filename" style="font-size: 14px;">${displayName}</div>
            <div class="dm-unsupported-message" style="margin-top: 10px; font-size: 12px;">此格式暂不支持预览</div>
        </div>
    `;
}

/**
 * 创建表格预览错误 HTML
 * @param {string} fileName - 文件名
 * @param {string} errorMessage - 错误信息
 * @returns {string} HTML 字符串
 */
export function createTableErrorHTML(fileName, errorMessage) {
    const displayName = escapeHtml(fileName);
    return `
        <div class="dm-preview-error" style="text-align: center; padding: 40px;">
            <i class="pi pi-exclamation-triangle dm-error-icon" style="font-size: 48px;"></i>
            <div class="dm-preview-filename" style="margin-top: 15px;">${displayName}</div>
            <div class="dm-error-title" style="margin-top: 10px; font-size: 12px;">预览加载失败</div>
            <div class="dm-error-detail" style="margin-top: 5px; font-size: 11px;">${escapeHtml(errorMessage)}</div>
        </div>
    `;
}

/**
 * 解析表格文件（CSV/Excel）并返回数据
 * @param {string} fileUrl - 文件 URL
 * @param {string} ext - 文件扩展名
 * @returns {Promise<{rows: Array, fileName: string}>}
 */
export async function parseSpreadsheet(fileUrl, ext) {
    if (ext === '.csv') {
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error('Failed to load CSV');
        const text = await response.text();
        const rows = parseCSV(text);
        return { rows };
    }

    if (ext === '.xls' || ext === '.xlsx') {
        if (typeof XLSX === 'undefined') {
            await loadScript('https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js');
        }

        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error('Failed to load Excel');

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        return { rows };
    }

    throw new Error('Unsupported format');
}
