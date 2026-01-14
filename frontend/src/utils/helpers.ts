/**
 * ComfyUI Data Manager - Helper Utilities
 */

import { getComfyTheme } from './theme.js';

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
  // Always try to use internal Data Manager toast first (when window is open)
  const toastContainer = document.getElementById("dm-toast-container");
  if (toastContainer) {
    showInternalToast(severity, summary, detail);
    // IMPORTANT: Return early to prevent ComfyUI toast from showing
    return;
  }

  // Only use ComfyUI toast if Data Manager window is not open
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
 * Show internal toast notification inside Data Manager window
 * @param severity - Severity level (info, success, warn, error)
 * @param summary - Title
 * @param detail - Detail message
 */
function showInternalToast(severity: string, summary: string, detail: string): void {
  const toastContainer = document.getElementById("dm-toast-container");
  if (!toastContainer) return;

  const theme = getComfyTheme();

  // ComfyUI-style colors using theme system
  const colors: Record<string, { bg: string; icon: string }> = {
    success: { bg: theme.successColor, icon: 'pi-check-circle' },
    error: { bg: theme.errorColor, icon: 'pi-exclamation-circle' },
    warn: { bg: '#f39c12', icon: 'pi-exclamation-triangle' },
    info: { bg: theme.bgTertiary, icon: 'pi-info-circle' }
  };

  const color = colors[severity] || colors.info;

  const toast = document.createElement("div");
  toast.style.cssText = `
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    background: ${color.bg};
    color: ${theme.textPrimary};
    border: 1px solid ${theme.borderColor};
    border-radius: 8px;
    box-shadow: rgba(0, 0, 0, 0.3) 0 4px 12px 0;
    font-size: 13px;
    min-width: 280px;
    max-width: 400px;
    animation: dmSlideIn 0.3s ease-out;
    pointer-events: auto;
  `;
  toast.innerHTML = `
    <i class="pi ${color.icon}" style="font-size: 18px;"></i>
    <div style="flex: 1;">
      <div style="font-weight: 600; margin-bottom: 2px;">${summary}</div>
      <div style="opacity: 0.9; font-size: 12px;">${detail}</div>
    </div>
  `;

  toastContainer.appendChild(toast);

  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease-in';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
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
