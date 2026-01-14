/**
 * ComfyUI Data Manager - Format Utilities
 */

/**
 * Format file size to human readable string
 * @param bytes - Number of bytes
 * @returns Formatted size string
 */
export function formatSize(bytes: number): string {
  if (!bytes) return "";
  for (const unit of ["B", "KB", "MB", "GB"]) {
    if (bytes < 1024) return bytes.toFixed(1) + " " + unit;
    bytes /= 1024;
  }
  return bytes.toFixed(1) + " TB";
}

/**
 * Format date to localized string
 * @param dateStr - Date string
 * @returns Formatted date string
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleString("zh-CN", {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Escape HTML special characters
 * @param text - Raw text
 * @returns Escaped HTML string
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
