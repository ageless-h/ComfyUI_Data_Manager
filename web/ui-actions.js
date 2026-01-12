/**
 * ui-actions.js - 文件操作函数
 */

import { listDirectory } from './api-index.js';
import { FileManagerState, saveLastPath } from './core-state.js';
import { updateStatus, showToast, getParentPath } from './utils-helpers.js';
import { createFileListItem, createFileGridItem } from './ui-browser.js';
import { previewFile } from './ui-preview-actions.js';

/**
 * 加载目录
 * @param {string} path - 目录路径
 */
export async function loadDirectory(path) {
    // 检查是否有活动 SSH 连接
    const remoteConn = window._remoteConnectionsState.active;
    if (remoteConn && remoteConn.connection_id) {
        await loadRemoteDirectory(path, remoteConn);
        return;
    }

    updateStatus(`正在加载: ${path}...`);

    try {
        const data = await listDirectory(path);
        FileManagerState.files = data.files || [];
        FileManagerState.currentPath = data.path;

        // 保存最后访问的路径
        saveLastPath(data.path);

        // 保存到历史记录
        if (FileManagerState.historyIndex === -1 ||
            FileManagerState.history[FileManagerState.historyIndex] !== data.path) {
            FileManagerState.history = FileManagerState.history.slice(0, FileManagerState.historyIndex + 1);
            FileManagerState.history.push(data.path);
            FileManagerState.historyIndex = FileManagerState.history.length - 1;
        }

        const pathInput = document.getElementById("dm-path-input");
        if (pathInput) pathInput.value = data.path;

        renderFileListUI();
        updateStatus(`${FileManagerState.files.length} 个项目`);

    } catch (error) {
        console.error("Load directory error:", error);
        updateStatus("加载错误");
        showToast("error", "错误", "网络请求失败");
    }
}

/**
 * 加载远程 SSH 目录
 */
async function loadRemoteDirectory(path, conn) {
    updateStatus(`正在加载远程: ${path}...`);

    try {
        const { sshList } = await import('./api-ssh.js');
        const data = await sshList(conn.connection_id, path || conn.root_path || "/");

        FileManagerState.files = data.files || [];
        FileManagerState.currentPath = data.path || path;

        const pathInput = document.getElementById("dm-path-input");
        if (pathInput) pathInput.value = `[SSH] ${data.path}`;

        renderFileListUI();
        updateStatus(`${FileManagerState.files.length} 个项目 (远程)`);

    } catch (error) {
        console.error("Load remote directory error:", error);
        updateStatus("加载错误");
        showToast("error", "错误", `远程加载失败: ${error.message}`);
    }
}

/**
 * 渲染文件列表 UI
 */
function renderFileListUI() {
    const container = document.getElementById("dm-file-list");
    if (!container) return;

    // 清空当前选择
    FileManagerState.selectedFiles = [];

    // 排序文件
    const sortedFiles = [...FileManagerState.files].sort((a, b) => {
        // 目录优先
        if (a.is_dir && !b.is_dir) return -1;
        if (!a.is_dir && b.is_dir) return 1;

        let comparison = 0;
        switch (FileManagerState.sortBy) {
            case 'name':
                comparison = a.name.localeCompare(b.name);
                break;
            case 'size':
                comparison = (a.size || 0) - (b.size || 0);
                break;
            case 'modified':
                comparison = new Date(a.modified || 0) - new Date(b.modified || 0);
                break;
        }

        return FileManagerState.sortOrder === 'asc' ? comparison : -comparison;
    });

    let html = "";

    // 父目录链接
    if (FileManagerState.currentPath !== "." && FileManagerState.currentPath !== "/") {
        // 根据视图模式选择渲染方式
        if (FileManagerState.viewMode === 'list') {
            html += createFileListItem({
                name: "..",
                is_dir: true,
                path: getParentPath(FileManagerState.currentPath),
                size: 0,
                modified: null
            }, true);
        } else {
            // 网格模式使用特殊的父目录项
            html += createFileGridItem({
                name: "..",
                is_dir: true,
                path: getParentPath(FileManagerState.currentPath)
            }, true);
        }
    }

    // 渲染文件列表
    sortedFiles.forEach(file => {
        html += FileManagerState.viewMode === 'list'
            ? createFileListItem(file, false)
            : createFileGridItem(file, false);
    });

    container.innerHTML = html;

    // 重置滚动位置到顶部
    container.scrollTop = 0;

    // 绑定事件
    container.querySelectorAll(".dm-file-item").forEach(item => {
        item.onclick = () => selectFile(item);
        item.ondblclick = () => openFile(item);
    });

    container.querySelectorAll(".dm-grid-item").forEach(item => {
        item.onclick = () => selectGridItem(item);
        item.ondblclick = () => {
            const path = item.dataset.path;
            const isDir = item.dataset.isDir === "true";
            if (isDir) {
                loadDirectory(path);
            } else {
                previewFile(path);
            }
        };
    });
}

/**
 * 选择列表项
 */
function selectFile(item) {
    document.querySelectorAll(".dm-file-item").forEach(i => {
        i.style.background = "transparent";
    });

    item.style.background = "#3a3a3a";

    const path = item.dataset.path;
    const isDir = item.dataset.is_dir === "true";

    FileManagerState.selectedFiles = [path];

    if (!isDir) {
        previewFile(path);
    } else {
        clearPreviewPanel();
    }
}

/**
 * 选择网格项
 */
function selectGridItem(item) {
    document.querySelectorAll(".dm-grid-item").forEach(i => {
        i.style.borderColor = "transparent";
    });

    item.style.borderColor = "#9b59b6";
    FileManagerState.selectedFiles = [item.dataset.path];

    const path = item.dataset.path;
    const isDir = item.dataset.is_dir === "true";

    if (!isDir) {
        previewFile(path);
    }
}

/**
 * 打开文件
 */
function openFile(item) {
    const path = item.dataset.path;
    const isDir = item.dataset.isDir === "true";

    if (isDir) {
        loadDirectory(path);
    } else {
        previewFile(path);
    }
}

/**
 * 清空预览面板
 */
function clearPreviewPanel() {
    const previewContent = document.getElementById("dm-preview-content");
    if (previewContent) {
        previewContent.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <i class="pi pi-folder" style="font-size: 48px; opacity: 0.5;"></i>
                <div style="margin-top: 15px; font-size: 13px;">双击打开目录</div>
            </div>
        `;
    }
}

/**
 * 切换排序方式
 * @param {string} column - 排序列
 */
export function toggleSort(column) {
    if (FileManagerState.sortBy === column) {
        FileManagerState.sortOrder = FileManagerState.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
        FileManagerState.sortBy = column;
        FileManagerState.sortOrder = 'asc';
    }

    const sortSelect = document.getElementById("dm-sort-select");
    if (sortSelect) {
        sortSelect.value = FileManagerState.sortBy;
    }

    renderFileListUI();
    updateHeaderSortIndicators();
}

/**
 * 更新表头排序指示器
 */
export function updateHeaderSortIndicators() {
    const headers = document.querySelectorAll('.dm-header-cell');
    headers.forEach(header => {
        const icon = header.querySelector('i');
        if (icon) {
            const column = header.dataset.sort;
            if (column === FileManagerState.sortBy) {
                icon.className = FileManagerState.sortOrder === 'asc' ? 'pi pi-sort-amount-up' : 'pi pi-sort-amount-down';
                icon.style.opacity = "1";
            } else {
                icon.className = 'pi pi-sort';
                icon.style.opacity = "0.5";
            }
        }
    });
}

/**
 * 导航到上级目录
 */
export function navigateUp() {
    // 在根目录时不执行操作
    if (FileManagerState.currentPath === "." || FileManagerState.currentPath === "/") {
        return;
    }

    const parentPath = getParentPath(FileManagerState.currentPath);
    if (parentPath !== FileManagerState.currentPath) {
        loadDirectory(parentPath);
    }
}

/**
 * 导航到根目录
 */
export function navigateHome() {
    loadDirectory(".");
}
