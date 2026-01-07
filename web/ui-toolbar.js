/**
 * ui-toolbar.js - 工具栏
 */

/**
 * 创建工具栏
 * @param {object} callbacks - 回调函数对象
 * @returns {HTMLElement} 工具栏元素
 */
export function createToolbar(callbacks) {
    const {
        onNavigateUp,
        onNavigateHome,
        onSortChange,
        onViewToggle,
        onNewFile,
        onCopyPath,
        onDelete
    } = callbacks;

    const toolbar = document.createElement("div");
    toolbar.style.cssText = `
        display: flex;
        align-items: center;
        padding: 10px 15px;
        background: #222;
        border-bottom: 1px solid #2a2a2a;
        gap: 10px;
        flex-wrap: wrap;
    `;

    // 导航按钮
    toolbar.appendChild(createToolButton("pi-arrow-left", "上级", onNavigateUp));
    toolbar.appendChild(createToolButton("pi-home", "根目录", onNavigateHome));

    // 路径输入框
    const pathInput = document.createElement("input");
    pathInput.id = "dm-path-input";
    pathInput.type = "text";
    pathInput.placeholder = "输入路径...";
    pathInput.style.cssText = `
        flex: 1;
        min-width: 200px;
        padding: 8px 12px;
        background: #2a2a2a;
        border: 1px solid #3a3a3a;
        border-radius: 6px;
        color: #fff;
        font-size: 13px;
    `;
    pathInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            callbacks.onPathChange(pathInput.value);
        }
    });
    toolbar.appendChild(pathInput);

    // 排序选择
    const sortSelect = document.createElement("select");
    sortSelect.id = "dm-sort-select";
    sortSelect.style.cssText = `
        padding: 8px 12px;
        background: #2a2a2a;
        border: 1px solid #3a3a3a;
        border-radius: 6px;
        color: #fff;
        font-size: 13px;
        cursor: pointer;
    `;
    const sortOptions = [
        { value: 'name', label: '按名称' },
        { value: 'size', label: '按大小' },
        { value: 'modified', label: '按日期' }
    ];
    sortOptions.forEach(opt => {
        const option = document.createElement("option");
        option.value = opt.value;
        option.textContent = opt.label;
        sortSelect.appendChild(option);
    });
    sortSelect.onchange = (e) => onSortChange(e.target.value);
    toolbar.appendChild(sortSelect);

    // 视图切换按钮
    const viewToggle = document.createElement("button");
    viewToggle.className = "comfy-btn";
    viewToggle.id = "dm-view-toggle";
    viewToggle.innerHTML = '<i class="pi pi-th-large"></i>';
    viewToggle.style.cssText = "padding: 8px 12px;";
    viewToggle.title = "切换视图";
    viewToggle.onclick = onViewToggle;
    toolbar.appendChild(viewToggle);

    // 操作按钮组
    const actionGroup = document.createElement("div");
    actionGroup.style.cssText = "display: flex; gap: 5px; margin-left: auto;";
    actionGroup.appendChild(createToolButton("pi-plus", "新建", onNewFile));
    actionGroup.appendChild(createToolButton("pi-copy", "复制路径", onCopyPath));
    actionGroup.appendChild(createToolButton("pi-trash", "删除", onDelete));
    toolbar.appendChild(actionGroup);

    return toolbar;
}

/**
 * 创建工具栏按钮
 * @param {string} icon - 图标类名
 * @param {string} title - 标题
 * @param {Function} onClick - 点击回调
 * @returns {HTMLElement} 按钮元素
 */
export function createToolButton(icon, title, onClick) {
    const button = document.createElement("button");
    button.className = "comfy-btn";
    button.innerHTML = `<i class="pi ${icon}"></i>`;
    button.style.cssText = "padding: 8px 12px;";
    button.title = title;
    button.onclick = onClick;
    return button;
}
