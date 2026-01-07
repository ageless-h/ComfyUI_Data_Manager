/**
 * ui-header.js - 窗口头部
 */

/**
 * 创建窗口头部
 * @param {Function} onRefresh - 刷新回调
 * @param {Function} onClose - 关闭回调
 * @returns {HTMLElement} 头部元素
 */
export function createHeader(onRefresh, onClose) {
    const header = document.createElement("div");
    header.className = "dm-header";
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 20px;
        background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
        border-bottom: 1px solid #3a3a3a;
        cursor: move;
        user-select: none;
    `;

    const title = document.createElement("div");
    title.innerHTML = '<i class="pi pi-folder-open"></i> 文件管理器';
    title.style.cssText = "color: #fff; font-size: 16px; font-weight: 600;";

    const actions = document.createElement("div");
    actions.style.cssText = "display: flex; gap: 8px;";

    actions.appendChild(createHeaderButton("pi-refresh", "刷新", onRefresh));
    actions.appendChild(createHeaderButton("pi-times", "关闭", onClose));

    header.appendChild(title);
    header.appendChild(actions);

    return header;
}

/**
 * 创建头部按钮
 * @param {string} icon - 图标类名
 * @param {string} title - 标题
 * @param {Function} onClick - 点击回调
 * @returns {HTMLElement} 按钮元素
 */
export function createHeaderButton(icon, title, onClick) {
    const button = document.createElement("button");
    button.className = "comfy-btn";
    button.innerHTML = `<i class="pi ${icon}"></i>`;
    button.style.cssText = `
        padding: 6px 10px;
        background: transparent;
        border: none;
        color: #aaa;
        cursor: pointer;
        border-radius: 4px;
    `;
    button.title = title;
    button.onmouseover = () => button.style.background = "#3a3a3a";
    button.onmouseout = () => button.style.background = "transparent";
    button.onclick = onClick;
    return button;
}
