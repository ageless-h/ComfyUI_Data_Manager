/**
 * ui-settings.js - 设置面板（远程连接管理）
 */

/**
 * 获取主题颜色
 */
function getThemeColors() {
    return {
        bgPrimary: '#1e1e1e',
        bgSecondary: '#2d2d2d',
        textPrimary: '#e0e0e0',
        textSecondary: '#999',
        borderColor: '#444',
        accentColor: '#3498db',
        successColor: '#27ae60',
        errorColor: '#e74c3c'
    };
}

/**
 * 动态导入 SSH API
 */
async function getSshApi() {
    const module = await import('./api-ssh.js');
    return {
        sshConnect: module.sshConnect,
        sshDisconnect: module.sshDisconnect
    };
}

/**
 * 打开设置面板
 * @param {object} options - 配置选项
 */
export function openSettingsPanel(options = {}) {
    const { onConnect, onDisconnect } = options;

    const overlay = document.createElement("div");
    overlay.className = "dm-modal-overlay";
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10002;
    `;

    const colors = getThemeColors();

    const panel = document.createElement("div");
    panel.style.cssText = `
        background: ${colors.bgPrimary};
        border: 1px solid ${colors.borderColor};
        border-radius: 12px;
        padding: 20px;
        width: 450px;
        max-width: calc(100vw - 40px);
        max-height: calc(100vh - 100px);
        overflow-y: auto;
    `;

    // 标题
    const title = document.createElement("div");
    title.style.cssText = `
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;
    title.innerHTML = `
        <span>设置</span>
        <button id="dm-settings-close" class="comfy-btn" style="padding: 4px 8px;">
            <i class="pi pi-times"></i>
        </button>
    `;
    panel.appendChild(title);

    // 创建 SSH 连接表单
    const sshSection = createSshSection();
    panel.appendChild(sshSection);

    // 已保存的连接列表
    const savedSection = createSavedConnectionsSection(onConnect, onDisconnect);
    panel.appendChild(savedSection);

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    // 事件绑定
    document.getElementById("dm-settings-close").onclick = () => overlay.remove();
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    return overlay;
}

/**
 * 创建 SSH 连接表单部分
 */
function createSshSection() {
    const colors = getThemeColors();

    const section = document.createElement("div");
    section.style.cssText = `
        margin-bottom: 24px;
        padding-bottom: 20px;
        border-bottom: 1px solid ${colors.borderColor};
    `;

    const title = document.createElement("div");
    title.style.cssText = `
        font-size: 13px;
        font-weight: 600;
        margin-bottom: 12px;
        color: ${colors.textPrimary};
    `;
    title.textContent = "新建 SSH 连接";
    section.appendChild(title);

    const form = document.createElement("div");
    form.style.cssText = "display: flex; flex-direction: column; gap: 10px;";

    form.appendChild(createSettingsInput("主机地址", "dm-ssh-host", "text", "192.168.1.100"));
    form.appendChild(createSettingsInput("端口", "dm-ssh-port", "number", "22"));
    form.appendChild(createSettingsInput("用户名", "dm-ssh-username", "text", ""));
    form.appendChild(createSettingsInput("密码", "dm-ssh-password", "password", ""));

    // 保存选项和连接按钮
    const btnRow = document.createElement("div");
    btnRow.style.cssText = "display: flex; align-items: center; gap: 12px; margin-top: 5px;";

    const saveLabel = document.createElement("label");
    saveLabel.style.cssText = "display: flex; align-items: center; gap: 6px; font-size: 12px; color: #aaa; cursor: pointer;";
    saveLabel.innerHTML = `
        <input type="checkbox" id="dm-ssh-save-creds">
        <span>保存凭据</span>
    `;
    btnRow.appendChild(saveLabel);

    const connectBtn = document.createElement("button");
    connectBtn.className = "comfy-btn";
    connectBtn.innerHTML = "连接";
    connectBtn.style.cssText = "padding: 8px 20px; margin-left: auto;";

    btnRow.appendChild(connectBtn);
    form.appendChild(btnRow);

    section.appendChild(form);

    // 连接按钮事件
    connectBtn.onclick = async () => {
        const host = document.getElementById("dm-ssh-host").value.trim();
        const port = document.getElementById("dm-ssh-port").value.trim();
        const username = document.getElementById("dm-ssh-username").value.trim();
        const password = document.getElementById("dm-ssh-password").value;
        const saveCreds = document.getElementById("dm-ssh-save-creds").checked;

        if (!host || !username) {
            alert("请填写主机地址和用户名");
            return;
        }

        connectBtn.disabled = true;
        connectBtn.textContent = "连接中...";

        try {
            const { sshConnect } = await getSshApi();
            const result = await sshConnect(host, port, username, password);

            // 保存凭据
            if (saveCreds) {
                const connInfo = {
                    id: result.connection_id,
                    name: `${username}@${host}`,
                    host,
                    port: parseInt(port) || 22,
                    username,
                    password: btoa(password),
                    created: new Date().toISOString()
                };
                window._remoteConnectionsState.saved.push(connInfo);
                try {
                    localStorage.setItem('comfyui_datamanager_remote_connections',
                        JSON.stringify(window._remoteConnectionsState.saved));
                } catch (e) {
                    console.warn('[DataManager] Failed to save connections:', e);
                }
            }

            // 通知回调
            if (onConnect) onConnect(result);

            // 关闭面板
            const overlay = document.getElementById("dm-settings-panel-overlay");
            if (overlay) overlay.remove();

        } catch (error) {
            alert("连接失败: " + error.message);
            connectBtn.disabled = false;
            connectBtn.textContent = "连接";
        }
    };

    return section;
}

/**
 * 创建已保存连接列表部分
 */
function createSavedConnectionsSection(onConnect, onDisconnect) {
    const colors = getThemeColors();

    const section = document.createElement("div");

    const title = document.createElement("div");
    title.style.cssText = `
        font-size: 13px;
        font-weight: 600;
        margin-bottom: 12px;
        color: ${colors.textPrimary};
    `;
    title.textContent = "已保存的连接";
    section.appendChild(title);

    const list = document.createElement("div");
    list.id = "dm-saved-connections-list";
    list.style.cssText = "display: flex; flex-direction: column; gap: 8px;";

    renderSavedConnectionsList(list, onConnect, onDisconnect);

    section.appendChild(list);

    return section;
}

/**
 * 渲染已保存连接列表
 */
function renderSavedConnectionsList(list, onConnect, onDisconnect) {
    const colors = getThemeColors();
    const saved = window._remoteConnectionsState.saved || [];
    const active = window._remoteConnectionsState.active;

    list.innerHTML = "";

    if (saved.length === 0) {
        list.innerHTML = `
            <div style="padding: 15px; text-align: center; color: #666; font-size: 12px; background: ${colors.bgSecondary}; border-radius: 6px;">
                暂无保存的连接
            </div>
        `;
        return;
    }

    saved.forEach(conn => {
        const item = document.createElement("div");
        item.style.cssText = `
            display: flex;
            align-items: center;
            padding: 10px 12px;
            background: ${colors.bgSecondary};
            border-radius: 6px;
            gap: 10px;
        `;

        const isActive = active && active.connection_id === conn.id;

        // 连接状态指示
        const status = document.createElement("div");
        status.style.cssText = `
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: ${isActive ? colors.successColor : '#666'};
            flex-shrink: 0;
        `;
        item.appendChild(status);

        // 连接信息
        const info = document.createElement("div");
        info.style.cssText = "flex: 1;";
        info.innerHTML = `
            <div style="font-size: 13px; color: ${colors.textPrimary};">${conn.name || conn.host}</div>
            <div style="font-size: 11px; color: #666; margin-top: 2px;">${conn.username}@${conn.host}:${conn.port}</div>
        `;
        item.appendChild(info);

        // 操作按钮
        const actions = document.createElement("div");
        actions.style.cssText = "display: flex; gap: 6px;";

        if (isActive) {
            const disconnectBtn = document.createElement("button");
            disconnectBtn.className = "comfy-btn";
            disconnectBtn.textContent = "断开";
            disconnectBtn.style.cssText = "padding: 4px 10px; font-size: 11px; background: #c0392b;";
            disconnectBtn.onclick = () => {
                if (onDisconnect) onDisconnect();
                renderSavedConnectionsList(list, onConnect, onDisconnect);
            };
            actions.appendChild(disconnectBtn);
        } else {
            const connectBtn = document.createElement("button");
            connectBtn.className = "comfy-btn";
            connectBtn.textContent = "连接";
            connectBtn.style.cssText = "padding: 4px 10px; font-size: 11px;";
            connectBtn.onclick = async () => {
                connectBtn.disabled = true;
                connectBtn.textContent = "连接中...";
                try {
                    const { sshConnect } = await getSshApi();
                    const result = await sshConnect(conn.host, conn.port, conn.username, atob(conn.password));
                    if (onConnect) onConnect(result);
                    renderSavedConnectionsList(list, onConnect, onDisconnect);
                } catch (error) {
                    alert("连接失败: " + error.message);
                    connectBtn.disabled = false;
                    connectBtn.textContent = "连接";
                }
            };
            actions.appendChild(connectBtn);
        }

        // 删除按钮
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "comfy-btn";
        deleteBtn.innerHTML = '<i class="pi pi-trash"></i>';
        deleteBtn.style.cssText = "padding: 4px 8px; font-size: 11px;";
        deleteBtn.title = "删除";
        deleteBtn.onclick = () => {
            if (confirm(`确定删除连接 "${conn.name}"？`)) {
                window._remoteConnectionsState.saved = window._remoteConnectionsState.saved.filter(c => c.id !== conn.id);
                try {
                    localStorage.setItem('comfyui_datamanager_remote_connections',
                        JSON.stringify(window._remoteConnectionsState.saved));
                } catch (e) {}
                renderSavedConnectionsList(list, onConnect, onDisconnect);
            }
        };
        actions.appendChild(deleteBtn);

        item.appendChild(actions);
        list.appendChild(item);
    });
}

/**
 * 创建设置输入框
 */
function createSettingsInput(label, id, type, placeholder) {
    const container = document.createElement("div");
    container.style.cssText = "display: flex; flex-direction: column; gap: 4px;";

    const labelEl = document.createElement("label");
    labelEl.style.cssText = "font-size: 11px; color: #aaa;";
    labelEl.textContent = label;

    const input = document.createElement("input");
    input.id = id;
    input.type = type;
    input.className = "dm-input";
    input.placeholder = placeholder;
    input.style.cssText = `
        padding: 8px 10px;
        border: 1px solid #444;
        border-radius: 4px;
        font-size: 13px;
        background: #2d2d2d;
        color: #e0e0e0;
    `;

    container.appendChild(labelEl);
    container.appendChild(input);
    return container;
}

/**
 * 刷新已保存连接列表
 */
export function refreshSavedConnectionsList() {
    const list = document.getElementById("dm-saved-connections-list");
    if (list) {
        renderSavedConnectionsList(list, null, null);
    }
}
