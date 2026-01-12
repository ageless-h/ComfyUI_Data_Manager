/**
 * ui-header.js - 窗口头部
 */

import { getComfyTheme, addThemeListener } from './utils-theme.js';

/**
 * 应用主题到头部
 * @param {HTMLElement} header - 头部元素
 * @param {Object} theme - 主题对象
 */
function applyThemeToHeader(header, theme) {
    if (!header) return;

    // 只更新背景和边框颜色（这些没有 CSS 规则）
    header.style.background = `linear-gradient(135deg, ${theme.bgSecondary} 0%, ${theme.bgPrimary} 100%)`;
    header.style.borderColor = theme.borderColor;

    // 颜色样式由 CSS (utils-theme.js) 处理，这里不再设置内联样式
}

/**
 * 创建窗口头部（macOS 风格）
 * @param {Object} options - 配置选项
 * @param {string} options.title - 标题
 * @param {string} options.icon - 图标类名
 * @param {Function} options.onClose - 关闭回调
 * @param {Function} options.onMinimize - 最小化回调
 * @param {Function} options.onFullscreen - 全屏回调
 * @param {Function} options.onRefresh - 刷新回调
 * @returns {HTMLElement} 头部元素
 */
export function createHeader(options = {}) {
    const {
        title = 'Data Manager',
        icon = 'pi-folder-open',
        onClose = null,
        onMinimize = null,
        onFullscreen = null,
        onRefresh = null
    } = options;

    const header = document.createElement("div");
    header.className = "dm-header dm-preview-header";
    header.setAttribute('draggable', 'false');

    // 获取主题（用于背景和边框）
    const theme = getComfyTheme();

    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 15px;
        background: linear-gradient(135deg, ${theme.bgSecondary} 0%, ${theme.bgPrimary} 100%);
        border-bottom: 1px solid ${theme.borderColor};
        cursor: move;
        user-select: none;
    `;

    // 交通灯按钮（macOS 风格）
    const trafficLights = document.createElement("div");
    trafficLights.className = "dm-traffic-lights";
    trafficLights.style.cssText = "display: flex; gap: 8px;";

    // 关闭按钮
    const closeBtn = createTrafficButton("pi-times", "关闭", onClose);

    // 最小化按钮
    const minimizeBtn = createTrafficButton("pi-minus", "最小化", onMinimize);

    // 全屏按钮
    const fullscreenBtn = createTrafficButton("pi-window-maximize", "全屏", onFullscreen);

    trafficLights.appendChild(closeBtn);
    trafficLights.appendChild(minimizeBtn);
    trafficLights.appendChild(fullscreenBtn);

    // 标题区域
    const titleArea = document.createElement("div");
    titleArea.className = "dm-header-title-area";
    titleArea.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        flex: 1 1 0%;
        justify-content: center;
    `;

    const iconElement = document.createElement("i");
    iconElement.className = `pi ${icon}`;

    const titleText = document.createElement("span");
    titleText.style.cssText = `
        max-width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    `;
    titleText.textContent = title;

    titleArea.appendChild(iconElement);
    titleArea.appendChild(titleText);

    // 刷新按钮（右侧）
    const actions = document.createElement("div");
    actions.style.cssText = "display: flex; gap: 8px;";

    if (onRefresh) {
        const refreshBtn = createHeaderButton("pi-refresh", "刷新", onRefresh);
        refreshBtn.style.background = "transparent";
        actions.appendChild(refreshBtn);
    }

    header.appendChild(trafficLights);
    header.appendChild(titleArea);
    header.appendChild(actions);

    // 存储主题更新函数
    header._updateTheme = () => {
        const currentTheme = getComfyTheme();
        applyThemeToHeader(header, currentTheme);
        if (themeChangeCallback) {
            themeChangeCallback(currentTheme);
        }
    };

    // 注册主题变化监听
    addThemeListener((theme) => {
        applyThemeToHeader(header, theme);
    });

    return header;
}

/**
 * 创建交通灯按钮（macOS 风格圆形按钮）
 * @param {string} icon - 图标类名
 * @param {string} title - 提示文字
 * @param {Function} onClick - 点击回调
 * @returns {HTMLElement} 按钮元素
 */
function createTrafficButton(icon, title, onClick) {
    const button = document.createElement("button");
    button.className = "comfy-btn dm-traffic-btn";
    button.innerHTML = `<i class="pi ${icon}" style="font-size: 10px;"></i>`;
    button.style.cssText = `
        width: 14px;
        height: 14px;
        padding: 0px;
        background: transparent;
        border: none;
        cursor: pointer;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: 0.15s;
    `;
    button.title = title;

    if (onClick) {
        button.onclick = (e) => {
            e.stopPropagation();
            onClick();
        };
    }

    return button;
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
    button.className = "comfy-btn dm-header-btn";
    button.innerHTML = `<i class="pi ${icon}"></i>`;
    button.style.cssText = `
        padding: 6px 10px;
        background: transparent;
        border: none;
        cursor: pointer;
        border-radius: 4px;
    `;
    button.title = title;
    button.onmouseover = () => button.style.background = "";
    button.onmouseout = () => button.style.background = "transparent";
    button.onclick = onClick;
    return button;
}
