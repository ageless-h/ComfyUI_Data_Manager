/**
 * api-index.js - 后端 API 调用
 */

/**
 * 列出目录内容
 * @param {string} path - 目录路径
 * @returns {Promise<object>} 目录数据
 */
export async function listDirectory(path) {
    const response = await fetch("/dm/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: path })
    });

    if (response && response.ok) {
        return await response.json();
    }
    throw new Error('Failed to list directory');
}

/**
 * 获取文件预览 URL
 * @param {string} path - 文件路径
 * @returns {string} 预览 URL
 */
export function getPreviewUrl(path) {
    return `/dm/preview?path=${encodeURIComponent(path)}`;
}

/**
 * 获取文件信息
 * @param {string} path - 文件路径
 * @returns {Promise<object>} 文件信息对象
 */
export async function getFileInfo(path) {
    const response = await fetch("/dm/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: path })
    });

    if (response && response.ok) {
        const data = await response.json();
        return data.info;
    }
    throw new Error('Failed to get file info');
}
