/**
 * ui-format-selector.js - 格式选择器组件
 */

// 格式到类型的映射配置
export const FORMAT_TYPE_MAP = {
    "png": { type: "IMAGE", label: "PNG 图像", description: "无损压缩，支持透明" },
    "jpg": { type: "IMAGE", label: "JPEG 图像", description: "有损压缩，文件较小" },
    "webp": { type: "IMAGE", label: "WebP 图像", description: "现代格式，高压缩比" },
    "mp4": { type: "VIDEO", label: "MP4 视频", description: "通用视频格式" },
    "webm": { type: "VIDEO", label: "WebM 视频", description: "优化的网络视频" },
    "avi": { type: "VIDEO", label: "AVI 视频", description: "经典视频格式" },
    "mp3": { type: "AUDIO", label: "MP3 音频", description: "通用音频格式" },
    "wav": { type: "AUDIO", label: "WAV 音频", description: "无损音频" },
    "flac": { type: "AUDIO", label: "FLAC 音频", description: "无损压缩音频" },
    "ogg": { type: "AUDIO", label: "OGG 音频", description: "开源音频格式" },
    "latent": { type: "LATENT", label: "Latent", description: "ComfyUI Latent 数据" },
    "json": { type: "DATA", label: "JSON", description: "通用数据格式" },
    "txt": { type: "DATA", label: "文本", description: "纯文本格式" },
};

// 类型到格式的映射
export const TYPE_FORMATS = {
    "IMAGE": ["png", "jpg", "webp"],
    "VIDEO": ["mp4", "webm", "avi"],
    "AUDIO": ["mp3", "wav", "flac", "ogg"],
    "LATENT": ["latent"],
    "MASK": ["png"],
    "CONDITIONING": ["json"],
    "STRING": ["txt", "json"],
};

/**
 * 获取类型支持的格式列表
 * @param {string} type - 数据类型
 * @returns {string[]} 格式列表
 */
export function getFormatsForType(type) {
    const typeKey = type.toUpperCase();
    return TYPE_FORMATS[typeKey] || ["json"];
}

/**
 * 创建格式选择器
 * @param {object} options - 配置选项
 * @returns {HTMLElement} 格式选择器元素
 */
export function createFormatSelector(options = {}) {
    const {
        detectedType = null,
        selectedFormat = null,
        onFormatChange = null,
        showTypeIndicator = true,
        compact = false
    } = options;

    const container = document.createElement("div");
    container.className = "dm-format-selector";
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 15px;
        background: #252525;
        border-radius: 8px;
        border: 1px solid #3a3a3a;
    `;

    // 类型指示器
    if (showTypeIndicator && detectedType) {
        const typeIndicator = document.createElement("div");
        typeIndicator.className = "dm-type-indicator";
        typeIndicator.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: ${getTypeColor(detectedType)}20;
            border-left: 3px solid ${getTypeColor(detectedType)};
            border-radius: 4px;
            font-size: 12px;
            color: ${getTypeColor(detectedType)};
        `;
        typeIndicator.innerHTML = `
            <i class="pi ${getTypeIcon(detectedType)}"></i>
            <span style="font-weight: 600;">${detectedType}</span>
            <span style="color: #888;">检测到</span>
        `;
        container.appendChild(typeIndicator);
    }

    // 格式选择区域
    const formatSection = document.createElement("div");
    formatSection.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 8px;
    `;

    const label = document.createElement("label");
    label.style.cssText = `
        font-size: 12px;
        color: #aaa;
        font-weight: 500;
    `;
    label.textContent = "输出格式:";
    formatSection.appendChild(label);

    const formats = detectedType ? getFormatsForType(detectedType) : Object.keys(FORMAT_TYPE_MAP);
    const defaultFormat = selectedFormat || (detectedType ? formats[0] : "png");

    if (compact) {
        // 紧凑模式：使用下拉选择
        const select = document.createElement("select");
        select.id = "dm-format-select";
        select.className = "comfy-combo";
        select.style.cssText = `
            width: 100%;
            padding: 8px 12px;
            background: #2a2a2a;
            border: 1px solid #3a3a3a;
            border-radius: 6px;
            color: #fff;
            font-size: 13px;
            cursor: pointer;
        `;
        formats.forEach(fmt => {
            const option = document.createElement("option");
            option.value = fmt;
            option.textContent = fmt.toUpperCase();
            if (fmt === defaultFormat) option.selected = true;
            select.appendChild(option);
        });
        select.onchange = (e) => {
            if (onFormatChange) {
                onFormatChange(e.target.value);
            }
            updateFormatDescription(e.target.value);
        };
        formatSection.appendChild(select);
    } else {
        // 完整模式：使用按钮组
        const buttonGroup = document.createElement("div");
        buttonGroup.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        `;
        buttonGroup.id = "dm-format-buttons";

        formats.forEach(fmt => {
            const btn = document.createElement("button");
            btn.className = "comfy-btn dm-format-btn";
            btn.dataset.format = fmt;
            btn.style.cssText = `
                padding: 8px 16px;
                background: ${fmt === defaultFormat ? "#3a3a3a" : "#2a2a2a"};
                border: 1px solid ${fmt === defaultFormat ? "#9b59b6" : "#3a3a3a"};
                border-radius: 6px;
                color: ${fmt === defaultFormat ? "#9b59b6" : "#fff"};
                font-size: 12px;
                font-weight: ${fmt === defaultFormat ? "600" : "400"};
                cursor: pointer;
                transition: all 0.2s;
            `;
            btn.textContent = fmt.toUpperCase();
            btn.onclick = () => {
                // 更新所有按钮状态
                buttonGroup.querySelectorAll('.dm-format-btn').forEach(b => {
                    b.style.background = "#2a2a2a";
                    b.style.borderColor = "#3a3a3a";
                    b.style.color = "#fff";
                    b.style.fontWeight = "400";
                });
                // 激活当前按钮
                btn.style.background = "#3a3a3a";
                btn.style.borderColor = "#9b59b6";
                btn.style.color = "#9b59b6";
                btn.style.fontWeight = "600";
                if (onFormatChange) {
                    onFormatChange(fmt);
                }
                updateFormatDescription(fmt);
            };
            buttonGroup.appendChild(btn);
        });
        formatSection.appendChild(buttonGroup);
    }

    container.appendChild(formatSection);

    // 格式描述
    const description = document.createElement("div");
    description.id = "dm-format-description";
    description.style.cssText = `
        font-size: 11px;
        color: #888;
        padding: 8px 12px;
        background: #1a1a1a;
        border-radius: 4px;
        line-height: 1.4;
    `;
    const formatInfo = FORMAT_TYPE_MAP[defaultFormat] || FORMAT_TYPE_MAP["png"];
    description.innerHTML = `
        <strong>${defaultFormat.toUpperCase()}</strong>: ${formatInfo.description}
    `;
    container.appendChild(description);

    function updateFormatDescription(format) {
        const info = FORMAT_TYPE_MAP[format];
        if (info && description) {
            description.innerHTML = `
                <strong>${format.toUpperCase()}</strong>: ${info.description}
            `;
        }
    }

    return container;
}

/**
 * 获取类型对应的图标
 * @param {string} type - 数据类型
 * @returns {string} 图标类名
 */
function getTypeIcon(type) {
    const icons = {
        "IMAGE": "pi-image",
        "VIDEO": "pi-video",
        "AUDIO": "pi-volume-up",
        "LATENT": "pi-box",
        "MASK": "pi-eye",
        "CONDITIONING": "pi-code",
        "STRING": "pi-file",
    };
    return icons[type] || "pi-file";
}

/**
 * 获取类型对应的颜色
 * @param {string} type - 数据类型
 * @returns {string} 颜色值
 */
function getTypeColor(type) {
    const colors = {
        "IMAGE": "#e74c3c",
        "VIDEO": "#9b59b6",
        "AUDIO": "#3498db",
        "LATENT": "#f39c12",
        "MASK": "#e67e22",
        "CONDITIONING": "#1abc9c",
        "STRING": "#95a5a6",
    };
    return colors[type] || "#7f8c8d";
}

/**
 * 从文件名检测格式
 * @param {string} filename - 文件名
 * @returns {string} 格式
 */
export function detectFormatFromFilename(filename) {
    if (!filename) return "png";
    const ext = filename.split('.').pop().toLowerCase();
    // 去掉点号
    return ext.replace(/^\./, '');
}

/**
 * 根据格式推断类型
 * @param {string} format - 格式
 * @returns {string} 类型
 */
export function getTypeFromFormat(format) {
    const info = FORMAT_TYPE_MAP[format];
    return info ? info.type : "DATA";
}
