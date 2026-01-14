/**
 * ComfyUI Data Manager - Syntax Highlighting Utilities
 */

// Syntax highlight color theme (VS Code Dark style)
const CODE_COLORS = {
  keyword: '#569cd6', // Keywords (blue)
  string: '#ce9178', // Strings (orange)
  number: '#b5cea8', // Numbers (light green)
  boolean: '#569cd6', // Booleans (blue)
  null: '#569cd6', // null (blue)
  comment: '#6a9955', // Comments (green)
  function: '#dcdcaa', // Functions (yellow)
  class: '#4ec9b0', // Classes (cyan)
  tag: '#569cd6', // HTML tags
  attrName: '#9cdcfe', // Attribute names
  attrValue: '#ce9178', // Attribute values
} as const

/**
 * Generic syntax highlight function
 * @param code - Source code
 * @param ext - File extension
 * @returns Highlighted HTML string
 */
export function highlightCode(code: string, ext: string): string {
  // HTML escape
  let result = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // Select highlight rules based on extension
  switch (ext) {
    case '.json':
      result = highlightJSON(result)
      break
    case '.py':
      result = highlightPython(result)
      break
    case '.js':
    case '.ts':
    case '.jsx':
    case '.tsx':
      result = highlightJavaScript(result)
      break
    case '.html':
    case '.htm':
      result = highlightHTML(result)
      break
    case '.css':
      result = highlightCSS(result)
      break
    case '.yaml':
    case '.yml':
      result = highlightYAML(result)
      break
    case '.xml':
      result = highlightXML(result)
      break
    default:
      result = highlightGeneric(result)
  }

  return result
}

/**
 * JSON syntax highlight
 * @param code - JSON code
 * @returns Highlighted HTML string
 */
export function highlightJSON(code: string): string {
  return code.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    function (match) {
      let color: string = CODE_COLORS.number
      if (/^"/.test(match)) color = /:$/.test(match) ? CODE_COLORS.attrName : CODE_COLORS.string
      else if (/true|false|null/.test(match)) color = CODE_COLORS.boolean
      return `<span style="color: ${color};">${match}</span>`
    }
  )
}

/**
 * Python syntax highlight
 * @param code - Python code
 * @returns Highlighted HTML string
 */
export function highlightPython(code: string): string {
  const keywords =
    /\b(def|class|import|from|if|elif|else|while|for|in|try|except|finally|with|as|return|yield|raise|pass|break|continue|and|or|not|is|lambda|True|False|None|async|await)\b/g
  const decorators = /@[\w.]+/g
  const strings = /("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g
  const comments = /#.*$/gm
  const numbers = /\b(\d+\.?\d*)\b/g
  const functions = /\b([a-zA-Z_]\w*)\s*(?=\()/g

  // Order matters: comments -> strings -> keywords -> functions -> numbers
  return code
    .replace(comments, `<span style="color: ${CODE_COLORS.comment};">$&</span>`)
    .replace(strings, `<span style="color: ${CODE_COLORS.string};">$&</span>`)
    .replace(keywords, `<span style="color: ${CODE_COLORS.keyword};">$&</span>`)
    .replace(decorators, `<span style="color: ${CODE_COLORS.function};">$&</span>`)
    .replace(functions, `<span style="color: ${CODE_COLORS.function};">$1</span>(`)
    .replace(numbers, `<span style="color: ${CODE_COLORS.number};">$1</span>`)
}

/**
 * JavaScript/TypeScript syntax highlight
 * @param code - JavaScript code
 * @returns Highlighted HTML string
 */
export function highlightJavaScript(code: string): string {
  const keywords =
    /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|this|class|extends|import|export|from|async|await|try|catch|finally|throw|null|undefined|true|false|in|instanceof|typeof|void)\b/g
  const templateStrings = /`(?:[^`\\]|\\.)*`/g
  const strings = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g
  const comments = /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm
  const numbers = /\b(\d+\.?\d*)\b/g
  const functions = /\b([a-zA-Z_]\w*)\s*(?=\()/g
  const arrowFunc = /(&gt;|=>)/g

  return code
    .replace(comments, `<span style="color: ${CODE_COLORS.comment};">$&</span>`)
    .replace(templateStrings, `<span style="color: ${CODE_COLORS.string};">$&</span>`)
    .replace(strings, `<span style="color: ${CODE_COLORS.string};">$&</span>`)
    .replace(keywords, `<span style="color: ${CODE_COLORS.keyword};">$&</span>`)
    .replace(functions, `<span style="color: ${CODE_COLORS.function};">$1</span>(`)
    .replace(arrowFunc, `<span style="color: ${CODE_COLORS.keyword};">$&</span>`)
    .replace(numbers, `<span style="color: ${CODE_COLORS.number};">$1</span>`)
}

/**
 * HTML syntax highlight
 * @param code - HTML code
 * @returns Highlighted HTML string
 */
export function highlightHTML(code: string): string {
  // HTML tags
  code = code.replace(/(&lt;\/?)([\w-]+)/g, `$1<span style="color: ${CODE_COLORS.tag};">$2</span>`)
  // Attribute names
  code = code.replace(/([\w-]+)(=)/g, `<span style="color: ${CODE_COLORS.attrName};">$1</span>$2`)
  // Attribute values
  code = code.replace(
    /(=)("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,
    `$1<span style="color: ${CODE_COLORS.attrValue};">$2</span>`
  )
  return code
}

/**
 * CSS syntax highlight
 * @param code - CSS code
 * @returns Highlighted HTML string
 */
export function highlightCSS(code: string): string {
  // Comments
  code = code.replace(
    /(\/\*[\s\S]*?\*\/)/g,
    `<span style="color: ${CODE_COLORS.comment};">$1</span>`
  )
  // Strings
  code = code.replace(
    /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,
    `<span style="color: ${CODE_COLORS.string};">$1</span>`
  )
  // Properties
  code = code.replace(
    /([\w-]+)(\s*:)/g,
    `<span style="color: ${CODE_COLORS.attrName};">$1</span>$2`
  )
  // Values with units
  code = code.replace(
    /(:\s*)([\d.#\w-]+)/g,
    `$1<span style="color: ${CODE_COLORS.attrValue};">$2</span>`
  )
  // Selectors (at start of line or after })
  code = code.replace(
    /([.#]?[\w-]+)(\s*\{)/g,
    `<span style="color: ${CODE_COLORS.tag};">$1</span>$2`
  )
  return code
}

/**
 * YAML syntax highlight
 * @param code - YAML code
 * @returns Highlighted HTML string
 */
export function highlightYAML(code: string): string {
  // Comments
  code = code.replace(/(#.*$)/gm, `<span style="color: ${CODE_COLORS.comment};">$1</span>`)
  // Keys (before colon)
  code = code.replace(/^([\w-]+):/gm, `<span style="color: ${CODE_COLORS.attrName};">$1</span>:`)
  // Values (after colon)
  code = code.replace(
    /(:\s*)([\w./-]+)/g,
    `$1<span style="color: ${CODE_COLORS.string};">$2</span>`
  )
  // Booleans and null
  code = code.replace(
    /\b(true|false|null)\b/g,
    `<span style="color: ${CODE_COLORS.boolean};">$1</span>`
  )
  // Numbers
  code = code.replace(/\b(\d+\.?\d*)\b/g, `<span style="color: ${CODE_COLORS.number};">$1</span>`)
  return code
}

/**
 * XML syntax highlight
 * @param code - XML code
 * @returns Highlighted HTML string
 */
export function highlightXML(code: string): string {
  // Tags
  code = code.replace(/(&lt;\/?)([\w:]+)/g, `$1<span style="color: ${CODE_COLORS.tag};">$2</span>`)
  // Attribute names
  code = code.replace(/([\w:]+)(=)/g, `<span style="color: ${CODE_COLORS.attrName};">$1</span>$2`)
  // Attribute values
  code = code.replace(
    /(=)("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,
    `$1<span style="color: ${CODE_COLORS.attrValue};">$2</span>`
  )
  return code
}

/**
 * Generic syntax highlight (fallback)
 * @param code - Code
 * @returns Highlighted HTML string
 */
export function highlightGeneric(code: string): string {
  // Strings
  code = code.replace(
    /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g,
    `<span style="color: ${CODE_COLORS.string};">$1</span>`
  )
  // Comments (// and /* */)
  code = code.replace(/(\/\/.*$)/gm, `<span style="color: ${CODE_COLORS.comment};">$1</span>`)
  code = code.replace(
    /(\/\*[\s\S]*?\*\/)/g,
    `<span style="color: ${CODE_COLORS.comment};">$1</span>`
  )
  // Keywords
  const keywords =
    /\b(function|return|if|else|for|while|var|let|const|true|false|null|undefined)\b/g
  code = code.replace(keywords, `<span style="color: ${CODE_COLORS.keyword};">$1</span>`)
  // Numbers
  code = code.replace(/\b(\d+\.?\d*)\b/g, `<span style="color: ${CODE_COLORS.number};">$1</span>`)
  return code
}
