/**
 * ComfyUI Data Manager - Toolbar Component
 */

/**
 * Toolbar callbacks
 */
export interface ToolbarCallbacks {
  onSshConnect?: (result: unknown) => void;
  onSshDisconnect?: () => void;
}

/**
 * Remote connection state interface
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

interface RemoteConnectionsState {
  active: RemoteConnection | null;
  saved: RemoteConnection[];
}

/**
 * Create remote device selector
 * @param callbacks - Callback functions
 * @returns Selector container element
 */
function createRemoteSelector(callbacks: ToolbarCallbacks): HTMLElement {
  const { onSshConnect, onSshDisconnect } = callbacks;

  const container = document.createElement("div");
  container.style.cssText = "display: flex; align-items: center; gap: 5px;";

  // Device select dropdown
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

  // Initialize options
  updateRemoteOptions(select, onSshConnect, onSshDisconnect);

  select.onchange = async (e) => {
    const value = (e.target as HTMLSelectElement).value;
    const state = (window as unknown as { _remoteConnectionsState: RemoteConnectionsState })._remoteConnectionsState;

    if (value === '__local__') {
      // Switch to local
      state.active = null;
      try {
        localStorage.removeItem('comfyui_datamanager_last_connection');
      } catch (err) {}
      updateRemoteOptions(select, onSshConnect, onSshDisconnect);
      updateConnectionStatus();
      if (onSshDisconnect) onSshDisconnect();
    } else if (value.startsWith('conn_')) {
      // Connect to saved device
      const connId = value.substring(5);
      const savedConn = state.saved.find(c => c.id === connId);
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
            password: atob(savedConn.password || "")
          });
        } catch (err) {
          alert("连接失败: " + (err as Error).message);
          updateRemoteOptions(select, onSshConnect, onSshDisconnect);
        }
      }
    }
    (e.target as HTMLSelectElement).value = "";
  };

  container.appendChild(select);

  return container;
}

/**
 * Update remote selector options
 */
function updateRemoteOptions(select: HTMLSelectElement, onSshConnect?: (result: unknown) => void, onSshDisconnect?: () => void): void {
  const state = (window as unknown as { _remoteConnectionsState: RemoteConnectionsState })._remoteConnectionsState;
  const active = state.active;

  select.innerHTML = "";

  // Local option
  const localOpt = document.createElement("option");
  localOpt.value = "__local__";
  localOpt.textContent = "本地";
  select.appendChild(localOpt);

  // Saved connections
  state.saved.forEach(conn => {
    const opt = document.createElement("option");
    opt.value = `conn_${conn.id}`;
    opt.textContent = conn.name || `${conn.username}@${conn.host}`;
    if (active && active.connection_id === conn.id) {
      (opt as HTMLOptionElement).style.color = "#27ae60";
    }
    select.appendChild(opt);
  });
}

/**
 * Update connection status indicator
 */
function updateConnectionStatus(): void {
  const indicator = document.getElementById("dm-connection-indicator");
  const statusText = document.getElementById("dm-connection-status");
  const state = (window as unknown as { _remoteConnectionsState: RemoteConnectionsState })._remoteConnectionsState;
  const active = state.active;

  if (indicator) {
    (indicator as HTMLElement).style.background = active ? '#27ae60' : '#666';
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
 * Create settings button
 * @param callbacks - Callback functions
 * @returns Button element
 */
function createSettingsButton(callbacks: ToolbarCallbacks): HTMLElement {
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
    const { openSettingsPanel } = await import('./settings.js');
    openSettingsPanel({
      onConnect: (result: unknown) => {
        const state = (window as unknown as { _remoteConnectionsState: RemoteConnectionsState })._remoteConnectionsState;
        state.active = result as RemoteConnection;
        try {
          localStorage.setItem('comfyui_datamanager_last_connection', JSON.stringify(result));
        } catch (err) {}
        updateConnectionStatus();
        if (onSshConnect) onSshConnect(result);
      },
      onDisconnect: async () => {
        const state = (window as unknown as { _remoteConnectionsState: RemoteConnectionsState })._remoteConnectionsState;
        const conn = state.active;
        if (conn && conn.connection_id) {
          try {
            const { sshDisconnect } = await import('../../api/ssh.js');
            await sshDisconnect(conn.connection_id);
          } catch (e) {
            console.log('[DataManager] SSH disconnect error:', e);
          }
        }
        state.active = null;
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
 * Create toolbar
 * @param callbacks - Callback functions
 * @returns Toolbar element
 */
export function createToolbar(callbacks: ToolbarCallbacks = {}): HTMLElement {
  const toolbar = document.createElement("div");
  toolbar.className = "dm-toolbar";
  toolbar.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 15px;
    border-bottom: 1px solid;
    gap: 15px;
  `;

  const leftSection = document.createElement("div");
  leftSection.style.cssText = "display: flex; align-items: center; gap: 10px;";

  // Path input
  const pathInput = document.createElement("input");
  pathInput.id = "dm-path-input";
  pathInput.type = "text";
  pathInput.className = "dm-input";
  pathInput.style.cssText = `
    flex: 1;
    min-width: 300px;
    padding: 8px 12px;
    border: 1px solid #444;
    border-radius: 6px;
    font-size: 13px;
    background: #2a2a2a;
    color: #fff;
  `;
  pathInput.value = FileManagerState.currentPath || ".";
  pathInput.onkeypress = (e) => {
    if (e.key === 'Enter') {
      const { loadDirectory } = require('./actions.js');
      loadDirectory((e.target as HTMLInputElement).value);
    }
  };

  leftSection.appendChild(pathInput);
  toolbar.appendChild(leftSection);

  const rightSection = document.createElement("div");
  rightSection.style.cssText = "display: flex; align-items: center; gap: 10px;";

  rightSection.appendChild(createRemoteSelector(callbacks));
  rightSection.appendChild(createSettingsButton(callbacks));

  toolbar.appendChild(rightSection);

  // Initialize connection status
  setTimeout(() => updateConnectionStatus(), 100);

  return toolbar;
}

// Import FileManagerState for path input initialization
import { FileManagerState } from '../../core/state.js';
