/**
 * ui-toolbar.js - 工具栏
 */

/**
 * 动态导入设置面板
 */
async function getSettingsModule() {
    const module = await import('./ui-settings.js');
    return {
        openSettingsPanel: module.openSettingsPanel
    };
}

/**
 * 动态导入 SSH API
 */
async function getSshApi() {
    const module = await import('./api-ssh.js');
    return {
        sshDisconnect: module.sshDisconnect
    };
}

/**
 * 创建远程设备选择框
 * @param {object} callbacks - 回调函数
 * @returns {HTMLElement} 选择框容器
 */
function createRemoteSelector(callbacks) {
    const { onSshConnect, onSshDisconnect } = callbacks;

    const container = document.createElement("div");
    container.style.cssText = "display: flex; align-items: center; gap: 5px;";

    // 设备选择下拉框
    const select = document.createElement("select");
    select.id = "dm-remote-select";
    select.style.cssText = `
        padding: 8px 12px;
        border: 1px solid #444;
        border-radius: 6px;
        font-size: 13px;
        min-width: 150px;
        cursor: pointer;
    `;

    // 初始化选项
    updateRemoteOptions(select, onSshConnect, onSshDisconnect);

    select.onchange = async (e) => {
        const value = e.target.value;

        if (value === '__local__') {
            // 切换到本地
            window._remoteConnectionsState.active = null;
            try {
                localStorage.removeItem('comfyui_datamanager_last_connection');
            } catch (err) {}
            updateRemoteOptions(select, onSshConnect, onSshDisconnect);
            updateConnectionStatus();
            if (onSshDisconnect) onSshDisconnect();
        } else if (value.startsWith('conn_')) {
            // 连接已保存的设备
            const connId = value.substring(5);
            const savedConn = window._remoteConnectionsState.saved.find(c => c.id === connId);
            if (savedConn) {
                try {
                    select.disabled = true;
                    const opt = document.createElement("option");
                    opt.textContent = "连接中...";
                    select.innerHTML = "";
                    select.appendChild(opt);

                    if (onSshConnect) onSshConnect({
                        connection_id: connId,
                        host: savedConn.host,
                        port: savedConn.port,
                        username: savedConn.username,
                        password: atob(savedConn.password)
                    });
                } catch (err) {
                    alert("连接失败: " + err.message);
                    updateRemoteOptions(select, onSshConnect, onSshDisconnect);
                }
            }
        }
        e.target.value = "";
    };

    container.appendChild(select);

    return container;
}

/**
 * 更新远程选择框选项
 */
function updateRemoteOptions(select, onSshConnect, onSshDisconnect) {
    const active = window._remoteConnectionsState.active;

    select.innerHTML = "";

    // 本地选项
    const localOpt = document.createElement("option");
    localOpt.value = "__local__";
    localOpt.textContent = "本地";
    select.appendChild(localOpt);

    // 已保存的连接
    if (window._remoteConnectionsState.saved.length > 0) {
        window._remoteConnectionsState.saved.forEach(conn => {
            const opt = document.createElement("option");
            opt.value = `conn_${conn.id}`;
            opt.textContent = conn.name || `${conn.username}@${conn.host}`;
            if (active && active.connection_id === conn.id) {
                opt.style.color = "#27ae60";
            }
            select.appendChild(opt);
        });
    }
}

/**
 * 创建设置按钮
 * @param {object} callbacks - 回调函数
 * @returns {HTMLElement} 按钮
 */
function createSettingsButton(callbacks) {
    const { onSshConnect, onSshDisconnect } = callbacks;

    const button = document.createElement("button");
    button.className = "comfy-btn";
    button.id = "dm-settings-btn";
    button.innerHTML = '<i class="pi pi-cog"></i>';
    button.style.cssText = `
        padding: 8px 12px;
        border: 1px solid #444;
        border-radius: 6px;
        cursor: pointer;
        background: transparent;
        color: #ccc;
    `;
    button.title = "连接管理";

    button.onclick = async () => {
        const { openSettingsPanel } = await getSettingsModule();
        openSettingsPanel({
            onConnect: (result) => {
                window._remoteConnectionsState.active = result;
                try {
                    localStorage.setItem('comfyui_datamanager_last_connection',
                        JSON.stringify(result));
                } catch (err) {}
                updateConnectionStatus();
                if (onSshConnect) onSshConnect(result);
            },
            onDisconnect: async () => {
                const conn = window._remoteConnectionsState.active;
                if (conn && conn.connection_id) {
                    try {
                        const { sshDisconnect } = await getSshApi();
                        await sshDisconnect(conn.connection_id);
                    } catch (e) {
                        console.log('[DataManager] SSH disconnect error:', e);
                    }
                }
                window._remoteConnectionsState.active = null;
                try {
                    localStorage.removeItem('comfyui_datamanager_last_connection');
                } catch (err) {}
                updateConnectionStatus();
                if (onSshDisconnect) onSshDisconnect();
            }
        });
    };

    return button;
}

/**
 * 更新连接状态指示器
 */
function updateConnectionStatus() {
    const indicator = document.getElementById("dm-connection-indicator");
    const statusText = document.getElementById("dm-connection-status");
    const active = window._remoteConnectionsState.active;

    if (indicator) {
        indicator.style.background = active ? '#27ae60' : '#666';
    }
    if (statusText) {
        if (active) {
            statusText.textContent = `SSH: ${active.username}@${active.host}`;
        } else {
            statusText.textContent = "";
        }
    }
}

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

    // 远程设备选择框
    toolbar.appendChild(createRemoteSelector({ onSshConnect, onSshDisconnect }));

    // 路径输入框
    const pathInput = document.createElement("input");
    pathInput.id = "dm-path-input";
    pathInput.className = "dm-input";
    pathInput.type = "text";
    pathInput.placeholder = "输入路径...";
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

    // 操作按钮组（右侧）
    const actionGroup = document.createElement("div");
    actionGroup.style.cssText = "display: flex; gap: 5px; margin-left: auto;";
    actionGroup.appendChild(createSettingsButton({ onSshConnect, onSshDisconnect }));
    actionGroup.appendChild(createToolButton("pi-plus", "新建", onNewFile));
    toolbar.appendChild(actionGroup);

    // 延迟更新连接状态
    setTimeout(updateConnectionStatus, 100);

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

/**
 * 更新连接状态显示
 */
export function refreshConnectionUI() {
    updateConnectionStatus();
}
