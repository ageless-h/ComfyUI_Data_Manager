/**
 * ComfyUI Data Manager - Table Preview Utilities
 *
 * Provides CSV/Excel table preview functionality
 */

import { escapeHtml } from './format.js';
import { loadScript } from './script.js';
import { parseCSV } from './csv.js';
import { LIMITS } from '../core/constants.js';

/**
 * Table mode type
 */
export type TableModeType = 'floating' | 'panel';

/**
 * Table options
 */
export interface TableOptions {
  type?: TableModeType;
  maxRows?: number;
  height?: number | null;
}

/**
 * Default configuration
 */
const DEFAULT_OPTIONS: TableOptions = {
  type: 'floating',
  maxRows: LIMITS.MAX_PREVIEW_ROWS,
  height: null
};

/**
 * Table mode configuration
 */
type TableModeConfig = {
  containerClass: string;
  controlsClass: string;
  height: string | null;
  hasFullscreen: boolean;
  prefix: string;
};

const MODE_CONFIG: Record<'floating' | 'panel', TableModeConfig> = {
  floating: {
    containerClass: 'dm-table-container',
    controlsClass: 'dm-table-controls',
    height: null,
    hasFullscreen: false,
    prefix: 'dm-floating-table'
  },
  panel: {
    containerClass: 'dm-panel-table-container',
    controlsClass: 'dm-table-controls-panel',
    height: '400px',
    hasFullscreen: true,
    prefix: 'dm-table'
  }
};

/**
 * Create table HTML
 * @param rows - Two-dimensional array data
 * @param options - Configuration options
 * @returns HTML string
 */
export function createTableHTML(rows: string[][], options: TableOptions = {}): string {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const mode = MODE_CONFIG[mergedOptions.type || 'floating'];
  const displayRows = rows.slice(0, mergedOptions.maxRows || LIMITS.MAX_PREVIEW_ROWS);
  const isTruncated = rows.length > (mergedOptions.maxRows || LIMITS.MAX_PREVIEW_ROWS);
  const tableId = `${mode.prefix}-${Date.now()}`;

  const heightStyle = mode.height !== null ? `height: ${mode.height};` : 'height: 100%;';
  const containerStyle = `position: relative; flex: 1; overflow: hidden; ${heightStyle}`;

  let tableHTML = `
    <div style="display: flex; flex-direction: column; gap: 0; ${mergedOptions.type === 'floating' ? 'height: 100%;' : ''}">
      <div class="${mode.containerClass}" style="${containerStyle}">
        <div id="${tableId}-wrapper" class="dm-table-wrapper"
             style="width: 100%; overflow: auto; padding: 15px; ${heightStyle}">
          <table id="${tableId}" class="dm-data-table"
                 style="width: 100%; border-collapse: collapse; font-size: 12px; transform-origin: top left;">
  `;

  displayRows.forEach((row, rowIndex) => {
    const isHeader = rowIndex === 0;
    tableHTML += '<tr>';

    row.forEach(cell => {
      const cellContent = escapeHtml(String(cell ?? ''));
      if (isHeader) {
        tableHTML += `<th class="dm-table-header">${cellContent}</th>`;
      } else {
        tableHTML += `<td class="dm-table-cell">${cellContent}</td>`;
      }
    });

    tableHTML += '</tr>';
  });

  tableHTML += `
          </table>
        </div>
      </div>
      ${createTableControls(tableId, mode)}
    </div>
  `;

  if (isTruncated) {
    const maxRows = mergedOptions.maxRows || LIMITS.MAX_PREVIEW_ROWS;
    tableHTML = tableHTML.replace(
      '</div>',
      `<div class="dm-table-truncated" style="text-align: center; padding: 10px; font-size: 11px;">... (仅显示前 ${maxRows} 行，共 ${rows.length} 行)</div></div>`
    );
  }

  // Delay setting up controls
  setTimeout(() => setupTableControls(tableId, (mergedOptions.type || 'floating') as 'floating' | 'panel'), 0);

  return tableHTML;
}

/**
 * Create table controls HTML
 * @param tableId - Table ID
 * @param mode - Mode configuration
 * @returns Controls HTML string
 */
function createTableControls(tableId: string, mode: typeof MODE_CONFIG.floating): string {
  let controlsHTML = `
    <div id="${tableId}-controls" class="${mode.controlsClass}" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; flex-shrink: 0;">
      <button class="comfy-btn dm-table-zoom-out-btn" data-table-id="${tableId}" title="缩小">
        <i class="pi pi-search-minus"></i>
      </button>
      <span id="${tableId}-zoom" class="dm-table-zoom-display">100%</span>
      <button class="comfy-btn dm-table-zoom-in-btn" data-table-id="${tableId}" title="放大">
        <i class="pi pi-search-plus"></i>
      </button>
      <button class="comfy-btn dm-table-fit-btn" data-table-id="${tableId}" title="自动缩放">
        <i class="pi pi-arrows-alt"></i>
      </button>
  `;

  if (mode.hasFullscreen) {
    controlsHTML += `
      <button class="comfy-btn dm-table-fullscreen-btn" data-table-id="${tableId}" title="全屏">
        <i class="pi pi-window-maximize"></i>
      </button>
    `;
  }

  controlsHTML += '</div>';
  return controlsHTML;
}

/**
 * Setup table control events
 * @param tableId - Table ID
 * @param modeType - Mode type ('floating' | 'panel')
 */
export function setupTableControls(tableId: string, modeType: TableModeType = 'floating'): void {
  const table = document.getElementById(tableId);
  if (!table) return;

  const mode = MODE_CONFIG[modeType] || MODE_CONFIG.floating;
  let zoom = 100;
  let isFullscreen = false;
  const tableEl = table as HTMLElement;

  const wrapper = document.getElementById(`${tableId}-wrapper`);
  const zoomDisplay = document.getElementById(`${tableId}-zoom`);
  const zoomInBtn = document.querySelector(`.dm-table-zoom-in-btn[data-table-id="${tableId}"]`) as HTMLButtonElement;
  const zoomOutBtn = document.querySelector(`.dm-table-zoom-out-btn[data-table-id="${tableId}"]`) as HTMLButtonElement;
  const fitBtn = document.querySelector(`.dm-table-fit-btn[data-table-id="${tableId}"]`) as HTMLButtonElement;
  const fullscreenBtn = mode.hasFullscreen
    ? document.querySelector(`.dm-table-fullscreen-btn[data-table-id="${tableId}"]`) as HTMLButtonElement | null
    : null;

  function updateZoom(): void {
    tableEl.style.transform = `scale(${zoom / 100})`;
    if (zoomDisplay) zoomDisplay.textContent = `${zoom}%`;
    if (wrapper) {
      wrapper.style.width = zoom > 100 ? `${zoom}%` : '100%';
    }
  }

  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
      zoom = Math.min(zoom + LIMITS.DEFAULT_ZOOM_STEP, LIMITS.MAX_ZOOM_DISPLAY);
      updateZoom();
    });
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
      zoom = Math.max(zoom - LIMITS.DEFAULT_ZOOM_STEP, LIMITS.MIN_ZOOM_DISPLAY);
      updateZoom();
    });
  }

  if (fitBtn) {
    fitBtn.addEventListener('click', () => {
      const containerWidth = wrapper?.clientWidth || 400;
      const tableWidth = tableEl.scrollWidth;
      const newZoom = Math.min(Math.floor((containerWidth / tableWidth) * 100), 100);
      zoom = Math.max(newZoom, LIMITS.MIN_ZOOM_DISPLAY);
      updateZoom();
    });
  }

  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      isFullscreen = !isFullscreen;
      if (isFullscreen) {
        table.parentElement?.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    });
  }
}

/**
 * Create empty table HTML
 * @param message - Empty message
 * @returns HTML string
 */
export function createEmptyTableHTML(message = "表格为空"): string {
  return `
    <div style="text-align: center; padding: 40px; color: #666;">
      <i class="pi pi-table" style="font-size: 48px; opacity: 0.5;"></i>
      <div style="margin-top: 15px; font-size: 13px;">${escapeHtml(message)}</div>
    </div>
  `;
}

/**
 * Create unsupported table HTML
 * @param format - Format name
 * @returns HTML string
 */
export function createUnsupportedTableHTML(format: string): string {
  return `
    <div style="text-align: center; padding: 40px; color: #666;">
      <i class="pi pi-file-excel" style="font-size: 48px; opacity: 0.5;"></i>
      <div style="margin-top: 15px; font-size: 13px;">${escapeHtml(format)} 格式暂不支持</div>
    </div>
  `;
}

/**
 * Create table error HTML
 * @param error - Error message
 * @returns HTML string
 */
export function createTableErrorHTML(error: string): string {
  return `
    <div style="text-align: center; padding: 40px; color: #e74c3c;">
      <i class="pi pi-exclamation-triangle" style="font-size: 48px;"></i>
      <div style="margin-top: 15px; font-size: 13px;">表格解析失败</div>
      <div style="margin-top: 5px; font-size: 11px;">${escapeHtml(error)}</div>
    </div>
  `;
}

/**
 * Parse spreadsheet file (CSV or Excel)
 * @param path - File path
 * @param ext - File extension
 * @returns Promise resolving to 2D array
 */
export async function parseSpreadsheet(path: string, ext: string): Promise<string[][]> {
  const response = await fetch(`/dm/preview?path=${encodeURIComponent(path)}`);

  if (!response.ok) {
    throw new Error('Failed to load file');
  }

  if (ext === '.csv') {
    const text = await response.text();
    return parseCSV(text);
  }

  // For Excel files, we would need SheetJS (xlsx) library
  // For now, return unsupported error
  throw new Error('Excel format requires SheetJS library');
}
