/**
 * utils-drag.js - 拖拽功能
 */

/**
 * 设置窗口拖动
 * 每次拖动时动态添加监听器，松开后立即移除
 * @param {HTMLElement} windowEl - 窗口元素
 * @param {HTMLElement} header - 拖动区域元素
 */
export function setupWindowDrag(windowEl, header) {
    // 禁用原生拖拽，防止重影
    windowEl.draggable = false;
    header.draggable = false;

    // 防止原生拖拽事件（防止重影）
    windowEl.addEventListener("dragstart", (e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
    });

    header.addEventListener("mousedown", (e) => {
        // 排除按钮和图标
        if (e.target.tagName === "BUTTON" || e.target.tagName === "I") return;

        // 全屏状态下不允许拖动
        if (windowEl.dataset.fullscreen === "true") return;

        // 阻止默认行为（包括原生拖拽）
        e.preventDefault();

        const rect = windowEl.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        // 移除过渡效果以提高性能
        windowEl.style.transition = "none";

        // 清除 transform，改用 left/top 定位
        // 保存当前的实际位置
        windowEl.style.transform = "none";
        windowEl.style.left = rect.left + "px";
        windowEl.style.top = rect.top + "px";

        // 标记正在拖动
        windowEl._isDragging = true;

        // 定义 mousemove 处理函数
        const mouseMoveHandler = (e) => {
            if (!windowEl._isDragging) return;
            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;
            windowEl.style.left = Math.max(0, x) + "px";
            windowEl.style.top = Math.max(0, y) + "px";
        };

        // 定义 mouseup 处理函数
        const mouseUpHandler = () => {
            // 恢复过渡效果
            windowEl.style.transition = "";

            // 清除拖动标记
            windowEl._isDragging = false;

            // 立即移除监听器
            document.removeEventListener("mousemove", mouseMoveHandler);
            document.removeEventListener("mouseup", mouseUpHandler);
        };

        // 添加监听器到 document（确保鼠标移出窗口也能响应）
        document.addEventListener("mousemove", mouseMoveHandler);
        document.addEventListener("mouseup", mouseUpHandler);
    });
}

/**
 * 清理窗口拖动
 * @param {HTMLElement} windowEl - 窗口元素
 */
export function cleanupWindowDrag(windowEl) {
    if (windowEl._isDragging) {
        windowEl._isDragging = false;
        windowEl.style.transition = "";
    }
}
