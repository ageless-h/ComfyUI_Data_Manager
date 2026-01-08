/**
 * ui-preview.js - 右侧预览面板
 */

/**
 * 创建预览面板
 * @param {object} callbacks - 回调函数
 * @returns {HTMLElement} 面板元素
 */
export function createPreviewPanel(callbacks) {
    const { onOpenFloating, onOpenExternally, onCopyPath, onDelete } = callbacks;

    const panel = document.createElement("div");
    panel.id = "dm-preview-panel";
    panel.style.cssText = `
        flex: 0 0 400px;
        display: flex;
        flex-direction: column;
        background: #1f1f1f;
        overflow: hidden;
    `;

    const header = document.createElement("div");
    header.style.cssText = `
        padding: 15px;
        background: #252525;
        border-bottom: 1px solid #2a2a2a;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
    `;
    header.innerHTML = `
        <h3 style="margin: 0; color: #fff; font-size: 14px;">
            <i class="pi pi-eye"></i> 预览
        </h3>
        <div style="display: flex; gap: 5px;">
            <button id="dm-open-floating-preview-btn" class="comfy-btn" style="display: none; padding: 6px 12px; font-size: 12px;">
                <i class="pi pi-window-maximize"></i> 浮窗
            </button>
            <button id="dm-open-preview-btn" class="comfy-btn" style="display: none; padding: 6px 12px; font-size: 12px;">
                <i class="pi pi-external-link"></i> 打开
            </button>
        </div>
    `;
    panel.appendChild(header);

    const content = document.createElement("div");
    content.id = "dm-preview-content";
    content.style.cssText = `
        flex: 1;
        overflow-y: auto;
        padding: 15px;
        display: flex;
        flex-direction: column;
        gap: 15px;
    `;
    content.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
            <i class="pi pi-file" style="font-size: 48px; opacity: 0.5;"></i>
            <div style="margin-top: 15px; font-size: 13px;">选择文件以预览</div>
        </div>
    `;
    panel.appendChild(content);

    // 文件信息区域
    const infoSection = document.createElement("div");
    infoSection.id = "dm-file-info";
    infoSection.style.cssText = `
        padding: 15px;
        background: #252525;
        border-top: 1px solid #2a2a2a;
        font-size: 12px;
        color: #888;
    `;
    infoSection.innerHTML = '<div style="text-align: center;">未选择文件</div>';
    panel.appendChild(infoSection);

    // 操作按钮区域
    const actionBar = document.createElement("div");
    actionBar.id = "dm-preview-action-bar";
    actionBar.style.cssText = `
        padding: 12px 15px;
        background: #222;
        border-top: 1px solid #2a2a2a;
        display: flex;
        gap: 8px;
        justify-content: center;
    `;
    actionBar.innerHTML = `
        <button id="dm-copy-path-btn" class="comfy-btn" style="flex: 1; padding: 10px; background: #3a3a3a; border: 1px solid #4a4a4a; border-radius: 6px; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 12px;">
            <i class="pi pi-copy"></i>
            <span>复制路径</span>
        </button>
        <button id="dm-delete-file-btn" class="comfy-btn" style="flex: 1; padding: 10px; background: #3a3a3a; border: 1px solid #4a4a4a; border-radius: 6px; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 12px;">
            <i class="pi pi-trash"></i>
            <span>删除</span>
        </button>
    `;
    panel.appendChild(actionBar);

    // 绑定按钮事件
    const floatingBtn = header.querySelector('#dm-open-floating-preview-btn');
    const openBtn = header.querySelector('#dm-open-preview-btn');
    const copyPathBtn = actionBar.querySelector('#dm-copy-path-btn');
    const deleteBtn = actionBar.querySelector('#dm-delete-file-btn');

    if (floatingBtn && onOpenFloating) {
        floatingBtn.onclick = onOpenFloating;
    }
    if (openBtn && onOpenExternally) {
        openBtn.onclick = onOpenExternally;
    }
    if (copyPathBtn && onCopyPath) {
        copyPathBtn.onclick = onCopyPath;
    }
    if (deleteBtn && onDelete) {
        deleteBtn.onclick = onDelete;
    }

    return panel;
}

/**
 * 创建状态栏
 * @returns {HTMLElement} 状态栏元素
 */
export function createStatusBar() {
    // 创建底部区域容器（包含 Dock 栏和状态栏）
    const bottomArea = document.createElement("div");
    bottomArea.className = "dm-bottom-area";
    bottomArea.style.cssText = `
        display: flex;
        flex-direction: column;
    `;

    // 创建 Dock 栏
    const dock = document.createElement("div");
    dock.id = "dm-preview-dock";
    dock.className = "dm-preview-dock";
    dock.style.cssText = `
        min-height: 0;
        max-height: 0;
        padding: 0 15px;
        background: linear-gradient(to bottom, #252525, #1a1a1a);
        border-top: 1px solid #2a2a2a;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        overflow-x: auto;
        overflow-y: hidden;
        transition: min-height 0.3s ease, max-height 0.3s ease, padding 0.3s ease;
    `;

    // 创建状态栏
    const bar = document.createElement("div");
    bar.id = "dm-status-bar";
    bar.style.cssText = `
        padding: 8px 15px;
        background: #222;
        border-top: 1px solid #2a2a2a;
        font-size: 11px;
        color: #888;
        display: flex;
        justify-content: space-between;
    `;
    bar.textContent = "就绪";

    bottomArea.appendChild(dock);
    bottomArea.appendChild(bar);

    return bottomArea;
}
