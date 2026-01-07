/**
 * extension.js - ComfyUI Data Manager 前端扩展
 *
 * 功能：
 * - 文件管理器 UI 界面
 * - 文件预览（文档/图像/音频/视频）
 * - 文件操作（新增/删除/重命名/复制路径）
 * - 排序和视图切换
 */

import { app } from "../../scripts/app.js";

// 全局状态
let fileManagerWindow = null;
let previewModal = null;
let previewFloatingWindows = [];  // 存储所有浮动预览窗口
let dragOffset = { x: 0, y: 0 };
let isDragging = false;

// 检测 Node 版本
const IS_NODE_V3 = typeof app.ui !== 'undefined' && app.ui.version && app.ui.version.major >= 2;

console.log(`[DataManager] Extension loading, Node V${IS_NODE_V3 ? '3' : '1'} detected`);

// 文件类型配置
const FILE_TYPES = {
    image: { exts: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico', '.tiff', '.tif', '.avif', '.heic', '.heif'], icon: 'pi-image', color: '#e74c3c' },
    video: { exts: ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv'], icon: 'pi-video', color: '#9b59b6' },
    audio: { exts: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a'], icon: 'pi-volume-up', color: '#3498db' },
    document: { exts: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.md'], icon: 'pi-file', color: '#95a5a6' },
    spreadsheet: { exts: ['.xls', '.xlsx', '.csv', '.ods'], icon: 'pi-table', color: '#27ae60' },
    archive: { exts: ['.zip', '.rar', '.7z', '.tar', '.gz'], icon: 'pi-box', color: '#f39c12' },
    code: { exts: ['.py', '.js', '.html', '.css', '.json', '.xml', '.yaml', '.yml', '.cpp', '.c', '.h'], icon: 'pi-code', color: '#1abc9c' },
    folder: { icon: 'pi-folder', color: '#f1c40f' },
    unknown: { icon: 'pi-file', color: '#7f8c8d' }
};

// 文件管理器状态
const FileManagerState = {
    currentPath: '',
    selectedFiles: [],
    viewMode: 'list',  // 'list' or 'grid'
    sortBy: 'name',    // 'name', 'size', 'modified'
    sortOrder: 'asc',  // 'asc' or 'desc'
    files: [],
    history: [],
    historyIndex: -1,
};

// 注册扩展
const extensionConfig = {
    name: "ComfyUI.DataManager",

    commands: [
        {
            id: "data-manager.open",
            label: "Open Data Manager",
            icon: "pi pi-folder-open",
            function: () => openFileManager()
        }
    ],

    keybindings: [
        { combo: { key: "d", ctrl: true, shift: true }, commandId: "data-manager.open" }
    ],

    menuCommands: [
        { path: ["Data Manager"], commands: ["data-manager.open"] }
    ],

    getCustomWidgets() {
        return {
            dmOpenButton: (node, inputName, inputData, app) => {
                const container = document.createElement("div");
                container.style.cssText = `
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 10px;
                    width: 100%;
                `;

                const button = document.createElement("button");
                button.className = "comfy-btn";
                button.innerHTML = '<i class="pi pi-folder-open"></i> 文件管理器';
                button.style.cssText = `
                    padding: 12px 24px;
                    font-size: 14px;
                    font-weight: 500;
                    background: #6c757d;
                    border: none;
                    border-radius: 8px;
                    color: white;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                `;
                button.onmouseover = () => {
                    button.style.background = "#5a6268";
                    button.style.transform = "translateY(-1px)";
                    button.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
                };
                button.onmouseout = () => {
                    button.style.background = "#6c757d";
                    button.style.transform = "translateY(0)";
                    button.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                };
                button.onclick = (e) => {
                    e.stopPropagation();
                    openFileManager();
                };

                container.appendChild(button);
                return { widget: container };
            }
        };
    },

    async setup() {
        console.log("[DataManager] Extension setup completed");
    },

    async nodeCreated(node) {
        if (node.comfyClass === "DataManagerCore") {
            console.log("[DataManager] DataManagerCore node created");

            // V1 API 兼容方式
            if (node.addDOMWidget && !IS_NODE_V3) {
                const container = document.createElement("div");
                container.style.cssText = `
                    display: flex;
                    justify-content: center;
                    padding: 10px;
                `;

                const button = document.createElement("button");
                button.className = "comfy-btn";
                button.innerHTML = '<i class="pi pi-folder-open"></i> 打开文件管理器';
                button.style.cssText = `
                    padding: 12px 24px;
                    font-size: 14px;
                    background: #6c757d;
                    border: none;
                    border-radius: 8px;
                    color: white;
                    cursor: pointer;
                `;
                button.onclick = (e) => {
                    e.stopPropagation();
                    openFileManager();
                };

                container.appendChild(button);
                node.addDOMWidget("dm_open_btn", "dm_open_btn", container, {
                    minWidth: 200,
                    minHeight: 50
                });
            }
        }
    },

    getNodeMenuItems(node) {
        if (node.comfyClass === "DataManagerCore") {
            return [
                {
                    content: "打开文件管理器",
                    callback: () => openFileManager()
                }
            ];
        }
        return [];
    },

    getCanvasMenuItems(canvas) {
        return [
            null,
            {
                content: "Data Manager",
                callback: () => openFileManager()
            }
        ];
    }
};

app.registerExtension(extensionConfig);


// ============================================
// 核心功能函数
// ============================================

function openFileManager() {
    if (fileManagerWindow && fileManagerWindow.parentNode) {
        fileManagerWindow.remove();
        fileManagerWindow = null;
    }

    // 设置初始路径
    if (!FileManagerState.currentPath) {
        FileManagerState.currentPath = ".";
    }

    createFileManagerWindow();
}


function createFileManagerWindow() {
    const window = document.createElement("div");
    window.id = "dm-file-manager";
    window.style.cssText = `
        position: fixed;
        top: 50px;
        left: 50px;
        width: 1200px;
        height: 700px;
        background: #1a1a1a;
        border: 1px solid #3a3a3a;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        z-index: 10000;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    `;

    window.appendChild(createHeader());
    window.appendChild(createToolbar());
    window.appendChild(createMainContent());
    window.appendChild(createStatusBar());

    document.body.appendChild(window);
    fileManagerWindow = window;

    loadDirectory(FileManagerState.currentPath);
    setupWindowDrag(window, window.querySelector('.dm-header'));

    return window;
}


function createHeader() {
    const header = document.createElement("div");
    header.className = "dm-header";
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 20px;
        background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
        border-bottom: 1px solid #3a3a3a;
        cursor: move;
        user-select: none;
    `;

    const title = document.createElement("div");
    title.innerHTML = '<i class="pi pi-folder-open"></i> 文件管理器';
    title.style.cssText = "color: #fff; font-size: 16px; font-weight: 600;";

    const actions = document.createElement("div");
    actions.style.cssText = "display: flex; gap: 8px;";

    actions.appendChild(createHeaderButton("pi-refresh", "刷新", () => loadDirectory(FileManagerState.currentPath)));
    actions.appendChild(createHeaderButton("pi-times", "关闭", () => {
        fileManagerWindow.remove();
        fileManagerWindow = null;
    }));

    header.appendChild(title);
    header.appendChild(actions);

    return header;
}


function createHeaderButton(icon, title, onClick) {
    const button = document.createElement("button");
    button.className = "comfy-btn";
    button.innerHTML = `<i class="pi ${icon}"></i>`;
    button.style.cssText = `
        padding: 6px 10px;
        background: transparent;
        border: none;
        color: #aaa;
        cursor: pointer;
        border-radius: 4px;
    `;
    button.title = title;
    button.onmouseover = () => button.style.background = "#3a3a3a";
    button.onmouseout = () => button.style.background = "transparent";
    button.onclick = onClick;
    return button;
}


function createToolbar() {
    const toolbar = document.createElement("div");
    toolbar.style.cssText = `
        display: flex;
        align-items: center;
        padding: 10px 15px;
        background: #222;
        border-bottom: 1px solid #2a2a2a;
        gap: 10px;
        flex-wrap: wrap;
    `;

    // 导航按钮
    toolbar.appendChild(createToolButton("pi-arrow-left", "上级", () => navigateUp()));
    toolbar.appendChild(createToolButton("pi-home", "根目录", () => navigateHome()));

    // 路径输入框
    const pathInput = document.createElement("input");
    pathInput.id = "dm-path-input";
    pathInput.type = "text";
    pathInput.placeholder = "输入路径...";
    pathInput.style.cssText = `
        flex: 1;
        min-width: 200px;
        padding: 8px 12px;
        background: #2a2a2a;
        border: 1px solid #3a3a3a;
        border-radius: 6px;
        color: #fff;
        font-size: 13px;
    `;
    pathInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            loadDirectory(pathInput.value);
        }
    });
    toolbar.appendChild(pathInput);

    // 排序选择
    const sortSelect = document.createElement("select");
    sortSelect.id = "dm-sort-select";
    sortSelect.style.cssText = `
        padding: 8px 12px;
        background: #2a2a2a;
        border: 1px solid #3a3a3a;
        border-radius: 6px;
        color: #fff;
        font-size: 13px;
        cursor: pointer;
    `;
    const sortOptions = [
        { value: 'name', label: '按名称' },
        { value: 'size', label: '按大小' },
        { value: 'modified', label: '按日期' }
    ];
    sortOptions.forEach(opt => {
        const option = document.createElement("option");
        option.value = opt.value;
        option.textContent = opt.label;
        sortSelect.appendChild(option);
    });
    sortSelect.onchange = (e) => {
        FileManagerState.sortBy = e.target.value;
        renderFileList();
    };
    toolbar.appendChild(sortSelect);

    // 视图切换按钮
    const viewToggle = document.createElement("button");
    viewToggle.className = "comfy-btn";
    viewToggle.id = "dm-view-toggle";
    viewToggle.innerHTML = '<i class="pi pi-bars"></i>';
    viewToggle.style.cssText = "padding: 8px 12px;";
    viewToggle.title = "切换视图";
    viewToggle.onclick = () => {
        FileManagerState.viewMode = FileManagerState.viewMode === "list" ? "grid" : "list";
        const icon = viewToggle.querySelector("i");
        icon.className = FileManagerState.viewMode === "list" ? "pi pi-th-large" : "pi pi-bars";
        renderFileList();
    };
    toolbar.appendChild(viewToggle);

    // 操作按钮组
    const actionGroup = document.createElement("div");
    actionGroup.style.cssText = "display: flex; gap: 5px; margin-left: auto;";
    actionGroup.appendChild(createToolButton("pi-plus", "新建", () => showNewFileDialog()));
    actionGroup.appendChild(createToolButton("pi-copy", "复制路径", () => copySelectedPaths()));
    actionGroup.appendChild(createToolButton("pi-trash", "删除", () => deleteSelectedFiles()));
    toolbar.appendChild(actionGroup);

    return toolbar;
}


function createToolButton(icon, title, onClick) {
    const button = document.createElement("button");
    button.className = "comfy-btn";
    button.innerHTML = `<i class="pi ${icon}"></i>`;
    button.style.cssText = "padding: 8px 12px;";
    button.title = title;
    button.onclick = onClick;
    return button;
}


function createMainContent() {
    const mainContent = document.createElement("div");
    mainContent.style.cssText = "flex: 1; display: flex; overflow: hidden;";

    const browserPanel = createBrowserPanel();
    mainContent.appendChild(browserPanel);

    const previewPanel = createPreviewPanel();
    mainContent.appendChild(previewPanel);

    return mainContent;
}


function createBrowserPanel() {
    const panel = document.createElement("div");
    panel.id = "dm-browser-panel";
    panel.style.cssText = `
        flex: 1;
        display: flex;
        flex-direction: column;
        border-right: 1px solid #2a2a2a;
        overflow: hidden;
    `;

    if (FileManagerState.viewMode === 'list') {
        const header = document.createElement("div");
        header.style.cssText = `
            display: flex;
            padding: 10px 15px;
            background: #252525;
            border-bottom: 1px solid #2a2a2a;
            font-size: 12px;
            font-weight: 600;
            color: #888;
        `;
        header.innerHTML = `
            <div style="flex: 0 0 40px; text-align: center;"><input type="checkbox" id="dm-select-all" onclick="event.stopPropagation(); toggleSelectAll(this)"></div>
            <div style="flex: 1;">名称</div>
            <div style="flex: 0 0 100px;">大小</div>
            <div style="flex: 0 0 150px;">修改日期</div>
        `;
        panel.appendChild(header);
    }

    const content = document.createElement("div");
    content.id = "dm-file-list";
    content.style.cssText = `
        flex: 1;
        overflow-y: auto;
        padding: 5px 0;
    `;
    content.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
            <i class="pi pi-spin pi-spinner" style="font-size: 24px;"></i>
        </div>
    `;
    panel.appendChild(content);

    return panel;
}


function createPreviewPanel() {
    const panel = document.createElement("div");
    panel.id = "dm-preview-panel";
    panel.style.cssText = `
        flex: 0 0 400px;
        display: flex;
        flex-direction: column;
        background: #1f1f1f;
        overflow: hidden;
    `;

    const header = document.createElement("div");
    header.style.cssText = `
        padding: 15px;
        background: #252525;
        border-bottom: 1px solid #2a2a2a;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
    `;
    header.innerHTML = `
        <h3 style="margin: 0; color: #fff; font-size: 14px;">
            <i class="pi pi-eye"></i> 预览
        </h3>
        <div style="display: flex; gap: 5px;">
            <button id="dm-open-floating-preview-btn" class="comfy-btn" style="display: none; padding: 6px 12px; font-size: 12px;">
                <i class="pi pi-window-maximize"></i> 浮窗
            </button>
            <button id="dm-open-preview-btn" class="comfy-btn" style="display: none; padding: 6px 12px; font-size: 12px;">
                <i class="pi pi-external-link"></i> 打开
            </button>
        </div>
    `;
    panel.appendChild(header);

    const content = document.createElement("div");
    content.id = "dm-preview-content";
    content.style.cssText = `
        flex: 1;
        overflow-y: auto;
        padding: 15px;
        display: flex;
        flex-direction: column;
        gap: 15px;
    `;
    content.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
            <i class="pi pi-file" style="font-size: 48px; opacity: 0.5;"></i>
            <div style="margin-top: 15px; font-size: 13px;">选择文件以预览</div>
        </div>
    `;
    panel.appendChild(content);

    // 文件信息区域
    const infoSection = document.createElement("div");
    infoSection.id = "dm-file-info";
    infoSection.style.cssText = `
        padding: 15px;
        background: #252525;
        border-top: 1px solid #2a2a2a;
        font-size: 12px;
        color: #888;
    `;
    infoSection.innerHTML = '<div style="text-align: center;">未选择文件</div>';
    panel.appendChild(infoSection);

    return panel;
}


function createStatusBar() {
    const bar = document.createElement("div");
    bar.id = "dm-status-bar";
    bar.style.cssText = `
        padding: 8px 15px;
        background: #222;
        border-top: 1px solid #2a2a2a;
        font-size: 11px;
        color: #888;
        display: flex;
        justify-content: space-between;
    `;
    bar.textContent = "就绪";
    return bar;
}


// ============================================
// 文件操作函数
// ============================================

async function loadDirectory(path) {
    updateStatus(`正在加载: ${path}...`);

    try {
        const response = await fetch("/dm/list", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: path })
        });

        if (response && response.ok) {
            const data = await response.json();
            FileManagerState.files = data.files || [];
            FileManagerState.currentPath = data.path;

            // 保存到历史记录
            if (FileManagerState.historyIndex === -1 ||
                FileManagerState.history[FileManagerState.historyIndex] !== path) {
                FileManagerState.history = FileManagerState.history.slice(0, FileManagerState.historyIndex + 1);
                FileManagerState.history.push(path);
                FileManagerState.historyIndex = FileManagerState.history.length - 1;
            }

            const pathInput = document.getElementById("dm-path-input");
            if (pathInput) pathInput.value = path;

            renderFileList();
            updateStatus(`${FileManagerState.files.length} 个项目`);

        } else {
            updateStatus("加载失败");
            showToast("error", "错误", "无法加载目录");
        }

    } catch (error) {
        console.error("Load directory error:", error);
        updateStatus("加载错误");
        showToast("error", "错误", "网络请求失败");
    }
}


function renderFileList() {
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

    if (FileManagerState.viewMode === 'list') {
        renderListView(container, sortedFiles);
    } else {
        renderGridView(container, sortedFiles);
    }
}


function renderListView(container, files) {
    let html = "";

    // 父目录链接
    if (FileManagerState.currentPath !== "." && FileManagerState.currentPath !== "/") {
        html += createFileListItem({
            name: "..",
            is_dir: true,
            path: getParentPath(FileManagerState.currentPath),
            size: 0,
            modified: null
        }, true);
    }

    files.forEach(file => {
        html += createFileListItem(file, false);
    });

    container.innerHTML = html;

    // 绑定事件
    container.querySelectorAll(".dm-file-item").forEach(item => {
        item.onclick = () => selectFile(item);
        item.ondblclick = () => openFile(item);
    });

    // 更新表头
    const header = container.parentElement?.querySelector('.dm-header');
    if (header) {
        const checkbox = header.querySelector('#dm-select-all');
        if (checkbox) checkbox.checked = false;
    }
}


function renderGridView(container, files) {
    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; padding: 10px;">';

    // 父目录链接
    if (FileManagerState.currentPath !== "." && FileManagerState.currentPath !== "/") {
        html += createFileGridItem({
            name: "..",
            is_dir: true,
            path: getParentPath(FileManagerState.currentPath)
        }, true);
    }

    files.forEach(file => {
        html += createFileGridItem(file, false);
    });

    html += '</div>';
    container.innerHTML = html;

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


function createFileListItem(file, isParent) {
    const fileType = getFileType(file);
    const icon = FILE_TYPES[fileType]?.icon || FILE_TYPES.unknown.icon;
    const color = FILE_TYPES[fileType]?.color || FILE_TYPES.unknown.color;

    const size = file.is_dir ? "" : formatSize(file.size);
    const modified = file.modified ? formatDate(file.modified) : "";

    return `
        <div class="dm-file-item" data-path="${file.path || file.name}" data-is-dir="${file.is_dir || false}"
             style="display: flex; align-items: center; padding: 10px 15px;
                    border-bottom: 1px solid #2a2a2a; cursor: pointer;
                    transition: background 0.2s;">
            <div style="flex: 0 0 40px; text-align: center;">
                <input type="checkbox" class="dm-file-checkbox" onclick="event.stopPropagation();">
            </div>
            <div style="flex: 1; display: flex; align-items: center; gap: 10px; overflow: hidden;">
                <i class="pi ${icon}" style="color: ${color}; font-size: 16px;"></i>
                <span style="color: #fff; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${file.name}</span>
            </div>
            <div style="flex: 0 0 100px; color: #888; font-size: 12px;">${size}</div>
            <div style="flex: 0 0 150px; color: #888; font-size: 12px;">${modified}</div>
        </div>
    `;
}


function createFileGridItem(file, isParent) {
    const fileType = getFileType(file);
    const icon = FILE_TYPES[fileType]?.icon || FILE_TYPES.unknown.icon;
    const color = FILE_TYPES[fileType]?.color || FILE_TYPES.unknown.color;

    return `
        <div class="dm-grid-item" data-path="${file.path || file.name}" data-is-dir="${file.is_dir || false}"
             data-name="${file.name}"
             style="display: flex; flex-direction: column; align-items: center; padding: 15px;
                    background: #252525; border-radius: 8px; cursor: pointer;
                    transition: all 0.2s; border: 2px solid transparent;">
            <i class="pi ${icon}" style="color: ${color}; font-size: 48px; margin-bottom: 10px;"></i>
            <span style="color: #fff; font-size: 12px; text-align: center;
                          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; width: 100%;">${file.name}</span>
        </div>
    `;
}


function selectFile(item) {
    // 清除其他选择
    document.querySelectorAll(".dm-file-item").forEach(i => {
        i.style.background = "transparent";
        const cb = i.querySelector('.dm-file-checkbox');
        if (cb) cb.checked = false;
    });

    item.style.background = "#3a3a3a";
    const cb = item.querySelector('.dm-file-checkbox');
    if (cb) cb.checked = true;

    const path = item.dataset.path;
    const isDir = item.dataset.is_dir === "true";

    FileManagerState.selectedFiles = [path];

    // 显示操作按钮
    const actionButtons = document.getElementById("dm-file-actions");
    if (actionButtons) actionButtons.style.display = "grid";

    if (!isDir) {
        previewFile(path);
    } else {
        // 目录不预览，清空预览面板
        const previewContent = document.getElementById("dm-preview-content");
        if (previewContent) {
            previewContent.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i class="pi pi-folder" style="font-size: 48px; opacity: 0.5;"></i>
                    <div style="margin-top: 15px; font-size: 13px;">双击打开目录</div>
                </div>
            `;
        }
        updateFileInfo(path, true);
    }
}


function selectGridItem(item) {
    // 清除其他选择
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
    updateFileInfo(path, isDir);
}


function openFile(item) {
    const path = item.dataset.path;
    const isDir = item.dataset.isDir === "true";

    if (isDir) {
        loadDirectory(path);
    } else {
        previewFile(path);
    }
}


async function previewFile(path) {
    const content = document.getElementById("dm-preview-content");
    const infoSection = document.getElementById("dm-file-info");
    const openBtn = document.getElementById("dm-open-preview-btn");
    const floatingBtn = document.getElementById("dm-open-floating-preview-btn");

    if (!content) return;

    content.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <i class="pi pi-spin pi-spinner"></i>
        </div>
    `;

    const ext = '.' + (path.split('.').pop().toLowerCase());
    const fileName = path.split(/[/\\]/).pop();

    try {
        let previewHTML = "";
        let canOpenExternally = false;

        // 图像预览 - 使用后端 API
        if (FILE_TYPES.image.exts.includes(ext)) {
            const imageUrl = `/dm/preview?path=${encodeURIComponent(path)}`;
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
        // 音频预览 - 使用后端 API
        else if (FILE_TYPES.audio.exts.includes(ext)) {
            const audioUrl = `/dm/preview?path=${encodeURIComponent(path)}`;
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
        // 视频预览 - 使用后端 API
        else if (FILE_TYPES.video.exts.includes(ext)) {
            const videoUrl = `/dm/preview?path=${encodeURIComponent(path)}`;
            previewHTML = `
                <div style="text-align: center;">
                    <video controls style="width: 100%; max-height: 300px; border-radius: 8px;">
                        <source src="${videoUrl}" type="video/mp4">
                    </video>
                </div>
            `;
            canOpenExternally = true;
        }
        // 代码预览
        else if (FILE_TYPES.code.exts.includes(ext)) {
            try {
                const response = await fetch(`/dm/preview?path=${encodeURIComponent(path)}`);
                if (response.ok) {
                    const text = await response.text();
                    previewHTML = `
                        <div style="background: #1e1e1e; padding: 15px; border-radius: 8px;
                                    font-family: 'Consolas', 'Monaco', monospace; font-size: 12px;
                                    overflow-x: auto; max-height: 400px; overflow-y: auto;">
                            <pre style="margin: 0; color: #d4d4d4;">${escapeHtml(text.substring(0, 5000))}${text.length > 5000 ? '\n\n... (文件过大，仅显示前 5000 字符)' : ''}</pre>
                        </div>
                    `;
                } else {
                    throw new Error('Failed to load file');
                }
            } catch {
                previewHTML = createUnavailablePreview(fileName, 'code');
            }
        }
        // 文档预览
        else if (FILE_TYPES.document.exts.includes(ext)) {
            previewHTML = createUnavailablePreview(fileName, 'document');
            canOpenExternally = true;
        }
        // 其他文件
        else {
            const fileType = getFileType({ name: path });
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

        // 更新浮动预览按钮
        if (floatingBtn) {
            floatingBtn.style.display = "block";
            floatingBtn.onclick = () => openFloatingPreview(path, fileName);
        }

        // 更新打开按钮
        if (openBtn) {
            if (canOpenExternally) {
                openBtn.style.display = "block";
                openBtn.onclick = () => openFileExternally(path);
            } else {
                openBtn.style.display = "none";
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


function createUnavailablePreview(fileName, type) {
    const icons = {
        document: 'pi-file-pdf',
        code: 'pi-code',
        default: 'pi-file'
    };
    const icon = icons[type] || icons.default;

    return `
        <div style="text-align: center; padding: 30px;">
            <i class="pi ${icon}" style="font-size: 64px; color: #e74c3c;"></i>
            <div style="margin-top: 15px; color: #fff; font-size: 14px;">${fileName}</div>
            <div style="margin-top: 8px; color: #888; font-size: 12px;">双击"打开"按钮查看文件</div>
        </div>
    `;
}


function updateFileInfo(path, isDir = false) {
    const infoSection = document.getElementById("dm-file-info");
    if (!infoSection) return;

    const fileName = path.split(/[/\\]/).pop();
    const ext = '.' + path.split('.').pop().toLowerCase();
    const fileType = getFileType({ name: path });

    try {
        const stat = require('fs').statSync(path);
        const info = `
            <div style="font-weight: 600; color: #fff; margin-bottom: 10px;">${fileName}</div>
            <div style="display: grid; grid-template-columns: auto 1fr; gap: 5px; font-size: 11px;">
                <span style="color: #666;">类型:</span>
                <span>${isDir ? '文件夹' : fileType}</span>
                <span style="color: #666;">大小:</span>
                <span>${isDir ? '-' : formatSize(stat.size)}</span>
                <span style="color: #666;">修改:</span>
                <span>${formatDate(stat.mtime.toISOString())}</span>
                <span style="color: #666;">路径:</span>
                <span style="word-break: break-all; color: #888;">${path}</span>
            </div>
        `;
        infoSection.innerHTML = info;
    } catch {
        infoSection.innerHTML = `
            <div style="font-weight: 600; color: #fff; margin-bottom: 10px;">${fileName}</div>
            <div style="font-size: 11px; color: #888;">路径: ${path}</div>
        `;
    }
}


function openFileExternally(path) {
    const { shell } = require('electron');
    shell.openPath(path).catch(err => {
        showToast("error", "错误", `无法打开文件: ${err.message}`);
    });
}


// ============================================
// 文件操作功能
// ============================================

function toggleSelectAll(checkbox) {
    const isChecked = checkbox.checked;
    document.querySelectorAll(".dm-file-checkbox").forEach(cb => {
        cb.checked = isChecked;
    });

    FileManagerState.selectedFiles = [];
    if (isChecked) {
        document.querySelectorAll(".dm-file-item").forEach(item => {
            FileManagerState.selectedFiles.push(item.dataset.path);
            item.style.background = "#3a3a3a";
        });
    } else {
        document.querySelectorAll(".dm-file-item").forEach(item => {
            item.style.background = "transparent";
        });
    }
}


function showNewFileDialog() {
    const modal = document.createElement("div");
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.7); z-index: 10001;
        display: flex; align-items: center; justify-content: center;
    `;

    const dialog = document.createElement("div");
    dialog.style.cssText = `
        background: #252525; border-radius: 12px; padding: 24px;
        width: 400px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    `;

    dialog.innerHTML = `
        <h3 style="margin: 0 0 20px 0; color: #fff;">新建</h3>
        <div style="display: flex; gap: 10px; margin-bottom: 20px;">
            <button id="dm-new-file-btn" class="comfy-btn"
                    style="flex: 1; padding: 15px; background: #3a3a3a; border: 1px solid #4a4a4a;
                           border-radius: 8px; color: #fff; cursor: pointer;">
                <i class="pi pi-file" style="display: block; font-size: 24px; margin-bottom: 8px;"></i>
                文件
            </button>
            <button id="dm-new-folder-btn" class="comfy-btn"
                    style="flex: 1; padding: 15px; background: #3a3a3a; border: 1px solid #4a4a4a;
                           border-radius: 8px; color: #fff; cursor: pointer;">
                <i class="pi pi-folder" style="display: block; font-size: 24px; margin-bottom: 8px;"></i>
                文件夹
            </button>
        </div>
        <button class="comfy-btn" id="dm-cancel-new-btn"
                style="width: 100%; padding: 10px; background: transparent;
                       border: 1px solid #3a3a3a; border-radius: 6px; color: #888; cursor: pointer;">
            取消
        </button>
    `;

    modal.appendChild(dialog);
    document.body.appendChild(modal);

    // 绑定事件
    dialog.querySelector('#dm-new-file-btn').onclick = () => {
        modal.remove();
        createNewFile();
    };
    dialog.querySelector('#dm-new-folder-btn').onclick = () => {
        modal.remove();
        createNewFolder();
    };
    dialog.querySelector('#dm-cancel-new-btn').onclick = () => modal.remove();
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
}


function createNewFile() {
    const name = prompt("输入文件名:", "new_file.txt");
    if (name) {
        const path = require('path').join(FileManagerState.currentPath, name);
        require('fs').writeFileSync(path, '');
        loadDirectory(FileManagerState.currentPath);
        showToast("success", "成功", `文件已创建: ${name}`);
    }
}


function createNewFolder() {
    const name = prompt("输入文件夹名称:", "新建文件夹");
    if (name) {
        const path = require('path').join(FileManagerState.currentPath, name);
        require('fs').mkdirSync(path);
        loadDirectory(FileManagerState.currentPath);
        showToast("success", "成功", `文件夹已创建: ${name}`);
    }
}


function deleteSelectedFiles() {
    if (FileManagerState.selectedFiles.length === 0) {
        showToast("info", "提示", "请先选择要删除的文件");
        return;
    }

    const message = `确定要删除 ${FileManagerState.selectedFiles.length} 个项目吗？`;
    if (!confirm(message)) return;

    const { shell } = require('electron');
    FileManagerState.selectedFiles.forEach(path => {
        try {
            const stat = require('fs').statSync(path);
            if (stat.isDirectory()) {
                shell.trashItem(path);
            } else {
                require('fs').unlinkSync(path);
            }
        } catch (err) {
            console.error(`删除失败: ${path}`, err);
        }
    });

    loadDirectory(FileManagerState.currentPath);
    showToast("success", "成功", `已删除 ${FileManagerState.selectedFiles.length} 个项目`);
    FileManagerState.selectedFiles = [];
}


function copySelectedPaths() {
    if (FileManagerState.selectedFiles.length === 0) {
        showToast("info", "提示", "请先选择文件");
        return;
    }

    const { clipboard } = require('electron');
    clipboard.writeText(FileManagerState.selectedFiles.join('\n'));
    showToast("success", "成功", `已复制 ${FileManagerState.selectedFiles.length} 个路径`);
}


function renameFile(path) {
    const oldName = require('path').basename(path);
    const newName = prompt("重命名:", oldName);
    if (newName && newName !== oldName) {
        const newPath = require('path').join(require('path').dirname(path), newName);
        require('fs').renameSync(path, newPath);
        loadDirectory(FileManagerState.currentPath);
        showToast("success", "成功", "文件已重命名");
    }
}


// ============================================
// 导航功能
// ============================================

function navigateUp() {
    const parentPath = getParentPath(FileManagerState.currentPath);
    if (parentPath !== FileManagerState.currentPath) {
        loadDirectory(parentPath);
    }
}


function navigateHome() {
    loadDirectory(".");
}


function getParentPath(path) {
    const normalized = path.replace(/\\/g, "/");
    const lastSlash = normalized.lastIndexOf("/");
    if (lastSlash <= 0) return ".";
    return normalized.substring(0, lastSlash);
}


// ============================================
// 工具函数
// ============================================

function getFileType(file) {
    if (file.is_dir) return "folder";
    const ext = "." + (file.name || file.path || "").split(".").pop().toLowerCase();
    for (const [type, config] of Object.entries(FILE_TYPES)) {
        if (config.exts && config.exts.includes(ext)) return type;
    }
    return "unknown";
}


function formatSize(bytes) {
    if (!bytes) return "";
    for (const unit of ["B", "KB", "MB", "GB"]) {
        if (bytes < 1024) return bytes.toFixed(1) + " " + unit;
        bytes /= 1024;
    }
    return bytes.toFixed(1) + " TB";
}


function formatDate(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}


function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


function updateStatus(text) {
    const statusBar = document.getElementById("dm-status-bar");
    if (statusBar) {
        statusBar.textContent = text;
    }
}


function setupWindowDrag(window, header) {
    // 每个窗口独立的拖动状态
    let isDraggingWindow = false;
    let offset = { x: 0, y: 0 };

    // 移除旧的监听器（如果存在）
    const mouseMoveHandler = (e) => {
        if (!isDraggingWindow || !window) return;
        const x = e.clientX - offset.x;
        const y = e.clientY - offset.y;
        window.style.left = Math.max(0, x) + "px";
        window.style.top = Math.max(0, y) + "px";
    };

    const mouseUpHandler = () => {
        isDraggingWindow = false;
        if (window) window.style.transition = "";
    };

    // mousedown 事件添加到 header，并阻止冒泡
    header.addEventListener("mousedown", (e) => {
        if (e.target.tagName === "BUTTON" || e.target.tagName === "I") return;
        e.stopPropagation();  // 阻止事件冒泡到其他窗口
        isDraggingWindow = true;
        const rect = window.getBoundingClientRect();
        offset.x = e.clientX - rect.left;
        offset.y = e.clientY - rect.top;
        window.style.transition = "none";
    });

    // mousemove 和 mouseup 添加到 document，但使用独立的状态
    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
}


function showToast(severity, summary, detail) {
    if (app.extensionManager?.toast) {
        app.extensionManager.toast.add({
            severity,
            summary,
            detail,
            life: 3000
        });
    } else {
        console.log(`[${severity.toUpperCase()}] ${summary}: ${detail}`);
    }
}


// ============================================
// 二级浮动预览窗口
// ============================================

/**
 * 打开浮动预览窗口
 * @param {string} path - 文件路径
 * @param {string} fileName - 文件名
 */
function openFloatingPreview(path, fileName) {
    // 检查是否已经打开了该文件的预览窗口
    const existingWindow = previewFloatingWindows.find(w => w.path === path);
    if (existingWindow) {
        existingWindow.window.focus();
        return;
    }

    const ext = '.' + path.split('.').pop().toLowerCase();
    const fileType = getFileType({ name: path });
    const fileConfig = FILE_TYPES[fileType] || FILE_TYPES.unknown;
    const isImage = FILE_TYPES.image.exts.includes(ext);

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

    const title = document.createElement("div");
    title.style.cssText = "display: flex; align-items: center; gap: 8px; color: #fff; font-size: 14px; font-weight: 600;";
    title.innerHTML = `
        <i class="pi ${fileConfig.icon}" style="color: ${fileConfig.color};"></i>
        <span style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${fileName}</span>
    `;

    const actions = document.createElement("div");
    actions.style.cssText = "display: flex; gap: 8px;";

    // 全屏按钮（仅图像显示）
    if (isImage) {
        const fullscreenBtn = document.createElement("button");
        fullscreenBtn.className = "comfy-btn";
        fullscreenBtn.innerHTML = '<i class="pi pi-window-maximize"></i>';
        fullscreenBtn.style.cssText = "padding: 6px 10px; background: transparent; border: none; color: #aaa; cursor: pointer; border-radius: 4px;";
        fullscreenBtn.title = "全屏";
        fullscreenBtn.onmouseover = () => fullscreenBtn.style.background = "#3a3a3a";
        fullscreenBtn.onmouseout = () => fullscreenBtn.style.background = "transparent";
        fullscreenBtn.onclick = () => toggleFullscreen(previewWindow);
        actions.appendChild(fullscreenBtn);
    }

    // 关闭按钮
    const closeBtn = document.createElement("button");
    closeBtn.className = "comfy-btn";
    closeBtn.innerHTML = '<i class="pi pi-times"></i>';
    closeBtn.style.cssText = "padding: 6px 10px; background: transparent; border: none; color: #aaa; cursor: pointer; border-radius: 4px;";
    closeBtn.title = "关闭";
    closeBtn.onmouseover = () => closeBtn.style.background = "#3a3a3a";
    closeBtn.onmouseout = () => closeBtn.style.background = "transparent";
    closeBtn.onclick = () => closeFloatingPreview(previewWindow);

    actions.appendChild(closeBtn);
    header.appendChild(title);
    header.appendChild(actions);

    // 创建内容区域
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

    // 创建可缩放的图像容器
    let imageScale = 1;
    let imageTranslateX = 0;
    let imageTranslateY = 0;
    let isDraggingImage = false;
    let dragStart = { x: 0, y: 0 };

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

    // 根据文件类型显示预览
    loadPreviewContent(imageContainer, path, ext, imageScale);

    // 组装内容区域
    content.appendChild(imageContainer);

    // 创建工具栏（可选操作）- macOS 风格三栏布局
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

    // 左侧：缩放控制（仅图像显示）
    const toolbarLeft = document.createElement("div");
    toolbarLeft.className = "dm-toolbar-left";
    toolbarLeft.style.cssText = "display: flex; gap: 8px; align-items: center; flex-shrink: 0;";

    // 中间：文件路径
    const toolbarCenter = document.createElement("div");
    toolbarCenter.className = "dm-toolbar-center";
    toolbarCenter.style.cssText = "flex: 1; text-align: center; overflow: hidden; padding: 0 20px;";

    // 右侧：操作按钮
    const toolbarRight = document.createElement("div");
    toolbarRight.className = "dm-toolbar-right";
    toolbarRight.style.cssText = "display: flex; gap: 8px; align-items: center; flex-shrink: 0;";

    // 图像缩放控制（仅对图像显示）- 放在左侧
    if (isImage) {
        // 分隔符
        const separator1 = document.createElement("div");
        separator1.style.cssText = "width: 1px; height: 16px; background: #3a3a3a; margin: 0 4px;";
        toolbarLeft.appendChild(separator1);

        // 缩小按钮
        const zoomOutBtn = createToolbarButton("pi-search-minus", "缩小", () => {
            imageScale = Math.max(0.1, imageScale - 0.1);
            updateImageScale(imageContainer, imageScale, imageTranslateX, imageTranslateY);
            updateZoomDisplay();
        });
        toolbarLeft.appendChild(zoomOutBtn);

        // 缩放比例显示
        const zoomDisplay = document.createElement("span");
        zoomDisplay.className = "dm-zoom-display";
        zoomDisplay.style.cssText = "min-width: 50px; text-align: center; color: #aaa; font-weight: 500;";
        zoomDisplay.textContent = "100%";
        toolbarLeft.appendChild(zoomDisplay);

        // 放大按钮
        const zoomInBtn = createToolbarButton("pi-search-plus", "放大", () => {
            imageScale = Math.min(5, imageScale + 0.1);
            updateImageScale(imageContainer, imageScale, imageTranslateX, imageTranslateY);
            updateZoomDisplay();
        });
        toolbarLeft.appendChild(zoomInBtn);

        // 重置按钮
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
            if (!isImage) return;
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            imageScale = Math.max(0.1, Math.min(5, imageScale + delta));
            updateImageScale(imageContainer, imageScale, imageTranslateX, imageTranslateY);
            updateZoomDisplay();
        }, { passive: false });

        // 图像拖动（当缩放比例大于1时）
        imageContainer.addEventListener("mousedown", (e) => {
            if (!isImage || imageScale <= 1) return;
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

    // 中间：文件路径
    const filePath = document.createElement("div");
    filePath.className = "dm-file-path";
    filePath.style.cssText = "overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #999;";
    filePath.textContent = path;
    filePath.title = path;
    toolbarCenter.appendChild(filePath);

    // 右侧：操作按钮
    // 分隔符
    const separator2 = document.createElement("div");
    separator2.style.cssText = "width: 1px; height: 16px; background: #3a3a3a; margin: 0 4px;";
    toolbarRight.appendChild(separator2);

    // 打开按钮
    const openBtn = createToolbarButton("pi-external-link", "打开", () => {
        openFileExternally(path);
    });
    toolbarRight.appendChild(openBtn);

    // 组装工具栏（左中右三栏）
    toolbar.appendChild(toolbarLeft);
    toolbar.appendChild(toolbarCenter);
    toolbar.appendChild(toolbarRight);

    // 组装窗口
    previewWindow.appendChild(header);
    previewWindow.appendChild(content);
    previewWindow.appendChild(toolbar);

    document.body.appendChild(previewWindow);

    // 设置拖动
    setupWindowDrag(previewWindow, header);

    // 存储窗口引用
    previewFloatingWindows.push({
        path: path,
        window: previewWindow
    });

    updateStatus(`已打开预览: ${fileName}`);
}

/**
 * 更新图像缩放
 */
function updateImageScale(container, scale, translateX, translateY) {
    const img = container.querySelector("img");
    if (img) {
        img.style.transform = `scale(${scale}) translate(${translateX / scale}px, ${translateY / scale}px)`;
        img.style.transition = "transform 0.1s ease-out";
    }
}

/**
 * 切换全屏模式（macOS 风格：保留圆角、边缘留白、布局美观）
 */
function toggleFullscreen(window) {
    const isFullscreen = window.dataset.fullscreen === "true";
    const header = window.querySelector(".dm-preview-header");
    const toolbar = window.querySelector(".dm-preview-toolbar");
    const fullscreenBtn = header?.querySelector('[title="全屏"], [title="退出全屏"]');

    if (!isFullscreen) {
        // 进入全屏 - macOS 风格
        window.dataset.originalStyle = window.style.cssText;
        window.dataset.originalTop = window.style.top;
        window.dataset.originalLeft = window.style.left;
        window.dataset.originalWidth = window.style.width;
        window.dataset.originalHeight = window.style.height;

        // macOS 风格：保留圆角，边缘留白
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

        // 更新按钮状态
        if (fullscreenBtn) {
            fullscreenBtn.innerHTML = '<i class="pi pi-window-minimize"></i>';
            fullscreenBtn.title = "退出全屏";
        }

        // 按 ESC 退出全屏
        const escHandler = (e) => {
            if (e.key === "Escape") {
                toggleFullscreen(window);
                document.removeEventListener("keydown", escHandler);
            }
        };
        window._escHandler = escHandler;
        document.addEventListener("keydown", escHandler);

    } else {
        // 退出全屏 - 恢复原始大小和位置
        window.style.cssText = window.dataset.originalStyle || "";
        window.style.top = window.dataset.originalTop || "100px";
        window.style.left = window.dataset.originalLeft || "50px";
        window.dataset.fullscreen = "false";

        // 恢复按钮状态
        if (fullscreenBtn) {
            fullscreenBtn.innerHTML = '<i class="pi pi-window-maximize"></i>';
            fullscreenBtn.title = "全屏";
        }

        // 移除 ESC 监听器
        if (window._escHandler) {
            document.removeEventListener("keydown", window._escHandler);
            window._escHandler = null;
        }
    }
}

/**
 * 加载预览内容
 * @param {HTMLElement} content - 内容容器
 * @param {string} path - 文件路径
 * @param {string} ext - 文件扩展名
 * @param {number} scale - 初始缩放比例（仅用于图像）
 */
async function loadPreviewContent(content, path, ext, scale = 1) {
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
            // 使用后端 API 获取图像
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
            previewHTML = `
                <div style="text-align: center; width: 100%; padding: 20px;">
                    <i class="pi pi-volume-up" style="font-size: 64px; color: #3498db; margin-bottom: 15px;"></i>
                    <div style="color: #fff; margin-bottom: 15px;">${path.split(/[/\\]/).pop()}</div>
                    <audio controls style="width: 100%; max-width: 400px;">
                        <source src="${audioUrl}" type="audio/mpeg">
                        您的浏览器不支持音频播放
                    </audio>
                </div>
            `;
        }
        // 视频预览
        else if (FILE_TYPES.video.exts.includes(ext)) {
            const videoUrl = `/dm/preview?path=${encodeURIComponent(path)}`;
            previewHTML = `
                <div style="text-align: center; width: 100%;">
                    <video controls style="max-width: 100%; max-height: 400px; border-radius: 8px;">
                        <source src="${videoUrl}" type="video/mp4">
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
                previewHTML = `
                    <div style="width: 100%; background: #1e1e1e; padding: 15px; border-radius: 8px;
                                font-family: 'Consolas', 'Monaco', monospace; font-size: 12px;
                                overflow-x: auto; max-height: 400px; overflow-y: auto;">
                        <pre style="margin: 0; color: #d4d4d4; white-space: pre-wrap;">${escapeHtml(text)}</pre>
                    </div>
                `;
            } else {
                throw new Error('Failed to load file');
            }
        }
        // 文档预览
        else if (FILE_TYPES.document.exts.includes(ext)) {
            previewHTML = `
                <div style="text-align: center; padding: 30px;">
                    <i class="pi pi-file-pdf" style="font-size: 64px; color: #e74c3c;"></i>
                    <div style="margin-top: 15px; color: #fff;">${path.split(/[/\\]/).pop()}</div>
                    <div style="margin-top: 8px; color: #888; font-size: 12px;">此文件类型不支持预览</div>
                    <button class="comfy-btn" style="margin-top: 15px; padding: 8px 16px; background: #3a3a3a; border: 1px solid #4a4a4a; border-radius: 6px; color: #fff; cursor: pointer;"
                            onclick="openFileExternally('${path.replace(/\\/g, '\\\\')}')">
                        <i class="pi pi-external-link"></i> 打开文件
                    </button>
                </div>
            `;
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
 * 关闭浮动预览窗口
 * @param {HTMLElement} window - 预览窗口元素
 */
function closeFloatingPreview(previewWindow) {
    // 从数组中移除
    const index = previewFloatingWindows.findIndex(w => w.window === previewWindow);
    if (index > -1) {
        previewFloatingWindows.splice(index, 1);
    }

    // 移除 DOM
    if (previewWindow && previewWindow.parentNode) {
        previewWindow.remove();
    }
}

/**
 * 创建工具栏按钮
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

// ============================================
// 工具函数
// ============================================
