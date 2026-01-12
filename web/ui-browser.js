/**
 * ui-browser.js - 文件浏览器面板
 */

import { FILE_TYPES } from './core-constants.js';
import { getFileType } from './utils-file-type.js';
import { formatDate, formatSize } from './utils-format.js';

/**
 * 创建文件浏览器面板
 * @param {string} viewMode - 视图模式 ('list' or 'grid')
 * @returns {HTMLElement} 面板元素
 */
export function createBrowserPanel(viewMode = 'list') {
    const panel = document.createElement("div");
    panel.id = "dm-browser-panel";
    panel.className = "dm-browser-panel";
    panel.style.cssText = `
        flex: 1;
        display: flex;
        flex-direction: column;
        border-right: 1px solid;
        overflow: hidden;
    `;

    if (viewMode === 'list') {
        panel.appendChild(createListHeader());
    }

    const content = document.createElement("div");
    content.id = "dm-file-list";
    // 根据视图模式设置不同的容器样式
    if (viewMode === 'grid') {
        content.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 10px;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
            gap: 8px;
            align-content: start;
        `;
    } else {
        content.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 5px 0;
        `;
    }
    content.innerHTML = `
        <div class="dm-browser-loading" style="text-align: center; padding: 40px;">
            <i class="pi pi-spin pi-spinner" style="font-size: 24px;"></i>
        </div>
    `;
    panel.appendChild(content);

    return panel;
}

/**
 * 创建列表视图表头
 * @returns {HTMLElement} 表头元素
 */
function createListHeader() {
    const header = document.createElement("div");
    header.className = "dm-list-header";
    header.style.cssText = `
        display: flex;
        padding: 10px 15px;
        border-bottom: 1px solid;
        font-size: 12px;
        font-weight: 600;
    `;

    const createHeaderCell = (sortKey, label, width) => {
        const cell = document.createElement("div");
        cell.className = "dm-header-cell";
        cell.dataset.sort = sortKey;
        cell.style.cssText = `${width}; cursor: pointer; display: flex; align-items: center; gap: 5px; user-select: none;`;
        cell.innerHTML = `<span>${label}</span><i class="pi pi-sort" style="font-size: 10px; opacity: 0.5;"></i>`;
        cell.onclick = () => {
            import('./ui-actions.js').then(({ toggleSort }) => toggleSort(sortKey));
        };
        return cell;
    };

    header.appendChild(createHeaderCell("name", "名称", "flex: 1;"));
    header.appendChild(createHeaderCell("size", "大小", "flex: 0 0 100px;"));
    header.appendChild(createHeaderCell("modified", "修改日期", "flex: 0 0 150px;"));

    return header;
}

/**
 * 创建列表项 HTML
 * @param {object} file - 文件对象
 * @param {boolean} isParent - 是否是父目录
 * @returns {string} HTML 字符串
 */
export function createFileListItem(file, isParent) {
    const fileType = getFileType(file);
    const icon = FILE_TYPES[fileType]?.icon || FILE_TYPES.unknown.icon;
    const color = FILE_TYPES[fileType]?.color || FILE_TYPES.unknown.color;

    const size = file.is_dir ? "" : formatSize(file.size) || "";
    const modified = file.modified ? formatDate(file.modified) : "";

    return `
        <div class="dm-file-item" data-path="${file.path || file.name}" data-is-dir="${file.is_dir || false}"
             style="display: flex; align-items: center; padding: 10px 15px;
                    border-bottom: 1px solid; cursor: pointer;
                    transition: background 0.2s;">
            <div style="flex: 1; display: flex; align-items: center; gap: 10px; overflow: hidden;">
                <i class="pi ${icon} dm-file-icon" style="color: ${color}; font-size: 16px;"></i>
                <span class="dm-file-name" style="font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${file.name}</span>
            </div>
            <div class="dm-file-size" style="flex: 0 0 100px; font-size: 12px;">${size}</div>
            <div class="dm-file-modified" style="flex: 0 0 150px; font-size: 12px;">${modified}</div>
        </div>
    `;
}

/**
 * 创建网格项 HTML
 * @param {object} file - 文件对象
 * @param {boolean} isParent - 是否是父目录
 * @returns {string} HTML 字符串
 */
export function createFileGridItem(file, isParent) {
    // 父目录使用特殊样式
    if (isParent) {
        return `
            <div class="dm-grid-item dm-grid-item-parent" data-path="${file.path}" data-is-dir="true"
                 data-name=".."
                 style="display: flex; flex-direction: column; align-items: center; justify-content: center;
                        padding: 12px 8px; height: 90px;
                        border-radius: 8px; cursor: pointer;
                        transition: all 0.2s; border: 2px dashed; box-sizing: border-box;">
                <i class="pi pi-folder-open dm-parent-icon" style="font-size: 40px;"></i>
                <span class="dm-parent-text" style="font-size: 11px; text-align: center;
                              overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                              width: 100%; margin-top: 8px;">返回上级</span>
            </div>
        `;
    }

    const fileType = getFileType(file);
    const icon = FILE_TYPES[fileType]?.icon || FILE_TYPES.unknown.icon;
    const color = FILE_TYPES[fileType]?.color || FILE_TYPES.unknown.color;

    return `
        <div class="dm-grid-item" data-path="${file.path || file.name}" data-is-dir="${file.is_dir || false}"
             data-name="${file.name}"
             style="display: flex; flex-direction: column; align-items: center; justify-content: center;
                    padding: 12px 8px; height: 90px;
                    border-radius: 8px; cursor: pointer;
                    transition: all 0.2s; border: 2px solid; box-sizing: border-box;">
            <i class="pi ${icon} dm-grid-icon" style="color: ${color}; font-size: 40px;"></i>
            <span class="dm-grid-filename" style="font-size: 11px; text-align: center;
                          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                          width: 100%; margin-top: 8px;">${file.name}</span>
        </div>
    `;
}
