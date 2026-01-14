/**
 * ComfyUI Data Manager - Toolbar Component
 */

import { getComfyTheme } from '../../utils/theme.js';
import { FileManagerState } from '../../core/state.js';

/**
 * Toolbar callbacks
 */
export interface ToolbarCallbacks {
  onSshConnect?: (result: unknown) => void;
  onSshDisconnect?: () => void;
  onSortChange?: (sortBy: string) => void;
  onNewFile?: () => void;
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
  const theme = getComfyTheme();

  const container = document.createElement("div");
  container.style.cssText = "display: flex; align-items: center; gap: 5px;";

  // Device select dropdown
  const select = document.createElement("select");
  select.id = "dm-remote-select";
  select.style.cssText = `
    padding: 8px 12px;
    border: 1px solid ${theme.borderColor} !important;
    border-radius: 6px;
    font-size: 13px;
    min-width: 150px;
    cursor: pointer;
    background: ${theme.bgTertiary} !important;
    color: ${theme.inputText} !important;
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
  const theme = getComfyTheme();
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
      (opt as HTMLOptionElement).style.color = theme.successColor;
    }
    select.appendChild(opt);
  });
}

/**
 * Update connection status indicator
 */
function updateConnectionStatus(): void {
  const theme = getComfyTheme();
  const indicator = document.getElementById("dm-connection-indicator");
  const statusText = document.getElementById("dm-connection-status");
  const state = (window as unknown as { _remoteConnectionsState: RemoteConnectionsState })._remoteConnectionsState;
  const active = state.active;

  if (indicator) {
    (indicator as HTMLElement).style.background = active ? theme.successColor : theme.textSecondary;
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
 * Create new file button
 * @param callbacks - Callback functions
 * @returns Button element
 */
function createNewButton(callbacks: ToolbarCallbacks): HTMLElement {
  const theme = getComfyTheme();
  const button = document.createElement("button");
  button.className = "comfy-btn";
  button.id = "dm-new-btn";
  button.innerHTML = '<i class="pi pi-plus"></i>';
  button.style.cssText = `
    padding: 8px 12px;
    border: 1px solid ${theme.borderColor} !important;
    border-radius: 6px;
    cursor: pointer;
    background: ${theme.bgTertiary} !important;
    color: ${theme.textPrimary} !important;
  `;
  button.title = "新建";

  button.onclick = () => {
    if (callbacks.onNewFile) {
      callbacks.onNewFile();
    }
  };

  return button;
}

/**
 * Create sort select dropdown
 * @param callbacks - Callback functions
 * @returns Select element
 */
function createSortSelect(callbacks: ToolbarCallbacks): HTMLElement {
  const theme = getComfyTheme();
  const sortSelect = document.createElement("select");
  sortSelect.id = "dm-sort-select";
  sortSelect.className = "dm-select comfy-btn";
  sortSelect.style.cssText = `
    padding: 8px 12px;
    border: 1px solid ${theme.borderColor} !important;
    border-radius: 6px;
    font-size: 13px;
    cursor: pointer;
    background: ${theme.bgTertiary} !important;
    color: ${theme.inputText} !important;
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

  sortSelect.onchange = (e) => {
    const value = (e.target as HTMLSelectElement).value;
    if (callbacks.onSortChange) {
      callbacks.onSortChange(value);
    }
  };

  return sortSelect;
}

/**
 * Create settings button
 * @param callbacks - Callback functions
 * @returns Button element
 */
function createSettingsButton(callbacks: ToolbarCallbacks): HTMLElement {
  const { onSshConnect, onSshDisconnect } = callbacks;
  const theme = getComfyTheme();

  const button = document.createElement("button");
  button.className = "comfy-btn";
  button.id = "dm-settings-btn";
  button.innerHTML = '<i class="pi pi-cog"></i>';
  button.style.cssText = `
    padding: 8px 12px;
    border: 1px solid ${theme.borderColor} !important;
    border-radius: 6px;
    cursor: pointer;
    background: ${theme.bgTertiary} !important;
    color: ${theme.textPrimary} !important;
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
  const theme = getComfyTheme();
  const toolbar = document.createElement("div");
  toolbar.className = "dm-toolbar";
  toolbar.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 15px;
    border-bottom: 1px solid ${theme.borderColor};
    gap: 15px;
  `;

  const leftSection = document.createElement("div");
  leftSection.style.cssText = "display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0;";

  // Navigation buttons group
  const navGroup = document.createElement("div");
  navGroup.style.cssText = `
    display: flex;
    gap: 5px;
  `;

  // Up button (navigate to parent directory)
  const upBtn = document.createElement("button");
  upBtn.id = "dm-nav-up-btn";
  upBtn.className = "comfy-btn";
  upBtn.innerHTML = '<i class="pi pi-arrow-up"></i>';
  upBtn.title = "返回上级";
  upBtn.style.cssText = `
    padding: 8px 12px;
    border: 1px solid ${theme.borderColor} !important;
    border-radius: 6px;
    background: ${theme.bgTertiary} !important;
    color: ${theme.textPrimary} !important;
    cursor: pointer;
  `;
  upBtn.onclick = () => import('./actions.js').then(m => m.navigateUp());

  // Home button (navigate to root directory)
  const homeBtn = document.createElement("button");
  homeBtn.id = "dm-nav-home-btn";
  homeBtn.className = "comfy-btn";
  homeBtn.innerHTML = '<i class="pi pi-home"></i>';
  homeBtn.title = "返回首页";
  homeBtn.style.cssText = `
    padding: 8px 12px;
    border: 1px solid ${theme.borderColor} !important;
    border-radius: 6px;
    background: ${theme.bgTertiary} !important;
    color: ${theme.textPrimary} !important;
    cursor: pointer;
  `;
  homeBtn.onclick = () => import('./actions.js').then(m => m.navigateHome());

  navGroup.appendChild(upBtn);
  navGroup.appendChild(homeBtn);
  leftSection.appendChild(navGroup);

  // Path input
  const pathInput = document.createElement("input");
  pathInput.id = "dm-path-input";
  pathInput.type = "text";
  pathInput.className = "dm-input";
  pathInput.style.cssText = `
    flex: 1;
    min-width: 0;
    padding: 8px 12px;
    border: 1px solid ${theme.borderColor} !important;
    border-radius: 6px;
    font-size: 13px;
    background: ${theme.bgTertiary} !important;
    color: ${theme.inputText} !important;
  `;
  pathInput.value = FileManagerState.currentPath || ".";
  pathInput.onkeypress = (e) => {
    if (e.key === 'Enter') {
      const { loadDirectory } = require('./actions.js');
      loadDirectory((e.target as HTMLInputElement).value);
    }
  };

  leftSection.appendChild(pathInput);

  // Sort select dropdown
  leftSection.appendChild(createSortSelect(callbacks));

  toolbar.appendChild(leftSection);

  const rightSection = document.createElement("div");
  rightSection.style.cssText = "display: flex; align-items: center; gap: 10px;";

  // View toggle button
  const viewToggleBtn = document.createElement("button");
  viewToggleBtn.id = "dm-view-toggle-btn";
  viewToggleBtn.className = "comfy-btn";
  viewToggleBtn.title = "切换视图";
  viewToggleBtn.style.cssText = `
    padding: 8px 12px;
    border: 1px solid ${theme.borderColor} !important;
    border-radius: 6px;
    background: ${theme.bgTertiary} !important;
    color: ${theme.textPrimary} !important;
    cursor: pointer;
  `;

  // Function to update view toggle button icon based on current mode
  function updateViewToggleButton(): void {
    const mode = FileManagerState.viewMode;
    viewToggleBtn.innerHTML = mode === 'list'
      ? '<i class="pi pi-th-large"></i>' // Show grid icon, hint to switch to grid
      : '<i class="pi pi-list"></i>';     // Show list icon, hint to switch to list
  }

  viewToggleBtn.onclick = async () => {
    const newMode = FileManagerState.viewMode === 'list' ? 'grid' : 'list';
    FileManagerState.viewMode = newMode;

    // Save view mode to localStorage
    const { saveViewMode } = await import('../../core/state.js');
    saveViewMode(newMode);

    updateViewToggleButton();

    // Update container CSS and header visibility
    const container = document.getElementById("dm-file-list");
    const browserPanel = document.getElementById("dm-browser-panel");

    if (container) {
      if (newMode === 'grid') {
        // Grid view styles
        container.style.cssText = `
          flex: 1;
          overflow-y: auto;
          padding: 10px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
          gap: 10px;
          align-content: start;
          justify-content: start;
        `;
        // Hide list header
        const header = browserPanel?.querySelector('.dm-list-header') as HTMLElement;
        if (header) header.style.display = 'none';
      } else {
        // List view styles
        container.style.cssText = `
          flex: 1;
          overflow-y: auto;
          padding: 5px 0;
        `;
        // Show list header
        const header = browserPanel?.querySelector('.dm-list-header') as HTMLElement;
        if (header) header.style.display = 'flex';
      }
    }

    // Re-render file list
    const { loadDirectory } = await import('./actions.js');
    await loadDirectory(FileManagerState.currentPath);
  };

  // Initialize button state
  updateViewToggleButton();

  rightSection.appendChild(viewToggleBtn);
  rightSection.appendChild(createRemoteSelector(callbacks));
  rightSection.appendChild(createSettingsButton(callbacks));
  rightSection.appendChild(createNewButton(callbacks));

  toolbar.appendChild(rightSection);

  // Initialize connection status
  setTimeout(() => updateConnectionStatus(), 100);

  return toolbar;
}
