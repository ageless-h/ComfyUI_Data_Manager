/**
 * floating-actions.js - 浮动窗口外部操作
 */

/**
 * 打开文件（使用系统默认程序）
 * @param {string} path - 文件路径
 */
export function openFileExternally(path) {
    try {
        const { shell } = require('electron');
        shell.openPath(path).catch(err => {
            console.error('[DataManager] 无法打开文件:', err);
        });
    } catch (error) {
        console.error('[DataManager] 打开文件失败:', error);
    }
}
