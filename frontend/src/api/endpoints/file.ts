/**
 * ComfyUI Data Manager - File API Endpoints
 */

import { API_ENDPOINTS } from '../../core/constants.js';

/**
 * Directory listing response
 */
export interface DirectoryListResponse {
  files: unknown[];
  path: string;
}

/**
 * File info response
 */
export interface FileInfo {
  path: string;
  name: string;
  size: number;
  modified: number;
  isDir: boolean;
  type?: string;
}

/**
 * Create file/directory response
 */
export interface CreateResponse {
  success: boolean;
  path?: string;
  error?: string;
  message?: string;
}

/**
 * List directory contents
 * @param path - Directory path
 * @returns Directory data
 */
export async function listDirectory(path: string): Promise<DirectoryListResponse> {
  const response = await fetch(API_ENDPOINTS.LIST, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path })
  });

  if (response?.ok) {
    return await response.json() as DirectoryListResponse;
  }

  const errorData = await response.json().catch(() => ({})) as Record<string, unknown>;
  const errorMsg = (errorData.error as string) || (errorData.message as string) || `HTTP ${response.status}`;
  throw new Error(`Failed to list directory: ${errorMsg}`);
}

/**
 * Get file preview URL
 * @param path - File path
 * @returns Preview URL
 */
export function getPreviewUrl(path: string): string {
  return `${API_ENDPOINTS.PREVIEW}?path=${encodeURIComponent(path)}`;
}

/**
 * Get file information
 * @param path - File path
 * @returns File info object
 */
export async function getFileInfo(path: string): Promise<FileInfo> {
  const response = await fetch(API_ENDPOINTS.INFO, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path })
  });

  if (response?.ok) {
    const data = await response.json() as { info: FileInfo };
    return data.info;
  }

  const errorData = await response.json().catch(() => ({})) as Record<string, unknown>;
  const errorMsg = (errorData.error as string) || (errorData.message as string) || `HTTP ${response.status}`;
  throw new Error(`Failed to get file info: ${errorMsg}`);
}

/**
 * Create new file
 * @param directory - Target directory
 * @param filename - File name
 * @param content - File content (default empty)
 * @returns Creation result
 */
export async function createFile(
  directory: string,
  filename: string,
  content = ""
): Promise<CreateResponse> {
  const response = await fetch(API_ENDPOINTS.CREATE_FILE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ directory, filename, content })
  });

  if (response?.ok) {
    return await response.json() as CreateResponse;
  }

  const error = await response.json().catch(() => ({ error: "Unknown error" })) as CreateResponse;
  throw new Error(error.error || error.message || 'Failed to create file');
}

/**
 * Create new directory
 * @param directory - Parent directory
 * @param dirname - Directory name
 * @returns Creation result
 */
export async function createDirectory(
  directory: string,
  dirname: string
): Promise<CreateResponse> {
  const response = await fetch(API_ENDPOINTS.CREATE_DIRECTORY, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ directory, dirname })
  });

  if (response?.ok) {
    return await response.json() as CreateResponse;
  }

  const error = await response.json().catch(() => ({ error: "Unknown error" })) as CreateResponse;
  throw new Error(error.error || error.message || 'Failed to create directory');
}

/**
 * Delete file or directory
 * @param path - File or directory path
 * @param useTrash - Move to trash (default true)
 * @returns Deletion result
 */
export async function deleteFile(
  path: string,
  useTrash = true
): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(API_ENDPOINTS.DELETE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, use_trash: useTrash })
  });

  if (response?.ok) {
    return await response.json() as { success: boolean };
  }

  const error = await response.json().catch(() => ({ error: "Unknown error" })) as { error?: string };
  throw new Error(error.error || 'Failed to delete file');
}
