/**
 * ui-ssh-dialog.js - SSH 连接对话框
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
        sshConnect: module.sshConnect
    };
}

/**
 * 创建 SSH 连接对话框
 * @param {object} options - 配置选项
 * @param {Function} options.onConnect - 连接成功回调
 * @returns {HTMLElement} 对话框元素
 */
export function createSshDialog(options = {}) {
    const { onConnect } = options;

    const dialog = document.createElement("div");
    dialog.className = "dm-modal-overlay";
    dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
    `;

    const colors = getThemeColors();

    const modal = document.createElement("div");
    modal.style.cssText = `
        background: ${colors.bgPrimary};
        border: 1px solid ${colors.borderColor};
        border-radius: 12px;
        padding: 20px;
        width: 380px;
        max-width: calc(100vw - 40px);
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
    title.innerHTML = `<span>SSH 连接</span>`;
    modal.appendChild(title);

    // 表单
    const form = document.createElement("div");
    form.style.cssText = "display: flex; flex-direction: column; gap: 12px;";

    // 主机
    form.appendChild(createInput("主机地址", "dm-ssh-host", "text", "192.168.1.100"));
    // 端口
    form.appendChild(createInput("端口", "dm-ssh-port", "number", "22"));
    // 用户名
    form.appendChild(createInput("用户名", "dm-ssh-username", "text", ""));
    // 密码
    form.appendChild(createInput("密码", "dm-ssh-password", "password", ""));

    // 保存选项
    const saveLabel = document.createElement("label");
    saveLabel.style.cssText = "display: flex; align-items: center; gap: 8px; font-size: 12px;";
    saveLabel.innerHTML = `
        <input type="checkbox" id="dm-ssh-save-creds">
        <span>保存凭据</span>
    `;
    form.appendChild(saveLabel);

    modal.appendChild(form);

    // 按钮
    const btnGroup = document.createElement("div");
    btnGroup.style.cssText = "display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;";

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "comfy-btn";
    cancelBtn.textContent = "取消";
    cancelBtn.style.cssText = "padding: 8px 16px;";

    const connectBtn = document.createElement("button");
    connectBtn.className = "comfy-btn";
    connectBtn.innerHTML = "连接";
    connectBtn.style.cssText = "padding: 8px 16px;";

    btnGroup.appendChild(cancelBtn);
    btnGroup.appendChild(connectBtn);
    modal.appendChild(btnGroup);

    dialog.appendChild(modal);

    // 事件
    cancelBtn.onclick = () => dialog.remove();
    dialog.onclick = (e) => { if (e.target === dialog) dialog.remove(); };

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

            if (onConnect) onConnect(result);
            dialog.remove();

        } catch (error) {
            alert("连接失败: " + error.message);
            connectBtn.disabled = false;
            connectBtn.textContent = "连接";
        }
    };

    return dialog;
}

/**
 * 创建输入框
 */
function createInput(label, id, type, placeholder) {
    const container = document.createElement("div");
    container.style.cssText = "display: flex; flex-direction: column; gap: 4px;";

    const labelEl = document.createElement("label");
    labelEl.style.cssText = "font-size: 12px; color: #aaa;";
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
        font-size: 14px;
        background: #2d2d2d;
        color: #e0e0e0;
    `;

    container.appendChild(labelEl);
    container.appendChild(input);
    return container;
}
