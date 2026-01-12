/**
 * floating-dock.js - Dock 栏管理
 */

import { updateStatus } from './utils-helpers.js';
import { previewFloatingWindows } from './core-state.js';

/**
 * 更新 Dock 栏
 */
export function updateDock() {
    const dock = document.getElementById("dm-preview-dock");
    if (!dock) return;

    // 清空 Dock 栏
    dock.innerHTML = "";

    // 获取最小化的窗口
    const minimizedWindows = previewFloatingWindows.filter(w => w.minimized);
    if (minimizedWindows.length === 0) {
        dock.style.minHeight = "0";
        dock.style.maxHeight = "0";
        dock.style.padding = "0 15px";
        return;
    }

    // 显示 Dock 栏
    dock.style.minHeight = "60px";
    dock.style.maxHeight = "60px";
    dock.style.padding = "10px 15px";

    // 添加每个最小化窗口的缩略图
    minimizedWindows.forEach(w => {
        const thumbnail = document.createElement("div");
        thumbnail.className = "dm-dock-thumbnail";
        thumbnail.style.cssText = `
            width: 80px;
            height: 50px;
            background: #2a2a2a;
            border: 1px solid #3a3a3a;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            transition: all 0.2s;
        `;
        thumbnail.title = `${w.fileName} - 点击恢复`;
        thumbnail.innerHTML = `
            <i class="pi ${w.fileConfig.icon}" style="color: ${w.fileConfig.color}; font-size: 16px;"></i>
            <span style="color: #aaa; font-size: 9px; max-width: 70px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${w.fileName}</span>
        `;
        thumbnail.onmouseover = () => {
            thumbnail.style.background = "#3a3a3a";
            thumbnail.style.borderColor = w.fileConfig.color;
        };
        thumbnail.onmouseout = () => {
            thumbnail.style.background = "#2a2a2a";
            thumbnail.style.borderColor = "#3a3a3a";
        };
        thumbnail.onclick = () => restoreFloatingPreview(w.window);

        dock.appendChild(thumbnail);
    });
}

/**
 * 恢复最小化的浮动预览窗口
 * @param {HTMLElement} window - 浮动窗口元素
 */
export function restoreFloatingPreview(window) {
    // 窗口恢复逻辑在 floating-window.js 中实现
}
