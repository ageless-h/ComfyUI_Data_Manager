/**
 * ui-preview.js - 右侧预览面板
 */

import { createFormatSelector, getFormatsForType, detectFormatFromFilename } from './ui-format-selector.js';

/**
 * 检查节点连接状态并更新格式选择器
 */
export function checkNodeConnectionAndUpdateFormat() {
    try {
        console.log("[DataManager] checkNodeConnectionAndUpdateFormat called");
        const nodes = window.app?.graph?._nodes || [];
        const inputPathConfigNodes = nodes.filter(n => n.comfyClass === "InputPathConfig");
        console.log("[DataManager] Found InputPathConfig nodes:", inputPathConfigNodes.length);

        if (inputPathConfigNodes.length === 0) {
            return;
        }

        // 检查第一个 InputPathConfig 节点的连接
        const node = inputPathConfigNodes[0];
        const inputs = node.inputs || [];
        const fileInput = inputs.find(i => i.name === 'file_input');
        console.log("[DataManager] fileInput link:", fileInput ? fileInput.link : null);

        if (fileInput && fileInput.link) {
            // 找到连接的源节点
            const link = fileInput.link;
            const sourceNodeId = link.origin_id;
            const sourceNode = window.app.graph.getNodeById(sourceNodeId);
            console.log("[DataManager] Source node:", sourceNode ? sourceNode.type : null);

            if (sourceNode) {
                const detectedType = detectTypeFromSourceNode(sourceNode);
                console.log("[DataManager] Auto-detected type from connected node:", detectedType);
                console.log("[DataManager] Calling updateFormatSelector with:", detectedType);
                updateFormatSelector(detectedType, null, null);
            }
        } else {
            console.log("[DataManager] No file input link found");
        }
    } catch (e) {
        console.log("[DataManager] Error checking node connection:", e);
    }
}

/**
 * 根据节点类型检测数据类型
 * @param {Object} node - 源节点
 * @returns {string} 检测到的类型
 */
function detectTypeFromSourceNode(node) {
    const nodeType = node.type || node.comfyClass || "";

    // 根据节点类型映射到数据类型
    const typeMapping = {
        "LoadImage": "IMAGE",
        "LoadVideo": "VIDEO",
        "LoadAudio": "AUDIO",
        "EmptyLatentImage": "LATENT",
        "VAEDecode": "IMAGE",
        "CheckpointLoaderSimple": "MODEL",
    };

    // 检查输出端口类型
    if (node.outputs && node.outputs.length > 0) {
        for (const output of node.outputs) {
            if (output.type === "IMAGE") return "IMAGE";
            if (output.type === "LATENT") return "LATENT";
            if (output.type === "MASK") return "MASK";
            if (output.type === "VIDEO") return "VIDEO";
            if (output.type === "AUDIO") return "AUDIO";
            if (output.type === "MODEL") return "MODEL";
            if (output.type === "VAE") return "VAE";
            if (output.type === "CLIP") return "CLIP";
        }
    }

    // 使用节点类型映射
    for (const [key, value] of Object.entries(typeMapping)) {
        if (nodeType.includes(key)) {
            return value;
        }
    }

    return "IMAGE"; // 默认返回 IMAGE
}

/**
 * 创建预览面板
 * @param {object} callbacks - 回调函数
 * @returns {HTMLElement} 面板元素
 */
export function createPreviewPanel(callbacks) {
    const { onOpenFloating, onCopyPath, onDelete } = callbacks;

    const panel = document.createElement("div");
    panel.id = "dm-preview-panel";
    panel.style.cssText = `
        flex: 0 0 400px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    `;

    const header = document.createElement("div");
    header.className = "dm-preview-header";
    header.style.cssText = `
        padding: 15px;
        border-bottom: 1px solid;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
    `;
    header.innerHTML = `
        <h3 class="dm-title" style="margin: 0; font-size: 14px;">
            <i class="pi pi-eye"></i> 预览
        </h3>
        <div style="display: flex; gap: 5px;">
            <button id="dm-copy-path-btn" class="comfy-btn dm-icon-btn" style="padding: 6px 12px; font-size: 12px;">
                <i class="pi pi-copy"></i>
            </button>
            <button id="dm-delete-file-btn" class="comfy-btn dm-icon-btn" style="padding: 6px 12px; font-size: 12px;">
                <i class="pi pi-trash"></i>
            </button>
            <button id="dm-open-floating-preview-btn" class="comfy-btn dm-icon-btn" style="display: none; padding: 6px 12px; font-size: 12px;">
                <i class="pi pi-window-maximize"></i>
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

    // 格式选择器区域
    const formatSection = document.createElement("div");
    formatSection.id = "dm-format-section";
    formatSection.style.cssText = `
        padding: 15px;
        background: #1f1f1f;
        border-top: 1px solid #2a2a2a;
        display: none;
    `;
    formatSection.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #666;">
            <i class="pi pi-cog" style="font-size: 32px; opacity: 0.5;"></i>
            <div style="margin-top: 10px; font-size: 12px;">连接节点以启用格式选择</div>
        </div>
    `;
    panel.appendChild(formatSection);

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

    // 绑定按钮事件
    const floatingBtn = header.querySelector('#dm-open-floating-preview-btn');
    const copyPathBtn = header.querySelector('#dm-copy-path-btn');
    const deleteBtn = header.querySelector('#dm-delete-file-btn');

    if (floatingBtn && onOpenFloating) {
        floatingBtn.onclick = onOpenFloating;
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
 * 更新格式选择器
 * @param {string} detectedType - 检测到的类型
 * @param {string} currentFormat - 当前格式
 * @param {Function} onFormatChange - 格式变化回调
 */
export function updateFormatSelector(detectedType, currentFormat = null, onFormatChange = null) {
    console.log("[DataManager] updateFormatSelector called with:", detectedType);
    const formatSection = document.getElementById("dm-format-section");
    console.log("[DataManager] formatSection found:", !!formatSection);
    if (!formatSection) return;

    // 清空现有内容
    formatSection.innerHTML = '';

    if (!detectedType) {
        console.log("[DataManager] No detected type, hiding format selector");
        formatSection.style.display = 'none';
        return;
    }

    console.log("[DataManager] Showing format selector for type:", detectedType);
    formatSection.style.display = 'block';

    const selector = createFormatSelector({
        detectedType: detectedType,
        selectedFormat: currentFormat,
        onFormatChange: onFormatChange,
        compact: true
    });

    formatSection.appendChild(selector);
    console.log("[DataManager] Format selector appended");
}

/**
 * 隐藏格式选择器
 */
export function hideFormatSelector() {
    const formatSection = document.getElementById("dm-format-section");
    if (formatSection) {
        formatSection.style.display = 'none';
    }
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
