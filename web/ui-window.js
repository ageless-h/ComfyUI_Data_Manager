/**
 * ui-window.js - 文件管理器主窗口
 */

import { createHeader } from './ui-header.js';
import { createToolbar } from './ui-toolbar.js';
import { createBrowserPanel } from './ui-browser.js';
import { createPreviewPanel, createStatusBar } from './ui-preview.js';
import { loadDirectory } from './ui-actions.js';
import { setupWindowDrag } from './utils-drag.js';
import { FileManagerState } from './core-state.js';

// 键盘事件处理器引用
let keydownHandler = null;

/**
 * 创建文件管理器窗口
 * @param {object} callbacks - 回调函数对象
 * @returns {HTMLElement} 窗口元素
 */
export function createFileManagerWindow(callbacks) {
    const window = document.createElement("div");
    window.id = "dm-file-manager";
    window.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 1200px;
        height: 700px;
        max-width: calc(100vw - 40px);
        max-height: calc(100vh - 40px);
        background: #1a1a1a;
        border: 1px solid #3a3a3a;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        z-index: 10000;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    `;

    // 组装窗口
    window.appendChild(createHeader({
        title: 'Data Manager',
        icon: 'pi-folder-open',
        onClose: callbacks.onClose,
        onRefresh: callbacks.onRefresh
    }));
    window.appendChild(createToolbar(callbacks));
    window.appendChild(createMainContent(callbacks));
    window.appendChild(createStatusBar());

    document.body.appendChild(window);

    // 设置拖动
    setupWindowDrag(window, window.querySelector('.dm-header'));

    // 添加键盘事件监听（ESC 关闭）
    keydownHandler = (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            callbacks.onClose();
        }
    };
    document.addEventListener('keydown', keydownHandler, { capture: true });

    return window;
}

/**
 * 销毁窗口（清理事件监听）
 */
export function destroyFileManagerWindow() {
    // 移除键盘事件监听
    if (keydownHandler) {
        document.removeEventListener('keydown', keydownHandler, { capture: true });
        keydownHandler = null;
    }

    // 移除窗口元素
    const window = document.getElementById('dm-file-manager');
    if (window) {
        window.remove();
    }
}

/**
 * 创建主内容区
 * @param {object} callbacks - 回调函数对象
 * @returns {HTMLElement} 主内容元素
 */
function createMainContent(callbacks) {
    const mainContent = document.createElement("div");
    mainContent.style.cssText = "flex: 1; display: flex; overflow: hidden;";

    const browserPanel = createBrowserPanel(FileManagerState.viewMode);
    mainContent.appendChild(browserPanel);

    const previewPanel = createPreviewPanel({
        onOpenFloating: () => callbacks.onOpenFloating && callbacks.onOpenFloating(),
        onCopyPath: () => callbacks.onCopyPath && callbacks.onCopyPath(),
        onDelete: () => callbacks.onDelete && callbacks.onDelete()
    });
    mainContent.appendChild(previewPanel);

    return mainContent;
}
