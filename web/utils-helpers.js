/**
 * utils-helpers.js - 其他工具函数
 */

import { app } from "../../scripts/app.js";

/**
 * 更新状态栏
 * @param {string} text - 状态文本
 */
export function updateStatus(text) {
    const statusBar = document.getElementById("dm-status-bar");
    if (statusBar) {
        statusBar.textContent = text;
    }
}

/**
 * 显示提示消息
 * @param {string} severity - 严重程度 (info, success, warn, error)
 * @param {string} summary - 标题
 * @param {string} detail - 详细内容
 */
export function showToast(severity, summary, detail) {
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

/**
 * 获取父路径
 * @param {string} path - 当前路径
 * @returns {string} 父路径
 */
export function getParentPath(path) {
    const normalized = path.replace(/\\/g, "/");
    const lastSlash = normalized.lastIndexOf("/");
    if (lastSlash <= 0) return ".";
    return normalized.substring(0, lastSlash);
}

/**
 * 从路径获取文件名
 * @param {string} path - 文件路径
 * @returns {string} 文件名
 */
export function getFileName(path) {
    return path.split(/[/\\]/).pop();
}

/**
 * 从路径获取扩展名
 * @param {string} path - 文件路径
 * @returns {string} 扩展名（带点）
 */
export function getExt(path) {
    return '.' + path.split('.').pop().toLowerCase();
}
