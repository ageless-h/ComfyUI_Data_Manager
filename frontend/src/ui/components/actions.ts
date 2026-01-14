/**
 * ComfyUI Data Manager - Actions Component
 */

import { listDirectory } from '../../api/endpoints/file.js';
import { FileManagerState, saveLastPath, type FileItem } from '../../core/state.js';
import { updateStatus, showToast, getParentPath } from '../../utils/helpers.js';
import { createFileListItem, createFileGridItem } from './browser.js';
import type { SortBy } from '../../core/types.js';

/**
 * Load directory
 * @param path - Directory path
 */
export async function loadDirectory(path: string): Promise<void> {
  // Check for active SSH connection
  const remoteConn = (window as unknown as { _remoteConnectionsState: { active: unknown } })._remoteConnectionsState?.active;
  if (remoteConn) {
    await loadRemoteDirectory(path, remoteConn as { connection_id: string; root_path?: string });
    return;
  }

  updateStatus(`正在加载: ${path}...`);

  try {
    const data = await listDirectory(path);
    FileManagerState.files = (data.files as FileItem[]) || [];
    FileManagerState.currentPath = data.path;

    // Save last visited path
    saveLastPath(data.path);

    // Save to history
    if (FileManagerState.historyIndex === -1 ||
        FileManagerState.history[FileManagerState.historyIndex] !== data.path) {
      FileManagerState.history = FileManagerState.history.slice(0, FileManagerState.historyIndex + 1);
      FileManagerState.history.push(data.path);
      FileManagerState.historyIndex = FileManagerState.history.length - 1;
    }

    const pathInput = document.getElementById("dm-path-input") as HTMLInputElement;
    if (pathInput) pathInput.value = data.path;

    renderFileListUI();
    updateStatus(`${FileManagerState.files.length} 个项目`);

  } catch (error) {
    console.error("Load directory error:", error);
    updateStatus("加载错误");
    showToast("error", "错误", "网络请求失败");
  }
}

/**
 * Load remote SSH directory
 */
async function loadRemoteDirectory(path: string, conn: { connection_id: string; root_path?: string }): Promise<void> {
  updateStatus(`正在加载远程: ${path}...`);

  try {
    const { sshList } = await import('../../api/ssh.js');
    const data = await sshList(conn.connection_id, path || conn.root_path || "/");

    FileManagerState.files = (data.files as FileItem[]) || [];
    FileManagerState.currentPath = data.path || path;

    const pathInput = document.getElementById("dm-path-input") as HTMLInputElement;
    if (pathInput) pathInput.value = `[SSH] ${data.path}`;

    renderFileListUI();
    updateStatus(`${FileManagerState.files.length} 个项目 (远程)`);

  } catch (error) {
    console.error("Load remote directory error:", error);
    updateStatus("加载错误");
    showToast("error", "错误", `远程加载失败: ${(error as Error).message}`);
  }
}

/**
 * Render file list UI
 */
function renderFileListUI(): void {
  const container = document.getElementById("dm-file-list");
  if (!container) return;

  // Clear current selection
  FileManagerState.selectedFiles = [];

  // Sort files
  const sortedFiles = [...FileManagerState.files].sort((a, b) => {
    // Directories first
    const aIsDir = (a as FileItem).is_dir || (a as FileItem).isDir || false;
    const bIsDir = (b as FileItem).is_dir || (b as FileItem).isDir || false;
    if (aIsDir && !bIsDir) return -1;
    if (!aIsDir && bIsDir) return 1;

    let comparison = 0;
    switch (FileManagerState.sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'size':
        comparison = ((a as FileItem).size || 0) - ((b as FileItem).size || 0);
        break;
      case 'modified':
        comparison = new Date((a as FileItem).modified || 0).getTime() - new Date((b as FileItem).modified || 0).getTime();
        break;
    }

    return FileManagerState.sortOrder === 'asc' ? comparison : -comparison;
  });

  let html = "";

  // Parent directory link
  if (FileManagerState.currentPath !== "." && FileManagerState.currentPath !== "/") {
    if (FileManagerState.viewMode === 'list') {
      html += createFileListItem({
        name: "..",
        isDir: true,
        path: getParentPath(FileManagerState.currentPath),
        size: 0,
        modified: undefined
      }, true);
    } else {
      html += createFileGridItem({
        name: "..",
        isDir: true,
        path: getParentPath(FileManagerState.currentPath)
      }, true);
    }
  }

  // Render file list
  sortedFiles.forEach(file => {
    html += FileManagerState.viewMode === 'list'
      ? createFileListItem(file as FileItem, false)
      : createFileGridItem(file as FileItem, false);
  });

  container.innerHTML = html;

  // Reset scroll position to top
  container.scrollTop = 0;

  // Bind events
  container.querySelectorAll(".dm-file-item").forEach(item => {
    (item as HTMLElement).onclick = () => selectFile(item as HTMLElement);
    (item as HTMLElement).ondblclick = () => openFile(item as HTMLElement);
  });

  container.querySelectorAll(".dm-grid-item").forEach(item => {
    (item as HTMLElement).onclick = () => selectGridItem(item as HTMLElement);
    (item as HTMLElement).ondblclick = async () => {
      const path = (item as HTMLElement).dataset.path;
      const isDir = (item as HTMLElement).dataset.isDir === "true";
      if (isDir && path) {
        await loadDirectory(path);
      } else if (path) {
        const { previewFile } = await import('./preview-actions.js');
        await previewFile(path);
      }
    };
  });
}

/**
 * Select list item
 */
function selectFile(item: HTMLElement): void {
  document.querySelectorAll(".dm-file-item").forEach(i => {
    (i as HTMLElement).style.background = "transparent";
  });

  item.style.background = "#3a3a3a";

  const path = item.dataset.path || "";
  const isDir = item.dataset.isDir === "true";

  FileManagerState.selectedFiles = [path];

  if (!isDir && path) {
    void (async () => {
      const { previewFile } = await import('./preview-actions.js');
      await previewFile(path);
    })();
  } else {
    clearPreviewPanel();
  }
}

/**
 * Select grid item
 */
function selectGridItem(item: HTMLElement): void {
  document.querySelectorAll(".dm-grid-item").forEach(i => {
    (i as HTMLElement).style.borderColor = "transparent";
  });

  item.style.borderColor = "#9b59b6";
  FileManagerState.selectedFiles = [item.dataset.path || ""];

  const path = item.dataset.path;
  const isDir = item.dataset.isDir === "true";

  if (!isDir && path) {
    void (async () => {
      const { previewFile } = await import('./preview-actions.js');
      await previewFile(path);
    })();
  }
}

/**
 * Open file
 */
function openFile(item: HTMLElement): void {
  const path = item.dataset.path;
  const isDir = item.dataset.isDir === "true";

  if (isDir && path) {
    void loadDirectory(path);
  } else if (path) {
    void (async () => {
      const { previewFile } = await import('./preview-actions.js');
      await previewFile(path);
    })();
  }
}

/**
 * Clear preview panel
 */
function clearPreviewPanel(): void {
  const previewContent = document.getElementById("dm-preview-content");
  if (previewContent) {
    previewContent.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #666;">
        <i class="pi pi-folder" style="font-size: 48px; opacity: 0.5;"></i>
        <div style="margin-top: 15px; font-size: 13px;">双击打开目录</div>
      </div>
    `;
  }
}

/**
 * Toggle sort order
 * @param column - Sort column
 */
export function toggleSort(column: SortBy): void {
  if (FileManagerState.sortBy === column) {
    FileManagerState.sortOrder = FileManagerState.sortOrder === 'asc' ? 'desc' : 'asc';
  } else {
    FileManagerState.sortBy = column;
    FileManagerState.sortOrder = 'asc';
  }

  const sortSelect = document.getElementById("dm-sort-select") as HTMLSelectElement;
  if (sortSelect) {
    sortSelect.value = FileManagerState.sortBy;
  }

  renderFileListUI();
  updateHeaderSortIndicators();
}

/**
 * Update header sort indicators
 */
export function updateHeaderSortIndicators(): void {
  const headers = document.querySelectorAll('.dm-header-cell');
  headers.forEach(header => {
    const icon = header.querySelector('i') as HTMLElement;
    if (icon) {
      const column = (header as HTMLElement).dataset.sort as SortBy;
      if (column === FileManagerState.sortBy) {
        icon.className = FileManagerState.sortOrder === 'asc' ? 'pi pi-sort-amount-up' : 'pi pi-sort-amount-down';
        icon.style.opacity = "1";
      } else {
        icon.className = 'pi pi-sort';
        icon.style.opacity = "0.5";
      }
    }
  });
}

/**
 * Navigate to parent directory
 */
export function navigateUp(): void {
  if (FileManagerState.currentPath === "." || FileManagerState.currentPath === "/") {
    return;
  }

  const parentPath = getParentPath(FileManagerState.currentPath);
  if (parentPath !== FileManagerState.currentPath) {
    void loadDirectory(parentPath);
  }
}

/**
 * Navigate to root directory
 */
export function navigateHome(): void {
  void loadDirectory(".");
}
