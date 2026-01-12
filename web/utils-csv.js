/**
 * utils-csv.js - CSV 解析工具
 *
 * 提供 CSV 文件解析功能
 */

/**
 * 解析 CSV 文本
 * @param {string} text - CSV 文本
 * @returns {Array} 二维数组
 */
export function parseCSV(text) {
    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (inQuotes) {
            if (char === '"') {
                if (nextChar === '"') {
                    currentCell += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                currentCell += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                currentRow.push(currentCell);
                currentCell = '';
            } else if (char === '\r' && nextChar === '\n') {
                currentRow.push(currentCell);
                rows.push(currentRow);
                currentRow = [];
                currentCell = '';
                i++;
            } else if (char === '\n') {
                currentRow.push(currentCell);
                rows.push(currentRow);
                currentRow = [];
                currentCell = '';
            } else if (char !== '\r') {
                currentCell += char;
            }
        }
    }

    // 添加最后一个单元格和行
    currentRow.push(currentCell);
    if (currentRow.length > 0 || rows.length > 0) {
        rows.push(currentRow);
    }

    return rows;
}
