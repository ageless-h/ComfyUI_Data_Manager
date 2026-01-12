/**
 * utils-theme.js - ComfyUI 主题适配工具
 *
 * 获取 ComfyUI 的 CSS 变量并适配到 Data Manager 界面
 */

// 主题监听器列表
const themeListeners = [];

/**
 * 添加主题变化监听器
 * @param {Function} callback - 主题变化时的回调函数
 */
export function addThemeListener(callback) {
    themeListeners.push(callback);
}

/**
 * 通知主题变化
 */
export function notifyThemeChanged() {
    const theme = getComfyTheme();
    themeListeners.forEach(callback => {
        try {
            callback(theme);
        } catch (e) {
            console.error('[DataManager] Theme listener error:', e);
        }
    });
}

/**
 * 监听 ComfyUI 主题变化
 */
function setupThemeWatcher() {
    // 监听 body 上的属性变化（某些主题系统会通过属性切换主题）
    const observer = new MutationObserver((mutations) => {
        let shouldUpdate = false;
        for (const mutation of mutations) {
            if (mutation.type === 'attributes') {
                shouldUpdate = true;
                break;
            }
        }
        if (shouldUpdate) {
            applyComfyTheme();
            notifyThemeChanged();
        }
    });

    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class', 'data-theme']
    });

    // 监听 CSS 变量变化
    let lastThemeValues = getThemeValues();
    const checkInterval = setInterval(() => {
        const currentThemeValues = getThemeValues();
        if (JSON.stringify(lastThemeValues) !== JSON.stringify(currentThemeValues)) {
            lastThemeValues = currentThemeValues;
            applyComfyTheme();
            notifyThemeChanged();
        }
    }, 2000);

    return { observer, checkInterval };
}

/**
 * 获取当前主题值用于比较
 */
function getThemeValues() {
    const rootStyle = window.getComputedStyle(document.documentElement);
    return {
        bg: rootStyle.getPropertyValue('--comfy-menu-bg'),
        bg2: rootStyle.getPropertyValue('--comfy-menu-bg-2'),
        inputText: rootStyle.getPropertyValue('--input-text'),
        borderColor: rootStyle.getPropertyValue('--border-color')
    };
}

// 初始化主题监听器
let themeWatcher = null;

/**
 * 初始化主题系统
 */
export function initThemeSystem() {
    if (!themeWatcher) {
        // 延迟初始化，确保 DOM 完全加载
        setTimeout(() => {
            try {
                themeWatcher = setupThemeWatcher();
            } catch (error) {
                console.error('[DataManager] Theme watcher init failed:', error);
            }
        }, 1000);
    }
}

/**
 * 获取 ComfyUI 主题 CSS 变量
 * @returns {Object} 主题颜色对象
 */
export function getComfyTheme() {
    try {
        const rootStyle = window.getComputedStyle(document.documentElement);
        const bodyStyle = window.getComputedStyle(document.body);

        // 获取背景色
        const bgPrimary = rootStyle.getPropertyValue('--comfy-menu-bg')?.trim() || '#1a1a1a';
        const bgSecondary = rootStyle.getPropertyValue('--comfy-menu-bg-2')?.trim() ||
                             rootStyle.getPropertyValue('--comfy-menu-secondary-bg')?.trim() || '#252525';
        const inputBg = rootStyle.getPropertyValue('--comfy-input-bg')?.trim() || '#2a2a2a';

        // 检测是否为浅色主题
        const isLight = isLightColor(bgPrimary);

        // 根据主题亮度选择文本颜色
        const textPrimary = rootStyle.getPropertyValue('--input-text')?.trim() ||
                            rootStyle.getPropertyValue('--input-text-text')?.trim() ||
                            (isLight ? '#222' : '#ddd');
        const textSecondary = rootStyle.getPropertyValue('--descrip-text')?.trim() ||
                              (isLight ? '#666' : '#999');

        return {
            // 背景色
            bgPrimary: bgPrimary,
            bgSecondary: bgSecondary,
            bgTertiary: rootStyle.getPropertyValue('--comfy-menu-bg-3')?.trim() || '#2a2a2a',

            // 输入框
            inputBg: inputBg,
            inputText: textPrimary,

            // 边框
            borderColor: rootStyle.getPropertyValue('--border-color')?.trim() ||
                          (isLight ? '#ddd' : '#3a3a3a'),

            // 文本
            textPrimary: textPrimary,
            textSecondary: textSecondary,

            // 强调色（某些主题可能定义）
            accentColor: rootStyle.getPropertyValue('--comfy-accent')?.trim() || '#9b59b6',

            // 错误色
            errorColor: '#e74c3c',
            successColor: '#27ae60',
            warningColor: '#f39c12',

            // 主题类型标记
            isLight: isLight
        };
    } catch (error) {
        console.error('[DataManager] Error getting theme:', error);
        // 返回默认主题（深色）
        return {
            bgPrimary: '#1a1a1a',
            bgSecondary: '#252525',
            bgTertiary: '#2a2a2a',
            inputBg: '#2a2a2a',
            inputText: '#ddd',
            borderColor: '#3a3a3a',
            textPrimary: '#ddd',
            textSecondary: '#999',
            accentColor: '#9b59b6',
            errorColor: '#e74c3c',
            successColor: '#27ae60',
            warningColor: '#f39c12',
            isLight: false
        };
    }
}

/**
 * 检测颜色是否为浅色
 * @param {string} color - CSS 颜色值
 * @returns {boolean} 是否为浅色
 */
function isLightColor(color) {
    // 移除 # 号
    const hex = color.replace('#', '');

    // 处理 rgb/rgba 格式
    if (color.startsWith('rgb')) {
        const match = color.match(/\d+/g);
        if (match) {
            const r = parseInt(match[0]);
            const g = parseInt(match[1]);
            const b = parseInt(match[2]);
            return (r * 0.299 + g * 0.587 + b * 0.114) > 186;
        }
        return false;
    }

    // 处理十六进制格式
    if (hex.length === 3) {
        const r = parseInt(hex[0] + hex[0], 16);
        const g = parseInt(hex[1] + hex[1], 16);
        const b = parseInt(hex[2] + hex[2], 16);
        return (r * 0.299 + g * 0.587 + b * 0.114) > 186;
    } else if (hex.length === 6) {
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return (r * 0.299 + g * 0.587 + b * 0.114) > 186;
    }

    return false;
}

/**
 * 应用主题到 Data Manager 界面
 * 更新所有使用硬编码颜色的元素
 */
export function applyComfyTheme() {
    try {
        const theme = getComfyTheme();

        // 创建或更新主题样式表
        let themeStyle = document.getElementById('dm-comfy-theme');
        if (!themeStyle) {
            themeStyle = document.createElement('style');
            themeStyle.id = 'dm-comfy-theme';
            document.head.appendChild(themeStyle);
        }

        themeStyle.textContent = `
            /* Data Manager - ComfyUI 主题适配 */

            /* 工具栏 */
            .dm-toolbar {
                background: ${theme.bgSecondary} !important;
                border-bottom-color: ${theme.borderColor} !important;
            }

            /* 输入框和选择框 */
            .dm-input,
            .dm-select {
                background: ${theme.inputBg} !important;
                border-color: ${theme.borderColor} !important;
                color: ${theme.inputText} !important;
            }

            .dm-input::placeholder {
                color: ${theme.textSecondary} !important;
            }

            .dm-select option {
                background: ${theme.bgTertiary} !important;
                color: ${theme.inputText} !important;
            }

            /* 预览面板标题 */
            .dm-preview-header {
                background: ${theme.bgSecondary} !important;
                border-bottom-color: ${theme.borderColor} !important;
            }

            .dm-title {
                color: ${theme.textPrimary} !important;
            }

            .dm-icon-btn {
                color: ${theme.textPrimary} !important;
            }

            /* 主窗口背景 */
            #dm-file-manager {
                background: ${theme.bgPrimary} !important;
                border-color: ${theme.borderColor} !important;
            }

            /* 标题栏 */
            .dm-header {
                background: linear-gradient(135deg, ${theme.bgSecondary} 0%, ${theme.bgPrimary} 100%) !important;
                border-color: ${theme.borderColor} !important;
            }

            .dm-header-title {
                color: ${theme.textPrimary} !important;
            }

            .dm-header-btn {
                color: ${theme.textPrimary} !important;
            }

            .dm-header-btn:hover {
                background: ${theme.bgTertiary} !important;
            }

            /* 交通灯按钮 - 浅色/深色主题适配 */
            .dm-traffic-btn {
                color: ${theme.isLight ? '#222' : '#fff'} !important;
            }

            .dm-traffic-btn:hover {
                background: ${theme.isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.2)'} !important;
            }

            /* 标题区域 */
            .dm-header-title-area {
                color: ${theme.isLight ? '#222' : '#fff'} !important;
            }

            .dm-header-title-area i {
                color: ${theme.isLight ? '#2980b9' : '#3498db'} !important;
            }

            /* 工具栏 */
            #dm-file-manager > div > div[style*="background: #222"] {
                background: ${theme.bgSecondary} !important;
                border-color: ${theme.borderColor} !important;
            }

            /* 路径输入框 */
            #dm-path-input {
                background: ${theme.inputBg} !important;
                border-color: ${theme.borderColor} !important;
                color: ${theme.inputText} !important;
            }

            /* 排序选择 */
            #dm-sort-select {
                background: ${theme.inputBg} !important;
                border-color: ${theme.borderColor} !important;
                color: ${theme.inputText} !important;
            }

            /* 文件列表容器 */
            #dm-browser-panel {
                background: ${theme.bgSecondary} !important;
                border-color: ${theme.borderColor} !important;
            }

            .dm-browser-panel {
                border-color: ${theme.borderColor} !important;
            }

            /* 浏览器加载状态 */
            .dm-browser-loading {
                color: ${theme.textSecondary} !important;
            }

            /* 文件列表项 */
            .dm-file-item {
                border-color: ${theme.borderColor} !important;
                color: ${theme.textPrimary} !important;
            }

            .dm-file-name {
                color: ${theme.textPrimary} !important;
            }

            .dm-file-size {
                color: ${theme.textSecondary} !important;
            }

            .dm-file-modified {
                color: ${theme.textSecondary} !important;
            }

            .dm-file-item:hover {
                background: ${theme.bgTertiary} !important;
            }

            .dm-file-item[style*="background: #3a3a3a"] {
                background: ${theme.bgTertiary} !important;
            }

            /* 列表表头 */
            .dm-list-header {
                background: ${theme.bgSecondary} !important;
                border-color: ${theme.borderColor} !important;
            }

            .dm-header-cell {
                color: ${theme.textSecondary} !important;
                border-color: ${theme.borderColor} !important;
            }

            /* 网格项 */
            .dm-grid-item {
                background: ${theme.bgTertiary} !important;
                border-color: transparent !important;
                color: ${theme.textPrimary} !important;
            }

            .dm-grid-icon {
                color: inherit !important;
            }

            .dm-grid-filename {
                color: ${theme.textPrimary} !important;
            }

            /* 父目录网格项 */
            .dm-grid-item-parent {
                background: ${theme.bgTertiary} !important;
                border-color: ${theme.borderColor} !important;
            }

            .dm-parent-icon {
                color: ${theme.textSecondary} !important;
            }

            .dm-parent-text {
                color: ${theme.textSecondary} !important;
            }

            .dm-grid-item:hover {
                border-color: ${theme.accentColor} !important;
            }

            /* 预览面板 */
            #dm-preview-panel {
                background: ${theme.bgSecondary} !important;
                border-color: ${theme.borderColor} !important;
            }

            /* 预览内容 */
            #dm-preview-content {
                background: ${theme.bgPrimary} !important;
            }

            /* 状态栏 */
            #dm-status-bar {
                background: ${theme.bgSecondary} !important;
                border-color: ${theme.borderColor} !important;
                color: ${theme.textSecondary} !important;
            }

            /* Dock 栏 */
            .dm-preview-dock {
                background: linear-gradient(to bottom, ${theme.bgSecondary}, ${theme.bgPrimary}) !important;
                border-color: ${theme.borderColor} !important;
            }

            /* 浮动预览窗口 */
            .dm-floating-preview {
                background: ${theme.bgPrimary} !important;
                border-color: ${theme.borderColor} !important;
            }

            .dm-preview-header {
                background: linear-gradient(135deg, ${theme.bgSecondary} 0%, ${theme.bgPrimary} 100%) !important;
                border-color: ${theme.borderColor} !important;
            }

            .dm-preview-content {
                background: ${theme.bgPrimary} !important;
            }

            .dm-preview-toolbar {
                background: linear-gradient(to bottom, ${theme.bgSecondary}, ${theme.bgPrimary}) !important;
                border-color: ${theme.borderColor} !important;
                color: ${theme.textSecondary} !important;
            }

            /* 文件信息区域 */
            #dm-file-info {
                background: ${theme.bgSecondary} !important;
                border-color: ${theme.borderColor} !important;
                color: ${theme.textSecondary} !important;
            }

            /* 滚动条样式 */
            #dm-file-list::-webkit-scrollbar,
            #dm-preview-content::-webkit-scrollbar,
            .dm-image-container::-webkit-scrollbar {
                width: 8px;
                height: 8px;
            }

            #dm-file-list::-webkit-scrollbar-track,
            #dm-preview-content::-webkit-scrollbar-track,
            .dm-image-container::-webkit-scrollbar-track {
                background: ${theme.bgPrimary};
            }

            #dm-file-list::-webkit-scrollbar-thumb,
            #dm-preview-content::-webkit-scrollbar-thumb,
            .dm-image-container::-webkit-scrollbar-thumb {
                background: ${theme.bgTertiary};
                border-radius: 4px;
            }

            #dm-file-list::-webkit-scrollbar-thumb:hover,
            #dm-preview-content::-webkit-scrollbar-thumb:hover,
            .dm-image-container::-webkit-scrollbar-thumb:hover {
                background: ${theme.borderColor};
            }

            /* 对话框 */
            .dm-dialog {
                background: ${theme.bgSecondary} !important;
                border-color: ${theme.borderColor} !important;
            }

            /* Toast 通知 */
            .dm-toast {
                background: ${theme.bgSecondary} !important;
                border-color: ${theme.borderColor} !important;
                color: ${theme.textPrimary} !important;
            }

            /* 分隔符 */
            [class*="dm-"][style*="background: #3a3a3a"] {
                background: ${theme.borderColor} !important;
            }

            [class*="dm-"][style*="border: 1px solid #3a3a3a"] {
                border-color: ${theme.borderColor} !important;
            }

            [class*="dm-"][style*="border: 1px solid #2a2a2a"] {
                border-color: ${theme.borderColor} !important;
            }

            /* 文件路径显示 */
            .dm-file-path {
                color: ${theme.textSecondary} !important;
            }

            /* 表格样式 */
            .dm-data-table th {
                background: ${theme.bgTertiary} !important;
                border-color: ${theme.borderColor} !important;
                color: ${theme.textPrimary} !important;
            }

            .dm-data-table td {
                border-color: ${theme.borderColor} !important;
                color: ${theme.textPrimary} !important;
            }

            .dm-data-table {
                color: ${theme.textPrimary} !important;
            }

            /* 加载状态 */
            .dm-loading {
                color: ${theme.textSecondary} !important;
            }

            /* 预览图像 */
            .dm-preview-image {
                border-color: ${theme.borderColor} !important;
            }

            /* 错误消息 */
            .dm-error-message {
                color: ${theme.errorColor} !important;
            }

            /* 音频预览 */
            .dm-audio-preview {
                color: ${theme.textSecondary} !important;
            }

            .dm-audio-icon {
                color: #3498db !important;
            }

            /* 视频预览 */
            .dm-video-preview {
                background: #000 !important;
            }

            /* 预览文件名 */
            .dm-preview-filename {
                color: ${theme.textPrimary} !important;
            }

            /* 外部视频预览 */
            .dm-external-video {
                color: ${theme.textSecondary} !important;
            }

            .dm-external-video-icon {
                color: #8e44ad !important;
            }

            .dm-external-video-type {
                color: #8e44ad !important;
            }

            .dm-external-video-desc {
                color: ${theme.textSecondary} !important;
            }

            .dm-external-video-sub {
                color: ${theme.textSecondary} !important;
            }

            .dm-external-video-tip {
                background: ${theme.bgTertiary} !important;
                color: ${theme.textSecondary} !important;
            }

            /* 代码预览 */
            .dm-code-preview {
                background: ${theme.bgPrimary} !important;
                color: ${theme.textPrimary} !important;
            }

            .dm-code-content {
                color: ${theme.textPrimary} !important;
            }

            /* 文档内容 */
            .dm-document-content {
                background: ${theme.bgPrimary} !important;
                color: ${theme.textPrimary} !important;
            }

            .dm-text-content {
                background: ${theme.bgPrimary} !important;
                color: ${theme.textPrimary} !important;
            }

            /* 不支持的文档格式 */
            .dm-doc-unsupported {
                color: ${theme.textSecondary} !important;
            }

            .dm-doc-unsupported-icon {
                color: #2b579a !important;
            }

            .dm-unsupported-message {
                color: ${theme.textSecondary} !important;
            }

            .dm-unsupported-sub {
                color: ${theme.textSecondary} !important;
            }

            /* 预览错误 */
            .dm-preview-error {
                color: ${theme.textSecondary} !important;
            }

            .dm-error-icon {
                color: ${theme.errorColor} !important;
            }

            .dm-error-title {
                color: ${theme.errorColor} !important;
            }

            .dm-error-detail {
                color: ${theme.textSecondary} !important;
            }

            /* 未知文件类型 */
            .dm-unknown-file {
                color: ${theme.textSecondary} !important;
            }

            .dm-unknown-file-icon {
                color: ${theme.textSecondary} !important;
            }

            .dm-unknown-message {
                color: ${theme.textSecondary} !important;
            }

            /* 不可用预览 */
            .dm-unavailable-preview {
                color: ${theme.textSecondary} !important;
            }

            .dm-unavailable-icon {
                color: ${theme.errorColor} !important;
            }

            .dm-unavailable-message {
                color: ${theme.textSecondary} !important;
            }

            /* 空表格 */
            .dm-empty-table {
                color: ${theme.textSecondary} !important;
            }

            .dm-empty-table-icon {
                color: ${theme.textSecondary} !important;
            }

            .dm-empty-table-message {
                color: ${theme.textSecondary} !important;
            }

            /* 不支持的表格 */
            .dm-unsupported-table {
                color: ${theme.textSecondary} !important;
            }

            .dm-unsupported-table-icon {
                color: #27ae60 !important;
            }

            /* 表格容器 */
            .dm-table-container {
                background: ${theme.bgPrimary} !important;
            }

            /* 表格控件（视频控制栏） */
            .dm-table-controls {
                background: ${theme.bgSecondary} !important;
                border-top: 1px solid ${theme.borderColor} !important;
            }

            .dm-table-zoom-out-btn,
            .dm-table-zoom-in-btn,
            .dm-table-fit-btn {
                background: ${theme.bgTertiary} !important;
                border: 1px solid ${theme.borderColor} !important;
                border-radius: 6px !important;
                color: ${theme.textPrimary} !important;
                padding: 6px 10px !important;
                cursor: pointer !important;
            }

            .dm-table-zoom-out-btn:hover,
            .dm-table-zoom-in-btn:hover,
            .dm-table-fit-btn:hover {
                background: ${theme.bgTertiary} !important;
                border-color: ${theme.accentColor} !important;
            }

            .dm-table-zoom-display {
                color: ${theme.textSecondary} !important;
                font-size: 11px !important;
                min-width: 45px !important;
                text-align: center !important;
            }

            .dm-table-truncated {
                color: ${theme.textSecondary} !important;
            }

            /* 表格单元格 */
            .dm-table-header {
                background: ${theme.bgTertiary} !important;
                border: 1px solid ${theme.borderColor} !important;
                padding: 8px 12px !important;
                text-align: left !important;
                font-weight: 600 !important;
                color: ${theme.textPrimary} !important;
            }

            .dm-table-cell {
                border: 1px solid ${theme.borderColor} !important;
                padding: 8px 12px !important;
                color: ${theme.textPrimary} !important;
            }

            .dm-data-table {
                color: ${theme.textPrimary} !important;
            }

            /* ==================== 面板预览样式 ==================== */

            /* 面板加载状态 */
            .dm-panel-loading {
                color: ${theme.textSecondary} !important;
            }

            /* 面板预览图像 */
            .dm-panel-preview-image {
                border-color: ${theme.borderColor} !important;
            }

            /* 面板音频预览 */
            .dm-panel-audio-preview {
                color: ${theme.textSecondary} !important;
            }

            /* 面板视频容器 */
            .dm-panel-video-container {
                background: #000 !important;
            }

            /* 视频控制面板 */
            .dm-video-controls-panel {
                background: ${theme.bgSecondary} !important;
            }

            .dm-video-play-btn,
            .dm-video-volume-btn,
            .dm-video-fullscreen-btn {
                background: ${theme.bgTertiary} !important;
                border: 1px solid ${theme.borderColor} !important;
                border-radius: 6px !important;
                color: ${theme.textPrimary} !important;
                padding: 6px 12px !important;
                cursor: pointer !important;
                font-size: 12px !important;
                display: flex !important;
                align-items: center !important;
                gap: 5px !important;
            }

            .dm-video-play-btn:hover,
            .dm-video-volume-btn:hover,
            .dm-video-fullscreen-btn:hover {
                background: ${theme.bgTertiary} !important;
                border-color: ${theme.accentColor} !important;
            }

            .dm-video-time-display {
                color: ${theme.textSecondary} !important;
                font-size: 11px !important;
                font-family: monospace !important;
                min-width: 80px !important;
                text-align: center !important;
            }

            /* 面板代码预览 */
            .dm-panel-code-preview {
                background: ${theme.bgPrimary} !important;
                color: ${theme.textPrimary} !important;
            }

            .dm-panel-code-content {
                color: ${theme.textPrimary} !important;
            }

            /* 面板文档内容 */
            .dm-panel-docx-content,
            .dm-panel-text-content {
                background: ${theme.bgPrimary} !important;
                color: ${theme.textPrimary} !important;
            }

            /* 面板不支持的文档 */
            .dm-panel-doc-unsupported {
                color: ${theme.textSecondary} !important;
            }

            .dm-doc-unsupported-icon {
                color: #2b579a !important;
            }

            /* 面板预览错误 */
            .dm-panel-preview-error {
                color: ${theme.textSecondary} !important;
            }

            /* 面板不可用预览 */
            .dm-panel-unavailable {
                color: ${theme.textSecondary} !important;
            }

            .dm-unavailable-icon {
                color: ${theme.textSecondary} !important;
            }

            .dm-unavailable-message {
                color: ${theme.textSecondary} !important;
            }

            .dm-panel-unavailable-preview {
                color: ${theme.textSecondary} !important;
            }

            /* 面板文件信息 */
            .dm-info-filename {
                color: ${theme.textPrimary} !important;
            }

            .dm-info-details {
                color: ${theme.textSecondary} !important;
            }

            .dm-info-error {
                color: ${theme.textSecondary} !important;
            }

            /* 面板空表格 */
            .dm-panel-empty-table {
                color: ${theme.textSecondary} !important;
            }

            .dm-empty-table-icon {
                color: ${theme.textSecondary} !important;
            }

            .dm-empty-table-message {
                color: ${theme.textSecondary} !important;
            }

            /* 面板不支持的表格 */
            .dm-panel-unsupported-table {
                color: ${theme.textSecondary} !important;
            }

            .dm-unsupported-table-icon {
                color: #27ae60 !important;
            }

            /* 面板表格容器 */
            .dm-panel-table-container {
                background: ${theme.bgPrimary} !important;
            }

            /* 面板表格控件 */
            .dm-table-controls-panel {
                background: ${theme.bgSecondary} !important;
            }

            .dm-table-zoom-out-btn,
            .dm-table-zoom-in-btn,
            .dm-table-fit-btn,
            .dm-table-fullscreen-btn {
                background: ${theme.bgTertiary} !important;
                border: 1px solid ${theme.borderColor} !important;
                border-radius: 6px !important;
                color: ${theme.textPrimary} !important;
                padding: 6px 10px !important;
                cursor: pointer !important;
            }

            .dm-table-zoom-out-btn:hover,
            .dm-table-zoom-in-btn:hover,
            .dm-table-fit-btn:hover,
            .dm-table-fullscreen-btn:hover {
                background: ${theme.bgTertiary} !important;
                border-color: ${theme.accentColor} !important;
            }

            .dm-table-zoom-display {
                color: ${theme.textSecondary} !important;
                font-size: 11px !important;
                min-width: 45px !important;
                text-align: center !important;
            }

            .dm-table-truncated {
                color: ${theme.textSecondary} !important;
            }
        `;

        return theme;
    } catch (error) {
        console.error('[DataManager] Error applying theme:', error);
        return getComfyTheme();
    }
}

/**
 * 获取主题颜色（用于内联样式）
 * @param {string} colorName - 颜色名称
 * @returns {string} CSS 颜色值
 */
export function getThemeColor(colorName) {
    const theme = getComfyTheme();
    return theme[colorName] || colorName;
}
