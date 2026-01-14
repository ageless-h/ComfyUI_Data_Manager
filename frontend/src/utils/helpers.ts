/**
 * ComfyUI Data Manager - Helper Utilities
 */

// ComfyUI app import (external)
declare const app: {
  extensionManager?: {
    toast?: {
      add: (options: { severity: string; summary: string; detail: string; life?: number }) => void;
    };
  };
};

/**
 * Update status bar text
 * @param text - Status text
 */
export function updateStatus(text: string): void {
  const statusBar = document.getElementById("dm-status-bar");
  if (statusBar) {
    statusBar.textContent = text;
  }
}

/**
 * Show toast notification
 * @param severity - Severity level (info, success, warn, error)
 * @param summary - Title
 * @param detail - Detail message
 */
export function showToast(severity: string, summary: string, detail: string): void {
  if (typeof app !== 'undefined' && app.extensionManager?.toast) {
    app.extensionManager.toast.add({
      severity,
      summary,
      detail,
      life: 3000
    });
  } else {
    console.log(`[${severity.toUpperCase()}] ${summary}: ${detail}`);
  }
}

/**
 * Get parent directory path
 * @param path - Current path
 * @returns Parent path
 */
export function getParentPath(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  const lastSlash = normalized.lastIndexOf("/");
  if (lastSlash <= 0) return ".";
  return normalized.substring(0, lastSlash);
}

/**
 * Extract filename from path
 * @param path - File path
 * @returns Filename
 */
export function getFileName(path: string): string {
  return path.split(/[/\\]/).pop() || "";
}

/**
 * Extract file extension from path
 * @param path - File path
 * @returns Extension with dot
 */
export function getExt(path: string): string {
  const parts = path.split('.');
  const ext = parts.pop()?.toLowerCase() || "";
  return '.' + ext;
}
