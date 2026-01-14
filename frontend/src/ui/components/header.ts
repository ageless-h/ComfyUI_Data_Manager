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
 * Create window header (ComfyUI style)
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

  const theme = getComfyTheme();

  const header = document.createElement("div");
  header.className = "dm-header dm-preview-header";
  header.setAttribute('draggable', 'false');

  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
    background: transparent;
    border-bottom: 0.8px solid ${theme.borderColor};
    cursor: move;
    user-select: none;
    gap: 12px;
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
    font-weight: 500;
    flex: 1 1 0%;
    color: ${theme.textPrimary};
  `;

  const iconElement = document.createElement("i");
  iconElement.className = `pi ${icon}`;
  iconElement.style.color = theme.textSecondary;

  const titleText = document.createElement("span");
  titleText.style.cssText = `
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `;
  titleText.textContent = title;

  titleArea.appendChild(iconElement);
  titleArea.appendChild(titleText);

  // Actions area (right side)
  const actions = document.createElement("div");
  actions.style.cssText = "display: flex; gap: 8px; align-items: center;";

  if (onRefresh) {
    const refreshBtn = createHeaderButton("pi-refresh", "刷新", onRefresh);
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
 * Create traffic light button (ComfyUI style)
 * @param icon - Icon class name
 * @param title - Tooltip text
 * @param onClick - Click callback
 * @returns Button element
 */
function createTrafficButton(icon: string, title: string, onClick: (() => void) | null): HTMLElement {
  const theme = getComfyTheme();
  const button = document.createElement("button");
  button.className = "comfy-btn dm-traffic-btn";
  button.innerHTML = `<i class="pi ${icon}" style="font-size: 12px;"></i>`;
  button.style.cssText = `
    width: 28px;
    height: 28px;
    padding: 0;
    background: transparent;
    border: 0.8px solid ${theme.borderColor};
    border-radius: 6px;
    color: ${theme.textSecondary};
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  `;
  button.title = title;

  // Hover effect
  button.onmouseenter = () => {
    button.style.background = theme.bgTertiary;
    button.style.color = theme.textPrimary;
  };
  button.onmouseleave = () => {
    button.style.background = "transparent";
    button.style.color = theme.textSecondary;
  };

  if (onClick) {
    button.onclick = (e) => {
      e.stopPropagation();
      onClick();
    };
  }

  return button;
}

/**
 * Create header button (ComfyUI style)
 * @param icon - Icon class name
 * @param title - Title text
 * @param onClick - Click callback
 * @returns Button element
 */
export function createHeaderButton(icon: string, title: string, onClick: () => void): HTMLElement {
  const theme = getComfyTheme();
  const button = document.createElement("button");
  button.className = "comfy-btn dm-header-btn";
  button.innerHTML = `<i class="pi ${icon}" style="font-size: 14px;"></i>`;
  button.style.cssText = `
    width: 28px;
    height: 28px;
    padding: 0;
    background: transparent;
    border: 0.8px solid ${theme.borderColor};
    border-radius: 6px;
    color: ${theme.textSecondary};
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
  `;
  button.title = title;

  button.onmouseenter = () => {
    button.style.background = theme.bgTertiary;
    button.style.color = theme.textPrimary;
  };
  button.onmouseleave = () => {
    button.style.background = "transparent";
    button.style.color = theme.textSecondary;
  };
  button.onmouseout = () => button.style.background = "transparent";
  button.onclick = onClick;
  return button;
}
