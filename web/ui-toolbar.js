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
        onSshConnect,
        onSshDisconnect
    } = callbacks;

    const toolbar = document.createElement("div");
    toolbar.className = "dm-toolbar";
    toolbar.style.cssText = `
        display: flex;
        align-items: center;
        padding: 10px 15px;
        border-bottom: 1px solid;
        gap: 10px;
        flex-wrap: wrap;
    `;

    // 导航按钮
    toolbar.appendChild(createToolButton("pi-arrow-left", "上级", onNavigateUp));
    toolbar.appendChild(createToolButton("pi-home", "根目录", onNavigateHome));

    // 远程连接选择器
    toolbar.appendChild(createRemoteSelector({ onSshConnect, onSshDisconnect }));

    // 路径输入框
    const pathInput = document.createElement("input");
    pathInput.id = "dm-path-input";
    pathInput.className = "dm-input";
    pathInput.type = "text";
    pathInput.placeholder = "输入路径或 UNC 路径...";
    pathInput.style.cssText = `
        flex: 1;
        min-width: 200px;
        padding: 8px 12px;
        border: 1px solid;
        border-radius: 6px;
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
    sortSelect.className = "dm-select";
    sortSelect.style.cssText = `
        padding: 8px 12px;
        border: 1px solid;
        border-radius: 6px;
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
    toolbar.appendChild(actionGroup);

    return toolbar;
}

/**
 * 创建远程连接选择器
 */
function createRemoteSelector(callbacks) {
    const { onSshConnect, onSshDisconnect } = callbacks;

    const container = document.createElement("div");
    container.style.cssText = "display: flex; align-items: center; gap: 5px;";

    // 连接选择器
    const select = document.createElement("select");
    select.id = "dm-remote-select";
    select.style.cssText = `
        padding: 6px 10px;
        border: 1px solid #444;
        border-radius: 4px;
        font-size: 12px;
        max-width: 150px;
    `;

    // 初始化选项
    updateRemoteOptions(select);

    select.onchange = async (e) => {
        const value = e.target.value;

        if (value === '__new__') {
            const { createSshDialog } = await import('./ui-ssh-dialog.js');
            const dialog = createSshDialog({
                onConnect: (result) => {
                    window._remoteConnectionsState.active = result;
                    try {
                        localStorage.setItem('comfyui_datamanager_last_connection',
                            JSON.stringify(result));
                    } catch (err) {}
                    updateRemoteOptions(select);
                    if (onSshConnect) onSshConnect(result);
                }
            });
            document.body.appendChild(dialog);
            e.target.value = "";
        } else if (value === '__local__') {
            window._remoteConnectionsState.active = null;
            try {
                localStorage.removeItem('comfyui_datamanager_last_connection');
            } catch (err) {}
            updateRemoteOptions(select);
            if (onSshDisconnect) onSshDisconnect();
        } else if (value.startsWith('conn_')) {
            const connId = value.substring(5);
            const savedConn = window._remoteConnectionsState.saved.find(c => c.id === connId);
            if (savedConn) {
                try {
                    select.disabled = true;
                    select.innerHTML = '<option>连接中...</option>';
                    if (onSshConnect) onSshConnect({
                        connection_id: connId,
                        host: savedConn.host,
                        port: savedConn.port,
                        username: savedConn.username,
                        password: atob(savedConn.password)
                    });
                } catch (err) {
                    alert("连接失败: " + err.message);
                    updateRemoteOptions(select);
                }
            }
            e.target.value = "";
        }
    };

    container.appendChild(select);

    // 添加按钮
    const addBtn = document.createElement("button");
    addBtn.className = "comfy-btn";
    addBtn.innerHTML = '<i class="pi pi-plus"></i>';
    addBtn.style.cssText = "padding: 6px 10px;";
    addBtn.title = "添加 SSH 连接";
    addBtn.onclick = async () => {
        const { createSshDialog } = await import('./ui-ssh-dialog.js');
        const dialog = createSshDialog({
            onConnect: (result) => {
                window._remoteConnectionsState.active = result;
                try {
                    localStorage.setItem('comfyui_datamanager_last_connection',
                        JSON.stringify(result));
                } catch (err) {}
                updateRemoteOptions(select);
                if (onSshConnect) onSshConnect(result);
            }
        });
        document.body.appendChild(dialog);
    };
    container.appendChild(addBtn);

    // 状态指示器
    const status = document.createElement("span");
    status.id = "dm-ssh-status";
    status.style.cssText = "width: 8px; height: 8px; border-radius: 50%; background: #666;";
    container.appendChild(status);

    return container;
}

/**
 * 更新远程选择器选项
 */
function updateRemoteOptions(select) {
    const active = window._remoteConnectionsState.active;

    select.innerHTML = "";

    const defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.textContent = "本地";
    select.appendChild(defaultOpt);

    if (active) {
        const opt = document.createElement("option");
        opt.value = `active_${active.connection_id}`;
        opt.textContent = `${active.username}@${active.host}`;
        opt.style.color = "#27ae60";
        select.appendChild(opt);

        const status = document.getElementById("dm-ssh-status");
        if (status) {
            status.style.background = "#27ae60";
        }
    } else {
        const status = document.getElementById("dm-ssh-status");
        if (status) {
            status.style.background = "#666";
        }
    }

    // 已保存的连接
    if (window._remoteConnectionsState.saved.length > 0) {
        const divider = document.createElement("option");
        divider.disabled = true;
        divider.textContent = "── 已保存 ──";
        select.appendChild(divider);

        window._remoteConnectionsState.saved.forEach(conn => {
            const opt = document.createElement("option");
            opt.value = `conn_${conn.id}`;
            opt.textContent = conn.name || `${conn.username}@${conn.host}`;
            select.appendChild(opt);
        });
    }

    // 操作选项
    const divider2 = document.createElement("option");
    divider2.disabled = true;
    divider2.textContent = "── 操作 ──";
    select.appendChild(divider2);

    const newOpt = document.createElement("option");
    newOpt.value = "__new__";
    newOpt.textContent = "+ 新建 SSH";
    newOpt.style.color = "#3498db";
    select.appendChild(newOpt);

    if (active) {
        const discOpt = document.createElement("option");
        discOpt.value = "__local__";
        discOpt.textContent = "断开连接";
        discOpt.style.color = "#e74c3c";
        select.appendChild(discOpt);
    }
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
