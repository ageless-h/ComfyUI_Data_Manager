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

// 导入核心模块
import { FILE_TYPES } from './core-constants.js';
import { FileManagerState } from './core-state.js';

// 导入 UI 模块
import { createFileManagerWindow } from './ui-window.js';
import { loadDirectory, toggleSort, navigateUp, navigateHome } from './ui-actions.js';

// 导入 API 模块
import { createFile as apiCreateFile, createDirectory as apiCreateDirectory, deleteFile as apiDeleteFile } from './api-index.js';

// 导入浮动窗口模块
import { openFloatingPreview, closeFloatingPreview, toggleFullscreen, restoreFloatingPreview } from './floating-window.js';
import { updateDock } from './floating-dock.js';
import { openFileExternally } from './floating-actions.js';

// 导入工具函数
import { updateStatus, showToast, getParentPath, getExt, getFileName } from './utils-helpers.js';

// 检测 Node 版本（安全检测，防止访问 undefined/null 属性）
const IS_NODE_V3 = typeof app.ui !== 'undefined' &&
                    app.ui !== null &&
                    app.ui.version &&
                    typeof app.ui.version === 'object' &&
                    app.ui.version.major &&
                    app.ui.version.major >= 2;

console.log(`[DataManager] Extension loading, Node V${IS_NODE_V3 ? '3' : '1'} detected`);

// 全局变量引用
let fileManagerWindow = null;

// ============================================
// 扩展配置
// ============================================
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

    async setup() {
        console.log("[DataManager] Extension setup completed");
    },

    async nodeCreated(node) {
        if (node.comfyClass === "DataManagerCore") {
            console.log("[DataManager] DataManagerCore node created, IS_NODE_V3:", IS_NODE_V3);

            // V1/V3 API 都使用 addDOMWidget 添加按钮
            if (node.addDOMWidget) {
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

// ============================================
// 主功能函数
// ============================================

/**
 * 打开文件管理器
 */
function openFileManager() {
    if (fileManagerWindow && fileManagerWindow.parentNode) {
        fileManagerWindow.remove();
        fileManagerWindow = null;
    }

    // 设置初始路径
    if (!FileManagerState.currentPath) {
        FileManagerState.currentPath = ".";
    }

    // 创建窗口回调
    const callbacks = {
        onRefresh: () => loadDirectory(FileManagerState.currentPath),
        onClose: () => {
            if (fileManagerWindow) {
                fileManagerWindow.remove();
                fileManagerWindow = null;
            }
        },
        onNavigateUp: () => navigateUp(),
        onNavigateHome: () => navigateHome(),
        onPathChange: (path) => loadDirectory(path),
        onSortChange: (column) => {
            toggleSort(column);
        },
        onViewToggle: () => {
            FileManagerState.viewMode = FileManagerState.viewMode === "list" ? "grid" : "list";
            const container = document.getElementById("dm-file-list");
            const browserPanel = document.getElementById("dm-browser-panel");

            if (container) {
                // 更新容器样式
                if (FileManagerState.viewMode === 'grid') {
                    container.style.cssText = `
                        flex: 1;
                        overflow-y: auto;
                        padding: 10px;
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
                        gap: 8px;
                        align-content: start;
                    `;
                    // 隐藏列表表头
                    const header = browserPanel?.querySelector('.dm-list-header');
                    if (header) header.style.display = 'none';
                } else {
                    container.style.cssText = `
                        flex: 1;
                        overflow-y: auto;
                        padding: 5px 0;
                    `;
                    // 显示列表表头
                    const header = browserPanel?.querySelector('.dm-list-header');
                    if (header) header.style.display = 'flex';
                }
                // 重新渲染文件列表
                loadDirectory(FileManagerState.currentPath);
            }
        },
        onNewFile: () => showNewFileDialog(),
        onCopyPath: () => copySelectedPaths(),
        onDelete: () => deleteSelectedFiles(),
        onOpenFloating: () => {
            const selected = FileManagerState.selectedFiles[0];
            if (selected) {
                openFloatingPreview(selected, getFileName(selected));
            }
        },
        onOpenExternally: () => {
            const selected = FileManagerState.selectedFiles[0];
            if (selected) {
                openFileExternally(selected);
            }
        }
    };

    fileManagerWindow = createFileManagerWindow(callbacks);
    loadDirectory(FileManagerState.currentPath);
}

// ============================================
// 文件操作功能
// ============================================

/**
 * 显示新建文件对话框
 */
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

    dialog.querySelector('#dm-new-file-btn').onclick = () => { modal.remove(); createNewFile(); };
    dialog.querySelector('#dm-new-folder-btn').onclick = () => { modal.remove(); createNewFolder(); };
    dialog.querySelector('#dm-cancel-new-btn').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

/**
 * 创建新文件
 */
async function createNewFile() {
    const name = prompt("输入文件名:", "new_file.txt");
    if (name) {
        try {
            await apiCreateFile(FileManagerState.currentPath, name, "");
            await loadDirectory(FileManagerState.currentPath);
            showToast("success", "成功", `文件已创建: ${name}`);
        } catch (error) {
            console.error("创建文件失败:", error);
            showToast("error", "错误", `创建文件失败: ${error.message}`);
        }
    }
}

/**
 * 创建新文件夹
 */
async function createNewFolder() {
    const name = prompt("输入文件夹名称:", "新建文件夹");
    if (name) {
        try {
            await apiCreateDirectory(FileManagerState.currentPath, name);
            await loadDirectory(FileManagerState.currentPath);
            showToast("success", "成功", `文件夹已创建: ${name}`);
        } catch (error) {
            console.error("创建文件夹失败:", error);
            showToast("error", "错误", `创建文件夹失败: ${error.message}`);
        }
    }
}

/**
 * 删除选中文件
 */
async function deleteSelectedFiles() {
    let filesToDelete = [];

    // 优先使用当前预览文件
    if (FileManagerState.currentPreviewFile) {
        filesToDelete = [FileManagerState.currentPreviewFile];
    }
    // 其次使用选中的文件
    else if (FileManagerState.selectedFiles.length === 0) {
        showToast("info", "提示", "请先选择要删除的文件");
        return;
    } else {
        filesToDelete = FileManagerState.selectedFiles;
    }

    if (!confirm(`确定要删除 ${filesToDelete.length} 个项目吗？`)) return;

    let deletedCount = 0;
    let errorCount = 0;

    for (const path of filesToDelete) {
        try {
            await apiDeleteFile(path, true);
            deletedCount++;
        } catch (error) {
            console.error(`删除失败: ${path}`, error);
            errorCount++;
        }
    }

    // 清空当前预览文件
    if (FileManagerState.currentPreviewFile) {
        FileManagerState.currentPreviewFile = null;
        // 清空预览面板
        const content = document.getElementById("dm-preview-content");
        if (content) {
            content.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i class="pi pi-file" style="font-size: 48px; opacity: 0.5;"></i>
                    <div style="margin-top: 15px; font-size: 13px;">选择文件以预览</div>
                </div>
            `;
        }
        // 清空文件信息
        const infoSection = document.getElementById("dm-file-info");
        if (infoSection) {
            infoSection.innerHTML = '<div style="text-align: center;">未选择文件</div>';
        }
    }

    await loadDirectory(FileManagerState.currentPath);

    if (errorCount > 0) {
        showToast("error", "部分失败", `已删除 ${deletedCount} 个项目，失败 ${errorCount} 个`);
    } else {
        showToast("success", "成功", `已删除 ${deletedCount} 个项目`);
    }

    // 只清空选中的文件列表（不是当前预览文件的情况）
    if (!FileManagerState.currentPreviewFile) {
        FileManagerState.selectedFiles = [];
    }
}

/**
 * 复制文本到剪贴板（带降级方案）
 * @param {string} text - 要复制的文本
 * @returns {Promise<boolean>} 是否成功
 */
async function copyToClipboard(text) {
    // 方案 1: 现代 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.log("Clipboard API failed, trying fallback:", err);
        }
    }

    // 方案 2: 降级到 execCommand (兼容旧浏览器)
    try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.cssText = "position: fixed; top: -9999px; left: -9999px;";
        document.body.appendChild(textArea);
        textArea.select();
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);
        return successful;
    } catch (err) {
        console.error("Copy fallback failed:", err);
        return false;
    }
}

/**
 * 复制路径到剪贴板
 */
async function copySelectedPaths() {
    let text = "";
    let count = 0;

    // 优先使用当前预览文件
    if (FileManagerState.currentPreviewFile) {
        text = FileManagerState.currentPreviewFile;
        count = 1;
    } else {
        // 其次使用选中的文件
        if (FileManagerState.selectedFiles.length === 0) {
            showToast("info", "提示", "请先选择文件");
            return;
        }
        text = FileManagerState.selectedFiles.join('\n');
        count = FileManagerState.selectedFiles.length;
    }

    const success = await copyToClipboard(text);

    if (success) {
        showToast("success", "成功", `已复制 ${count} 个路径`);
    } else {
        showToast("error", "错误", "复制失败，请手动复制");
    }
}

// ============================================
// 扩展注册（必须在所有函数定义之后）
// ============================================
app.registerExtension(extensionConfig);

// ============================================
// 暴露全局函数到 window 对象（供外部调用）
// ============================================
window.FileManagerState = FileManagerState;
window.openFileManager = openFileManager;
window.openFloatingPreview = openFloatingPreview;
window.toggleFullscreen = toggleFullscreen;
window.restoreFloatingPreview = restoreFloatingPreview;
window.closeFloatingPreview = closeFloatingPreview;
window.updateDock = updateDock;
