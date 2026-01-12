/**
 * api-index.js - 后端 API 调用
 */

import { API_ENDPOINTS } from './core-constants.js';

/**
 * 列出目录内容
 * @param {string} path - 目录路径
 * @returns {Promise<object>} 目录数据
 */
export async function listDirectory(path) {
    const response = await fetch(API_ENDPOINTS.LIST, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: path })
    });

    if (response && response.ok) {
        return await response.json();
    }
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData.error || errorData.message || `HTTP ${response.status}`;
    throw new Error(`Failed to list directory: ${errorMsg}`);
}

/**
 * 获取文件预览 URL
 * @param {string} path - 文件路径
 * @returns {string} 预览 URL
 */
export function getPreviewUrl(path) {
    return `${API_ENDPOINTS.PREVIEW}?path=${encodeURIComponent(path)}`;
}

/**
 * 获取文件信息
 * @param {string} path - 文件路径
 * @returns {Promise<object>} 文件信息对象
 */
export async function getFileInfo(path) {
    const response = await fetch(API_ENDPOINTS.INFO, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: path })
    });

    if (response && response.ok) {
        const data = await response.json();
        return data.info;
    }
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData.error || errorData.message || `HTTP ${response.status}`;
    throw new Error(`Failed to get file info: ${errorMsg}`);
}

/**
 * 创建新文件
 * @param {string} directory - 目标目录
 * @param {string} filename - 文件名
 * @param {string} content - 文件内容（默认为空）
 * @returns {Promise<object>} 创建结果
 */
export async function createFile(directory, filename, content = "") {
    const response = await fetch(API_ENDPOINTS.CREATE_FILE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directory, filename, content })
    });

    if (response && response.ok) {
        return await response.json();
    }
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || error.message || 'Failed to create file');
}

/**
 * 创建新文件夹
 * @param {string} directory - 父目录
 * @param {string} dirname - 文件夹名称
 * @returns {Promise<object>} 创建结果
 */
export async function createDirectory(directory, dirname) {
    const response = await fetch(API_ENDPOINTS.CREATE_DIRECTORY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ directory, dirname })
    });

    if (response && response.ok) {
        return await response.json();
    }
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || error.message || 'Failed to create directory');
}

/**
 * 删除文件或文件夹
 * @param {string} path - 文件或文件夹路径
 * @param {boolean} useTrash - 是否移动到回收站（默认 true）
 * @returns {Promise<object>} 删除结果
 */
export async function deleteFile(path, useTrash = true) {
    const response = await fetch(API_ENDPOINTS.DELETE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, use_trash: useTrash })
    });

    if (response && response.ok) {
        return await response.json();
    }
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || error.message || 'Failed to delete file');
}
