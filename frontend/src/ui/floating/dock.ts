/**
 * ComfyUI Data Manager - Floating Dock Management
 */

import { updateStatus } from '../../utils/helpers.js'
import { previewFloatingWindows } from '../../core/state.js'
import { getComfyTheme } from '../../utils/theme.js'
import type { FloatingWindowData } from '../../core/types.js'

/**
 * Update Dock panel
 */
export function updateDock(): void {
  const dock = document.getElementById('dm-preview-dock')
  if (!dock) return

  const theme = getComfyTheme()

  // Clear Dock
  dock.innerHTML = ''

  // Get minimized windows
  const minimizedWindows = (previewFloatingWindows as FloatingWindowData[]).filter(
    (w) => w.minimized
  )
  if (minimizedWindows.length === 0) {
    ;(dock as HTMLElement).style.minHeight = '0'
    ;(dock as HTMLElement).style.maxHeight = '0'
    ;(dock as HTMLElement).style.padding = '0 15px'
    return
  }

  // Show Dock
  ;(dock as HTMLElement).style.minHeight = '60px'
  ;(dock as HTMLElement).style.maxHeight = '60px'
  ;(dock as HTMLElement).style.padding = '10px 15px'

  // Add thumbnail for each minimized window
  minimizedWindows.forEach((w) => {
    const thumbnail = document.createElement('div')
    thumbnail.className = 'dm-dock-thumbnail'
    thumbnail.style.cssText = `
      width: 80px;
      height: 50px;
      background: ${theme.bgSecondary};
      border: 1px solid ${theme.borderColor};
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      transition: all 0.2s;
    `
    thumbnail.title = `${w.fileName} - 点击恢复`
    thumbnail.innerHTML = `
      <i class="pi ${w.fileConfig.icon}" style="color: ${w.fileConfig.color}; font-size: 16px;"></i>
      <span style="color: ${theme.textSecondary}; font-size: 9px; max-width: 70px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${w.fileName}</span>
    `
    thumbnail.onmouseover = () => {
      ;(thumbnail as HTMLElement).style.background = theme.bgTertiary
      ;(thumbnail as HTMLElement).style.borderColor = w.fileConfig.color
    }
    thumbnail.onmouseout = () => {
      ;(thumbnail as HTMLElement).style.background = theme.bgSecondary
      ;(thumbnail as HTMLElement).style.borderColor = theme.borderColor
    }
    thumbnail.onclick = () => restoreFloatingPreview(w.window)

    dock.appendChild(thumbnail)
  })
}

/**
 * Restore minimized floating preview window
 * @param window - Floating window element
 */
export function restoreFloatingPreview(window: HTMLElement): void {
  ;(window as HTMLElement).style.display = 'flex'

  // 查找窗口数据并更新 minimized 状态
  const windowData = (previewFloatingWindows as FloatingWindowData[]).find(
    (w) => w.window === window
  )
  if (windowData) {
    windowData.minimized = false
  }

  updateDock()
}
