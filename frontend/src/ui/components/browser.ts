/**
 * ComfyUI Data Manager - Browser Panel Component
 */

import { FILE_TYPES } from '../../core/constants.js'
import { getFileType, getTypeByExt } from '../../utils/file-type.js'
import { formatDate, formatSize, escapeHtml } from '../../utils/format.js'
import { getComfyTheme } from '../../utils/theme.js'
import type { FileItem } from '../../core/state.js'

/**
 * Create file browser panel
 * @param viewMode - View mode ('list' or 'grid')
 * @returns Panel element
 */
export function createBrowserPanel(viewMode: 'list' | 'grid' = 'list'): HTMLElement {
  const theme = getComfyTheme()
  const panel = document.createElement('div')
  panel.id = 'dm-browser-panel'
  panel.className = 'dm-browser-panel'
  panel.style.cssText = `
    flex: 1;
    display: flex;
    flex-direction: column;
    border-right: 1px solid ${theme.borderColor};
    overflow: hidden;
  `

  if (viewMode === 'list') {
    panel.appendChild(createListHeader())
  }

  const content = document.createElement('div')
  content.id = 'dm-file-list'
  if (viewMode === 'grid') {
    content.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 10px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
      gap: 10px;
      align-content: start;
      justify-content: start;
    `
  } else {
    content.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 5px 0;
    `
  }
  content.innerHTML = `
    <div class="dm-browser-loading" style="text-align: center; padding: 40px;">
      <i class="pi pi-spin pi-spinner" style="font-size: 24px;"></i>
    </div>
  `
  panel.appendChild(content)

  return panel
}

/**
 * Create list view header
 * @returns Header element
 */
function createListHeader(): HTMLElement {
  const theme = getComfyTheme()
  const header = document.createElement('div')
  header.className = 'dm-list-header'
  header.style.cssText = `
    display: flex;
    padding: 10px 15px;
    border-bottom: 1px solid ${theme.borderColor};
    font-size: 12px;
    font-weight: 600;
  `

  const createHeaderCell = (sortKey: string, label: string, width: string) => {
    const cell = document.createElement('div')
    cell.className = 'dm-header-cell'
    cell.dataset.sort = sortKey
    cell.style.cssText = `${width}; cursor: pointer; display: flex; align-items: center; gap: 5px; user-select: none;`
    cell.innerHTML = `<span>${label}</span><i class="pi pi-sort" style="font-size: 10px; opacity: 0.5;"></i>`
    cell.onclick = async () => {
      const { toggleSort } = await import('../components/actions.js')
      toggleSort(sortKey as 'name' | 'size' | 'modified')
    }
    return cell
  }

  header.appendChild(createHeaderCell('name', '名称', 'flex: 1;'))
  header.appendChild(createHeaderCell('size', '大小', 'flex: 0 0 100px;'))
  header.appendChild(createHeaderCell('modified', '修改日期', 'flex: 0 0 150px;'))

  return header
}

/**
 * Create list item HTML
 * @param file - File object
 * @param isParent - Whether it's parent directory
 * @returns HTML string
 */
export function createFileListItem(file: FileItem, isParent: boolean): string {
  const theme = getComfyTheme()
  const fileType = getFileType(file)
  const icon = FILE_TYPES[fileType]?.icon || FILE_TYPES.unknown.icon
  const color = FILE_TYPES[fileType]?.color || FILE_TYPES.unknown.color

  const size = file.is_dir ? '' : formatSize(file.size ?? 0) || ''
  const modified = file.modified ? formatDate(String(file.modified)) : ''

  return `
    <div class="dm-file-item" data-path="${escapeHtml(file.path || file.name)}" data-is-dir="${file.is_dir || false}"
         style="display: flex; align-items: center; padding: 10px 15px;
                border-bottom: 1px solid ${theme.borderColor}; cursor: pointer;
                transition: background 0.2s;">
      <div style="flex: 1; display: flex; align-items: center; gap: 10px; overflow: hidden;">
        <i class="pi ${icon} dm-file-icon" style="color: ${color}; font-size: 16px;"></i>
        <span class="dm-file-name" style="font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(file.name)}</span>
      </div>
      <div class="dm-file-size" style="flex: 0 0 100px; font-size: 12px;">${size}</div>
      <div class="dm-file-modified" style="flex: 0 0 150px; font-size: 12px;">${modified}</div>
    </div>
  `
}

/**
 * Create grid item HTML
 * @param file - File object
 * @param isParent - Whether it's parent directory
 * @returns HTML string
 */
export function createFileGridItem(file: FileItem, isParent: boolean): string {
  const theme = getComfyTheme()

  // Parent directory uses special style
  if (isParent) {
    return `
      <div class="dm-grid-item dm-grid-item-parent" data-path="${file.path}" data-is-dir="true"
           data-name=".."
           style="display: flex; flex-direction: column; align-items: center; justify-content: center;
                  padding: 10px; min-height: 100px;
                  border-radius: 8px; cursor: pointer;
                  transition: all 0.2s; border: 2px dashed ${theme.borderColor}; box-sizing: border-box;">
        <i class="pi pi-folder-open dm-parent-icon" style="font-size: 36px;"></i>
        <span class="dm-parent-text" style="font-size: 11px; text-align: center;
                      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                      width: 100%; margin-top: 6px; line-height: 1.3;">返回上级</span>
      </div>
    `
  }

  const fileType = getFileType(file)
  const icon = FILE_TYPES[fileType]?.icon || FILE_TYPES.unknown.icon
  const color = FILE_TYPES[fileType]?.color || FILE_TYPES.unknown.color

  // For image files, show actual thumbnail instead of icon
  const filePath = file.path || file.name
  if (fileType === 'image' && !file.is_dir && filePath) {
    const thumbUrl = `/dm/preview?path=${encodeURIComponent(filePath)}`
    return `
      <div class="dm-grid-item dm-grid-item-image" data-path="${escapeHtml(filePath)}" data-is-dir="false"
           data-name="${escapeHtml(file.name)}"
           style="display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
                  padding: 8px; min-height: 100px;
                  border-radius: 8px; cursor: pointer;
                  transition: all 0.2s; border: 2px solid ${theme.borderColor}; box-sizing: border-box;">
        <div style="width: 100%; aspect-ratio: 1; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 6px; background: ${theme.bgTertiary};">
          <img src="${thumbUrl}" class="dm-grid-thumbnail" alt="${escapeHtml(file.name)}"
               style="width: 100%; height: 100%; object-fit: cover;"
               onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
          <i class="pi ${icon} dm-grid-icon" style="display: none; color: ${color}; font-size: 32px;"></i>
        </div>
        <span class="dm-grid-filename" style="font-size: 10px; text-align: center;
                      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                      width: 100%; margin-top: 6px; line-height: 1.3;">${escapeHtml(file.name)}</span>
      </div>
    `
  }

  return `
    <div class="dm-grid-item" data-path="${escapeHtml(filePath)}" data-is-dir="${file.is_dir || false}"
         data-name="${escapeHtml(file.name)}"
         style="display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
                padding: 8px; min-height: 100px;
                border-radius: 8px; cursor: pointer;
                transition: all 0.2s; border: 2px solid ${theme.borderColor}; box-sizing: border-box;">
      <div style="width: 100%; aspect-ratio: 1; display: flex; align-items: center; justify-content: center;">
        <i class="pi ${icon} dm-grid-icon" style="color: ${color}; font-size: 32px;"></i>
      </div>
      <span class="dm-grid-filename" style="font-size: 10px; text-align: center;
                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                    width: 100%; margin-top: 6px; line-height: 1.3;">${escapeHtml(file.name)}</span>
    </div>
  `
}
