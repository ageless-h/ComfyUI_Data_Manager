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
import { createFileManagerWindow, destroyFileManagerWindow } from './ui-window.js';
import { loadDirectory, toggleSort, navigateUp, navigateHome } from './ui-actions.js';
import { checkNodeConnectionAndUpdateFormat } from './ui-preview.js';

// 导入 API 模块
import { createFile as apiCreateFile, createDirectory as apiCreateDirectory, deleteFile as apiDeleteFile } from './api-index.js';

// 导入浮动窗口模块
import { openFloatingPreview, closeFloatingPreview, toggleFullscreen, restoreFloatingPreview } from './floating-window.js';
import { updateDock } from './floating-dock.js';

// 导入工具函数
import { updateStatus, showToast, getParentPath, getExt, getFileName } from './utils-helpers.js';
import { applyComfyTheme, initThemeSystem, getComfyTheme } from './utils-theme.js';

// 导入状态管理函数
import { saveLastPath, getLastPath, saveViewMode, getViewMode } from './core-state.js';

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

    // 顶部操作栏按钮
    actionBarButtons: [
        {
            icon: "pi pi-folder",
            tooltip: "文件管理器 (Ctrl+Shift+D)",
            class: "dm-actionbar-btn",
            onClick: () => openFileManager()
        }
    ],

    async setup() {
        // 注入官方风格的按钮样式
        const style = document.createElement("style");
        style.textContent = `
            .dm-actionbar-btn {
                width: 32px !important;
                height: 32px !important;
                border: none !important;
                border-radius: 6px !important;
                background: rgba(255, 255, 255, 0.05) !important;
                color: rgba(255, 255, 255, 0.9) !important;
                margin-right: 0.5rem !important;
                transition: all 0.2s ease !important;
            }
            .dm-actionbar-btn:hover {
                background: rgba(255, 255, 255, 0.15) !important;
            }
            .dm-actionbar-btn i {
                color: rgba(255, 255, 255, 0.9) !important;
            }
        `;
        document.head.appendChild(style);

        // 简化的位置修正函数
        const fixPosition = () => {
            const dmBtn = document.querySelector('.dm-actionbar-btn');
            const queueBtn = Array.from(document.querySelectorAll('button')).find(b =>
                b.getAttribute('aria-label') === 'Expand job queue'
            );

            if (!dmBtn || !queueBtn) return false;

            const queueParent = queueBtn.parentElement;
            const prevSibling = queueBtn.previousElementSibling;

            // 只有当按钮不在正确位置时才移动
            if (prevSibling !== dmBtn || dmBtn.parentElement !== queueParent) {
                queueParent.insertBefore(dmBtn, queueBtn);
                console.log('[DataManager] Button position fixed');
                return true;
            }
            return false;
        };

        // 使用更全面的监听策略
        let lastCall = 0;
        const observer = new MutationObserver((mutations) => {
            const now = Date.now();
            if (now - lastCall < 100) return;
            lastCall = now;

            // 检查是否有相关的 DOM 变化
            const hasRelevantChange = mutations.some(m => {
                // 检查按钮相关的变化
                if (m.type === 'childList') {
                    for (const node of m.addedNodes) {
                        if (node.nodeType === 1) {
                            // 检查是否是 actionbar 相关的元素
                            if (node.classList?.contains('actionbar-container') ||
                                node.classList?.contains('dm-actionbar-btn') ||
                                node.querySelector?.('.dm-actionbar-btn') ||
                                node.querySelector?.('[aria-label="Expand job queue"]')) {
                                return true;
                            }
                        }
                    }
                }
                // 检查 actionbar-container 内的变化
                if (m.target.closest?.('.actionbar-container')) {
                    return true;
                }
                return false;
            });

            if (hasRelevantChange) {
                requestAnimationFrame(fixPosition);
            }
        });

        // 监听整个 body（因为侧边栏变化可能影响全局布局）
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // 定期检查位置（作为兜底）
        setInterval(() => {
            fixPosition();
        }, 2000);

        console.log("[DataManager] Extension setup completed");

        // 初始化主题系统
        initThemeSystem();
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
        } else if (node.comfyClass === "InputPathConfig") {
            console.log("[DataManager] InputPathConfig node created");
            // 初始化格式选择器状态
            node._dmFormatSelectorEnabled = false;
        } else if (node.comfyClass === "OutputPathConfig") {
            console.log("[DataManager] OutputPathConfig node created");
            // 初始化 OutputPathConfig 节点状态
            node._dmOutputType = "STRING";
            node._dmFilePath = "";
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
    // 如果窗口已存在，先销毁（清理事件监听）
    if (fileManagerWindow) {
        destroyFileManagerWindow();
    }

    // 恢复上次访问的路径，如果没有则使用默认路径
    const lastPath = getLastPath();
    if (lastPath && lastPath !== '.') {
        FileManagerState.currentPath = lastPath;
        console.log('[DataManager] Restored last path:', lastPath);
    } else {
        FileManagerState.currentPath = ".";
    }

    // 创建窗口回调
    const callbacks = {
        onRefresh: () => loadDirectory(FileManagerState.currentPath),
        onClose: () => {
            destroyFileManagerWindow();
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
        }
    };

    fileManagerWindow = createFileManagerWindow(callbacks);

    // 应用 ComfyUI 主题
    applyComfyTheme();

    loadDirectory(FileManagerState.currentPath);

    // 延迟检查节点连接状态，确保窗口已创建完成
    setTimeout(() => {
        checkAndUpdateFormatSelector();
    }, 500);
}

/**
 * 检查 InputPathConfig 节点的连接状态并更新格式选择器
 */
function checkAndUpdateFormatSelector() {
    try {
        checkNodeConnectionAndUpdateFormat();
    } catch (e) {
        console.log("[DataManager] Error in checkAndUpdateFormatSelector:", e);
    }
}

// ============================================
// 文件操作功能
// ============================================

/**
 * 显示新建文件对话框
 */
function showNewFileDialog() {
    const theme = getComfyTheme();

    const modal = document.createElement("div");
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.7); z-index: 10001;
        display: flex; align-items: center; justify-content: center;
    `;

    const dialog = document.createElement("div");
    dialog.style.cssText = `
        background: ${theme.bgSecondary}; border-radius: 12px; padding: 24px;
        width: 400px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
    `;

    dialog.innerHTML = `
        <h3 style="margin: 0 0 20px 0; color: ${theme.textPrimary};">新建</h3>
        <div style="display: flex; gap: 10px; margin-bottom: 20px;">
            <button id="dm-new-file-btn" class="comfy-btn"
                    style="flex: 1; padding: 15px; background: ${theme.bgTertiary}; border: 1px solid ${theme.borderColor};
                           border-radius: 8px; color: ${theme.textPrimary}; cursor: pointer;">
                <i class="pi pi-file" style="display: block; font-size: 24px; margin-bottom: 8px;"></i>
                文件
            </button>
            <button id="dm-new-folder-btn" class="comfy-btn"
                    style="flex: 1; padding: 15px; background: ${theme.bgTertiary}; border: 1px solid ${theme.borderColor};
                           border-radius: 8px; color: ${theme.textPrimary}; cursor: pointer;">
                <i class="pi pi-folder" style="display: block; font-size: 24px; margin-bottom: 8px;"></i>
                文件夹
            </button>
        </div>
        <button class="comfy-btn" id="dm-cancel-new-btn"
                style="width: 100%; padding: 10px; background: transparent;
                       border: 1px solid ${theme.borderColor}; border-radius: 6px; color: ${theme.textSecondary}; cursor: pointer;">
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

    // 显示确认对话框
    const confirmed = await showDeleteConfirmDialog(filesToDelete.length);
    if (!confirmed) return;

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
 * 显示删除确认对话框
 * @param {number} count - 要删除的项目数量
 * @returns {Promise<boolean>} 是否确认删除
 */
function showDeleteConfirmDialog(count) {
    return new Promise((resolve) => {
        const theme = getComfyTheme();

        const modal = document.createElement("div");
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.7); z-index: 10001;
            display: flex; align-items: center; justify-content: center;
        `;

        const dialog = document.createElement("div");
        dialog.style.cssText = `
            background: ${theme.bgSecondary}; border-radius: 12px; padding: 24px;
            width: 400px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
            animation: dm-fade-in 0.2s ease-out;
        `;

        // 添加淡入动画
        if (!document.getElementById('dm-dialog-animations')) {
            const style = document.createElement('style');
            style.id = 'dm-dialog-animations';
            style.textContent = `
                @keyframes dm-fade-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
            `;
            document.head.appendChild(style);
        }

        const fileText = count === 1 ? '1 个项目' : `${count} 个项目`;

        dialog.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 16px; margin-bottom: 24px;">
                <div style="
                    width: 48px; height: 48px; border-radius: 50%;
                    background: ${theme.errorColor}33; display: flex;
                    align-items: center; justify-content: center;
                    flex-shrink: 0;
                ">
                    <i class="pi pi-exclamation-triangle" style="font-size: 24px; color: ${theme.errorColor};"></i>
                </div>
                <div style="flex: 1;">
                    <h3 style="margin: 0 0 8px 0; color: ${theme.textPrimary}; font-size: 18px;">确认删除</h3>
                    <p style="margin: 0; color: ${theme.textSecondary}; font-size: 14px; line-height: 1.5;">
                        您确定要删除 ${fileText} 吗？<br>
                        <span style="color: ${theme.errorColor};">此操作无法撤销！</span>
                    </p>
                </div>
            </div>
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button id="dm-cancel-delete-btn" class="comfy-btn"
                        style="flex: 1; padding: 12px 20px; background: ${theme.bgTertiary};
                               border: 1px solid ${theme.borderColor}; border-radius: 8px;
                               color: ${theme.textPrimary}; cursor: pointer; font-size: 14px;">
                    取消
                </button>
                <button id="dm-confirm-delete-btn" class="comfy-btn"
                        style="flex: 1; padding: 12px 20px; background: ${theme.errorColor};
                               border: none; border-radius: 8px;
                               color: #fff; cursor: pointer; font-size: 14px;
                               font-weight: 600;">
                    删除
                </button>
            </div>
        `;

        modal.appendChild(dialog);
        document.body.appendChild(modal);

        // 按钮事件
        const cancelBtn = dialog.querySelector('#dm-cancel-delete-btn');
        const confirmBtn = dialog.querySelector('#dm-confirm-delete-btn');

        cancelBtn.onclick = () => {
            modal.remove();
            resolve(false);
        };

        confirmBtn.onclick = () => {
            modal.remove();
            resolve(true);
        };

        // ESC 键取消
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', escHandler);
                resolve(false);
            }
        };
        document.addEventListener('keydown', escHandler);

        // 点击背景取消
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
                document.removeEventListener('keydown', escHandler);
                resolve(false);
            }
        };
    });
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
window.checkNodeConnectionAndUpdateFormat = checkNodeConnectionAndUpdateFormat;
