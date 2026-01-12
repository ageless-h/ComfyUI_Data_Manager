/**
 * utils-script.js - 脚本加载工具
 *
 * 动态加载外部脚本
 */

/**
 * 动态加载脚本
 * @param {string} src - 脚本 URL
 * @returns {Promise} 加载完成 Promise
 */
export function loadScript(src) {
    return new Promise((resolve, reject) => {
        // 如果已加载，直接返回
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}
