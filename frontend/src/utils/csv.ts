/**
 * ComfyUI Data Manager - CSV Parsing Utilities
 */

/**
 * Parse CSV text into 2D array
 * @param text - CSV text
 * @returns Two-dimensional array
 */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentCell = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const nextChar = text[i + 1]

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentCell += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        currentCell += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        currentRow.push(currentCell)
        currentCell = ''
      } else if (char === '\r' && nextChar === '\n') {
        currentRow.push(currentCell)
        rows.push(currentRow)
        currentRow = []
        currentCell = ''
        i++
      } else if (char === '\n') {
        currentRow.push(currentCell)
        rows.push(currentRow)
        currentRow = []
        currentCell = ''
      } else if (char !== '\r') {
        currentCell += char
      }
    }
  }

  // Add last cell and row
  currentRow.push(currentCell)
  if (currentRow.length > 0 || rows.length > 0) {
    rows.push(currentRow)
  }

  return rows
}
