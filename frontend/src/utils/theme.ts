/**
 * ComfyUI Data Manager - Theme Utilities
 *
 * Get ComfyUI CSS variables and adapt to Data Manager interface
 */

// Theme listener callback type
export type ThemeListener = (theme: ComfyTheme) => void;

// Theme listeners
const themeListeners: ThemeListener[] = [];

/**
 * ComfyUI theme colors interface
 */
export interface ComfyTheme {
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  inputBg: string;
  inputText: string;
  borderColor: string;
  textPrimary: string;
  textSecondary: string;
  accentColor: string;
  errorColor: string;
  successColor: string;
  isLight: boolean;
}

/**
 * Add theme change listener
 * @param callback - Callback function when theme changes
 */
export function addThemeListener(callback: ThemeListener): void {
  themeListeners.push(callback);
}

/**
 * Notify all theme listeners
 */
export function notifyThemeChanged(): void {
  const theme = getComfyTheme();
  themeListeners.forEach(callback => {
    try {
      callback(theme);
    } catch (e) {
      console.error('[DataManager] Theme listener error:', e);
    }
  });
}

/**
 * Setup ComfyUI theme watcher
 */
function setupThemeWatcher(): { observer: MutationObserver; checkInterval: number } {
  // Listen for body attribute changes (some theme systems switch themes via attributes)
  const observer = new MutationObserver((mutations) => {
    let shouldUpdate = false;
    for (const mutation of mutations) {
      if (mutation.type === 'attributes') {
        shouldUpdate = true;
        break;
      }
    }
    if (shouldUpdate) {
      applyComfyTheme();
      notifyThemeChanged();
    }
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'data-theme']
  });

  // Listen for CSS variable changes
  let lastThemeValues = getThemeValues();
  const checkInterval = window.setInterval(() => {
    const currentThemeValues = getThemeValues();
    if (JSON.stringify(lastThemeValues) !== JSON.stringify(currentThemeValues)) {
      lastThemeValues = currentThemeValues;
      applyComfyTheme();
      notifyThemeChanged();
    }
  }, 2000);

  return { observer, checkInterval };
}

/**
 * Get current theme values for comparison
 */
function getThemeValues(): Record<string, string> {
  const rootStyle = window.getComputedStyle(document.documentElement);
  return {
    bg: rootStyle.getPropertyValue('--comfy-menu-bg'),
    bg2: rootStyle.getPropertyValue('--comfy-menu-bg-2'),
    inputText: rootStyle.getPropertyValue('--input-text'),
    borderColor: rootStyle.getPropertyValue('--border-color')
  };
}

// Theme watcher instance
let themeWatcher: { observer: MutationObserver; checkInterval: number } | null = null;

/**
 * Initialize theme system
 */
export function initThemeSystem(): void {
  if (!themeWatcher) {
    // Delay initialization to ensure DOM is fully loaded
    setTimeout(() => {
      try {
        themeWatcher = setupThemeWatcher();
      } catch (error) {
        console.error('[DataManager] Theme watcher init failed:', error);
      }
    }, 1000);
  }
}

/**
 * Check if a color is light
 * @param color - CSS color value
 * @returns True if color is light
 */
function isLightColor(color: string): boolean {
  const hex = color.replace('#', '');
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 128;
  }
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 128;
  }
  return false;
}

/**
 * Get ComfyUI theme CSS variables
 * @returns Theme color object
 */
export function getComfyTheme(): ComfyTheme {
  try {
    const rootStyle = window.getComputedStyle(document.documentElement);
    const bodyStyle = window.getComputedStyle(document.body);

    // Get background colors
    const bgPrimary = rootStyle.getPropertyValue('--comfy-menu-bg')?.trim() || '#1a1a1a';
    const bgSecondary = rootStyle.getPropertyValue('--comfy-menu-bg-2')?.trim() ||
                         rootStyle.getPropertyValue('--comfy-menu-secondary-bg')?.trim() || '#252525';
    const inputBg = rootStyle.getPropertyValue('--comfy-input-bg')?.trim() || '#2a2a2a';

    // Detect if light theme
    const isLight = isLightColor(bgPrimary);

    // Select text colors based on theme brightness
    const textPrimary = rootStyle.getPropertyValue('--input-text')?.trim() ||
                        rootStyle.getPropertyValue('--input-text-text')?.trim() ||
                        (isLight ? '#222' : '#ddd');
    const textSecondary = rootStyle.getPropertyValue('--descrip-text')?.trim() ||
                          (isLight ? '#666' : '#999');

    return {
      // Background colors
      bgPrimary: bgPrimary,
      bgSecondary: bgSecondary,
      bgTertiary: rootStyle.getPropertyValue('--comfy-menu-bg-3')?.trim() || '#2a2a2a',

      // Input
      inputBg: inputBg,
      inputText: textPrimary,

      // Border
      borderColor: rootStyle.getPropertyValue('--border-color')?.trim() ||
                    (isLight ? '#ddd' : '#3a3a3a'),

      // Text
      textPrimary: textPrimary,
      textSecondary: textSecondary,

      // Accent (some themes may define)
      accentColor: rootStyle.getPropertyValue('--comfy-accent')?.trim() || '#9b59b6',

      // Error/success
      errorColor: '#e74c3c',
      successColor: '#27ae60',
      isLight
    };
  } catch (error) {
    console.warn('[DataManager] Failed to get ComfyUI theme:', error);
    // Return default dark theme
    return {
      bgPrimary: '#1a1a1a',
      bgSecondary: '#252525',
      bgTertiary: '#2a2a2a',
      inputBg: '#2a2a2a',
      inputText: '#ddd',
      borderColor: '#3a3a3a',
      textPrimary: '#ddd',
      textSecondary: '#999',
      accentColor: '#9b59b6',
      errorColor: '#e74c3c',
      successColor: '#27ae60',
      isLight: false
    };
  }
}

/**
 * Apply ComfyUI theme to Data Manager elements
 */
export function applyComfyTheme(): void {
  const theme = getComfyTheme();

  // Apply CSS custom properties to root
  const root = document.documentElement;
  root.style.setProperty('--dm-bg-primary', theme.bgPrimary);
  root.style.setProperty('--dm-bg-secondary', theme.bgSecondary);
  root.style.setProperty('--dm-bg-tertiary', theme.bgTertiary);
  root.style.setProperty('--dm-input-bg', theme.inputBg);
  root.style.setProperty('--dm-input-text', theme.inputText);
  root.style.setProperty('--dm-border-color', theme.borderColor);
  root.style.setProperty('--dm-text-primary', theme.textPrimary);
  root.style.setProperty('--dm-text-secondary', theme.textSecondary);
  root.style.setProperty('--dm-accent-color', theme.accentColor);
  root.style.setProperty('--dm-error-color', theme.errorColor);
  root.style.setProperty('--dm-success-color', theme.successColor);
}
