/**
 * utils-file-type.js - 文件类型检测
 */

import { FILE_TYPES } from './core-constants.js';

/**
 * 识别文件类型
 * @param {object} file - 文件对象
 * @returns {string} 文件类型
 */
export function getFileType(file) {
    if (file.is_dir) return "folder";
    const ext = "." + (file.name || file.path || "").split(".").pop().toLowerCase();
    for (const [type, config] of Object.entries(FILE_TYPES)) {
        if (config.exts && config.exts.includes(ext)) return type;
    }
    return "unknown";
}

/**
 * 根据扩展名获取文件类型
 * @param {string} ext - 扩展名
 * @returns {string} 文件类型
 */
export function getTypeByExt(ext) {
    for (const [type, config] of Object.entries(FILE_TYPES)) {
        if (config.exts && config.exts.includes(ext)) return type;
    }
    return "unknown";
}
