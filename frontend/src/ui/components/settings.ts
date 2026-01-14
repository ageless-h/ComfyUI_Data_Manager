/**
 * ComfyUI Data Manager - Settings Panel Component
 */

import { getComfyTheme } from '../../utils/theme.js';

/**
 * Settings panel options
 */
export interface SettingsOptions {
  onConnect?: (result: unknown) => void;
  onDisconnect?: () => void;
}

/**
 * Remote connection interface
 */
interface RemoteConnection {
  id?: string;
  name?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  connection_id?: string;
}

/**
 * Open settings panel
 * @param options - Configuration options
 * @returns Overlay element
 */
export function openSettingsPanel(options: SettingsOptions = {}): HTMLElement {
  const { onConnect, onDisconnect } = options;
  const theme = getComfyTheme();

  const overlay = document.createElement("div");
  overlay.id = "dm-settings-panel-overlay";
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

  const panel = document.createElement("div");
  panel.style.cssText = `
    background: ${theme.bgPrimary};
    border: 1px solid ${theme.borderColor};
    border-radius: 12px;
    padding: 20px;
    width: 400px;
    max-width: calc(100vw - 40px);
    max-height: calc(100vh - 100px);
    overflow-y: auto;
  `;

  // Title
  const title = document.createElement("div");
  title.id = "dm-settings-title";
  title.style.cssText = `
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  title.innerHTML = `
    <span>SSH 连接</span>
    <button id="dm-settings-close" class="comfy-btn" style="padding: 4px 8px;">
      <i class="pi pi-times"></i>
    </button>
  `;
  panel.appendChild(title);

  // Container: for switching between list and form
  const container = document.createElement("div");
  panel.appendChild(container);

  // Show connection list
  showConnectionList(container, onConnect, onDisconnect);

  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  // Event binding
  document.getElementById("dm-settings-close")!.onclick = () => overlay.remove();
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

  return overlay;
}

/**
 * Show connection list page
 */
function showConnectionList(container: HTMLElement, onConnect?: (result: unknown) => void, onDisconnect?: () => void): void {
  const theme = getComfyTheme();

  container.innerHTML = "";

  const title = document.createElement("div");
  title.style.cssText = `
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 12px;
    color: ${theme.textPrimary};
  `;
  title.textContent = "已保存的连接";
  container.appendChild(title);

  const list = document.createElement("div");
  list.id = "dm-saved-connections-list";
  list.style.cssText = "display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;";

  renderSavedConnectionsList(list, onConnect, onDisconnect, container, onConnect, onDisconnect);

  container.appendChild(list);

  // New button
  const newBtn = document.createElement("button");
  newBtn.className = "comfy-btn";
  newBtn.innerHTML = '<i class="pi pi-plus"></i> 新建连接';
  newBtn.style.cssText = "width: 100%; padding: 10px;";
  newBtn.onclick = () => {
    showConnectionForm(container, onConnect, onDisconnect);
  };
  container.appendChild(newBtn);
}

/**
 * Show connection form page
 */
function showConnectionForm(container: HTMLElement, onConnect?: (result: unknown) => void, onDisconnect?: () => void): void {
  const theme = getComfyTheme();

  container.innerHTML = "";

  // Back button
  const backBtn = document.createElement("button");
  backBtn.className = "comfy-btn";
  backBtn.innerHTML = '<i class="pi pi-arrow-left"></i> 返回';
  backBtn.style.cssText = "padding: 6px 12px; margin-bottom: 15px; font-size: 12px;";
  backBtn.onclick = () => {
    showConnectionList(container, onConnect, onDisconnect);
  };
  container.appendChild(backBtn);

  const formTitle = document.createElement("div");
  formTitle.style.cssText = `
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 12px;
    color: ${theme.textPrimary};
  `;
  formTitle.textContent = "新建 SSH 连接";
  container.appendChild(formTitle);

  const form = document.createElement("div");
  form.style.cssText = "display: flex; flex-direction: column; gap: 10px;";

  form.appendChild(createSettingsInput("主机地址", "dm-ssh-host", "text", "192.168.1.100"));
  form.appendChild(createSettingsInput("端口", "dm-ssh-port", "number", "22"));
  form.appendChild(createSettingsInput("用户名", "dm-ssh-username", "text", ""));
  form.appendChild(createSettingsInput("密码", "dm-ssh-password", "password", ""));

  // Save option and connect button
  const btnRow = document.createElement("div");
  btnRow.style.cssText = "display: flex; align-items: center; gap: 12px; margin-top: 5px;";

  const saveLabel = document.createElement("label");
  saveLabel.style.cssText = `display: flex; align-items: center; gap: 6px; font-size: 12px; color: ${theme.textSecondary}; cursor: pointer;`;
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

  container.appendChild(form);

  // Connect button event
  connectBtn.onclick = async () => {
    const host = (document.getElementById("dm-ssh-host") as HTMLInputElement).value.trim();
    const port = (document.getElementById("dm-ssh-port") as HTMLInputElement).value.trim();
    const username = (document.getElementById("dm-ssh-username") as HTMLInputElement).value.trim();
    const password = (document.getElementById("dm-ssh-password") as HTMLInputElement).value;
    const saveCreds = (document.getElementById("dm-ssh-save-creds") as HTMLInputElement).checked;

    if (!host || !username) {
      alert("请填写主机地址和用户名");
      return;
    }

    connectBtn.disabled = true;
    connectBtn.textContent = "连接中...";

    try {
      const { sshConnect } = await import('../../api/ssh.js');
      const result = await sshConnect(host, parseInt(port) || 22, username, password);

      // Save credentials
      if (saveCreds) {
        const connInfo = {
          id: (result as { connection_id: string }).connection_id,
          name: `${username}@${host}`,
          host,
          port: parseInt(port) || 22,
          username,
          password: btoa(password),
          created: new Date().toISOString()
        };
        const state = (window as unknown as { _remoteConnectionsState: { saved: RemoteConnection[] } })._remoteConnectionsState;
        state.saved.push(connInfo);
        try {
          localStorage.setItem('comfyui_datamanager_remote_connections', JSON.stringify(state.saved));
        } catch (e) {
          console.warn('[DataManager] Failed to save connections:', e);
        }
      }

      if (onConnect) onConnect(result);
      (document.getElementById("dm-settings-panel-overlay") as HTMLElement)?.remove();

    } catch (error) {
      alert("连接失败: " + (error as Error).message);
      connectBtn.disabled = false;
      connectBtn.textContent = "连接";
    }
  };
}

/**
 * Render saved connections list
 */
function renderSavedConnectionsList(
  list: HTMLElement,
  onConnect?: (result: unknown) => void,
  onDisconnect?: () => void,
  container?: HTMLElement,
  onConnect2?: (result: unknown) => void,
  onDisconnect2?: () => void
): void {
  const theme = getComfyTheme();
  const state = (window as unknown as { _remoteConnectionsState: { saved: RemoteConnection[]; active: RemoteConnection | null } })._remoteConnectionsState;
  const saved = state.saved || [];
  const active = state.active;

  list.innerHTML = "";

  if (saved.length === 0) {
    list.innerHTML = `<div style="text-align: center; padding: 20px; color: ${theme.textSecondary};">暂无保存的连接</div>`;
    return;
  }

  saved.forEach((conn) => {
    const item = document.createElement("div");
    item.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px;
      background: ${theme.bgSecondary};
      border: 1px solid ${theme.borderColor};
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    `;

    const isActive = active && active.connection_id === conn.id;

    const info = document.createElement("div");
    info.style.cssText = "flex: 1;";
    info.innerHTML = `
      <div style="font-size: 13px; font-weight: 600; color: ${isActive ? theme.successColor : theme.textPrimary};">${conn.name || `${conn.username}@${conn.host}`}</div>
      <div style="font-size: 11px; color: ${theme.textSecondary};">${conn.host}:${conn.port}</div>
    `;

    const actions = document.createElement("div");
    actions.style.cssText = "display: flex; gap: 5px;";

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "comfy-btn";
    deleteBtn.innerHTML = '<i class="pi pi-trash"></i>';
    deleteBtn.style.cssText = "padding: 6px 10px; font-size: 12px;";
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      if (confirm(`确定删除连接 "${conn.name}"?`)) {
        const idx = state.saved.findIndex(c => c.id === conn.id);
        if (idx > -1) {
          state.saved.splice(idx, 1);
          try {
            localStorage.setItem('comfyui_datamanager_remote_connections', JSON.stringify(state.saved));
          } catch (e) {}
          // Re-render list
          showConnectionList(container!, onConnect || onConnect2, onDisconnect || onDisconnect2);
        }
      }
    };

    actions.appendChild(deleteBtn);
    item.appendChild(info);
    item.appendChild(actions);

    item.onmouseover = () => item.style.borderColor = theme.accentColor;
    item.onmouseout = () => item.style.borderColor = theme.borderColor;

    list.appendChild(item);
  });
}

/**
 * Create settings input field
 */
function createSettingsInput(label: string, id: string, type: string, placeholder: string): HTMLElement {
  const theme = getComfyTheme();
  const container = document.createElement("div");
  container.style.cssText = "display: flex; flex-direction: column; gap: 4px;";

  const labelEl = document.createElement("label");
  labelEl.style.cssText = `font-size: 12px; color: ${theme.textSecondary};`;
  labelEl.textContent = label;

  const input = document.createElement("input");
  input.id = id;
  input.type = type;
  input.className = "dm-input";
  input.placeholder = placeholder;
  input.style.cssText = `
    padding: 8px 10px;
    border: 1px solid ${theme.borderColor};
    border-radius: 4px;
    font-size: 14px;
    background: ${theme.inputBg};
    color: ${theme.inputText};
  `;

  container.appendChild(labelEl);
  container.appendChild(input);

  return container;
}
