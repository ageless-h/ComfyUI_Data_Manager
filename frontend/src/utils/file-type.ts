/**
 * ComfyUI Data Manager - File Type Detection Utilities
 */

import { FILE_TYPES } from '../core/constants.js';

/**
 * Identify file type from file object
 * @param file - File object with name and is_dir properties
 * @returns File type key
 */
export function getFileType(file: { name?: string; path?: string; is_dir?: boolean }): string {
  if (file.is_dir) return "folder";
  const ext = "." + ((file.name || file.path || "").split(".").pop()?.toLowerCase() || "");
  for (const [type, config] of Object.entries(FILE_TYPES)) {
    if (config.exts && config.exts.includes(ext)) return type;
  }
  return "unknown";
}

/**
 * Get file type by extension
 * @param ext - File extension (with dot)
 * @returns File type key
 */
export function getTypeByExt(ext: string): string {
  for (const [type, config] of Object.entries(FILE_TYPES)) {
    if (config.exts && config.exts.includes(ext)) return type;
  }
  return "unknown";
}
