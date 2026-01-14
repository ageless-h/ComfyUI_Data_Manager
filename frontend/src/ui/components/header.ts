/**
 * ComfyUI Data Manager - Header Component
 */

import type { ComfyTheme } from '../../utils/theme.js';
import { getComfyTheme, addThemeListener } from '../../utils/theme.js';

/**
 * Header options
 */
export interface HeaderOptions {
  title?: string;
  icon?: string;
  onClose?: () => void;
  onMinimize?: () => void;
  onFullscreen?: () => void;
  onRefresh?: () => void;
}

// Theme change callback storage
let themeChangeCallback: ((theme: ComfyTheme) => void) | null = null;

/**
 * Apply theme to header
 * @param header - Header element
 * @param theme - Theme object
 */
function applyThemeToHeader(header: HTMLElement, theme: ComfyTheme): void {
  if (!header) return;

  header.style.background = `linear-gradient(135deg, ${theme.bgSecondary} 0%, ${theme.bgPrimary} 100%)`;
  header.style.borderColor = theme.borderColor;
}

/**
 * Create window header (macOS style)
 * @param options - Configuration options
 * @returns Header element
 */
export function createHeader(options: HeaderOptions = {}): HTMLElement {
  const {
    title = 'Data Manager',
    icon = 'pi-folder-open',
    onClose = null,
    onMinimize = null,
    onFullscreen = null,
    onRefresh = null
  } = options;

  const header = document.createElement("div");
  header.className = "dm-header dm-preview-header";
  header.setAttribute('draggable', 'false');

  const theme = getComfyTheme();

  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 15px;
    background: linear-gradient(135deg, ${theme.bgSecondary} 0%, ${theme.bgPrimary} 100%);
    border-bottom: 1px solid ${theme.borderColor};
    cursor: move;
    user-select: none;
  `;

  // Traffic light buttons (macOS style)
  const trafficLights = document.createElement("div");
  trafficLights.className = "dm-traffic-lights";
  trafficLights.style.cssText = "display: flex; gap: 8px;";

  const closeBtn = createTrafficButton("pi-times", "关闭", onClose);
  const minimizeBtn = createTrafficButton("pi-minus", "最小化", onMinimize);
  const fullscreenBtn = createTrafficButton("pi-window-maximize", "全屏", onFullscreen);

  trafficLights.appendChild(closeBtn);
  trafficLights.appendChild(minimizeBtn);
  trafficLights.appendChild(fullscreenBtn);

  // Title area
  const titleArea = document.createElement("div");
  titleArea.className = "dm-header-title-area";
  titleArea.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    flex: 1 1 0%;
    justify-content: center;
  `;

  const iconElement = document.createElement("i");
  iconElement.className = `pi ${icon}`;

  const titleText = document.createElement("span");
  titleText.style.cssText = `
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `;
  titleText.textContent = title;

  titleArea.appendChild(iconElement);
  titleArea.appendChild(titleText);

  // Actions area (right side)
  const actions = document.createElement("div");
  actions.style.cssText = "display: flex; gap: 8px;";

  if (onRefresh) {
    const refreshBtn = createHeaderButton("pi-refresh", "刷新", onRefresh);
    refreshBtn.style.background = "transparent";
    actions.appendChild(refreshBtn);
  }

  header.appendChild(trafficLights);
  header.appendChild(titleArea);
  header.appendChild(actions);

  // Store theme update function
  (header as unknown as { _updateTheme?: () => void })._updateTheme = () => {
    const currentTheme = getComfyTheme();
    applyThemeToHeader(header, currentTheme);
    if (themeChangeCallback) {
      themeChangeCallback(currentTheme);
    }
  };

  // Register theme change listener
  addThemeListener((theme) => {
    applyThemeToHeader(header, theme);
  });

  return header;
}

/**
 * Create traffic light button (macOS style round button)
 * @param icon - Icon class name
 * @param title - Tooltip text
 * @param onClick - Click callback
 * @returns Button element
 */
function createTrafficButton(icon: string, title: string, onClick: (() => void) | null): HTMLElement {
  const button = document.createElement("button");
  button.className = "comfy-btn dm-traffic-btn";
  button.innerHTML = `<i class="pi ${icon}" style="font-size: 10px;"></i>`;
  button.style.cssText = `
    width: 14px;
    height: 14px;
    padding: 0px;
    background: transparent;
    border: none;
    cursor: pointer;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: 0.15s;
  `;
  button.title = title;

  if (onClick) {
    button.onclick = (e) => {
      e.stopPropagation();
      onClick();
    };
  }

  return button;
}

/**
 * Create header button
 * @param icon - Icon class name
 * @param title - Title text
 * @param onClick - Click callback
 * @returns Button element
 */
export function createHeaderButton(icon: string, title: string, onClick: () => void): HTMLElement {
  const button = document.createElement("button");
  button.className = "comfy-btn dm-header-btn";
  button.innerHTML = `<i class="pi ${icon}"></i>`;
  button.style.cssText = `
    padding: 6px 10px;
    background: transparent;
    border: none;
    cursor: pointer;
    border-radius: 4px;
  `;
  button.title = title;
  button.onmouseover = () => button.style.background = "";
  button.onmouseout = () => button.style.background = "transparent";
  button.onclick = onClick;
  return button;
}
