/**
 * utils-syntax-highlight.js - 语法高亮工具
 *
 * 提供代码语法高亮功能，支持多种编程语言
 */

// 语法高亮颜色主题（VS Code Dark 风格）
const CODE_COLORS = {
    keyword: '#569cd6',      // 关键字 (blue)
    string: '#ce9178',       // 字符串 (orange)
    number: '#b5cea8',       // 数字 (light green)
    boolean: '#569cd6',      // 布尔值 (blue)
    null: '#569cd6',         // null (blue)
    comment: '#6a9955',      // 注释 (green)
    function: '#dcdcaa',     // 函数 (yellow)
    class: '#4ec9b0',        // 类 (cyan)
    tag: '#569cd6',          // HTML 标签
    attrName: '#9cdcfe',     // 属性名
    attrValue: '#ce9178',    // 属性值
};

/**
 * 通用语法高亮函数
 * @param {string} code - 源代码
 * @param {string} ext - 文件扩展名
 * @returns {string} 高亮后的 HTML
 */
export function highlightCode(code, ext) {
    // HTML 转义
    let result = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // 根据扩展名选择高亮规则
    switch (ext) {
        case '.json':
            result = highlightJSON(result);
            break;
        case '.py':
            result = highlightPython(result);
            break;
        case '.js':
        case '.ts':
        case '.jsx':
        case '.tsx':
            result = highlightJavaScript(result);
            break;
        case '.html':
        case '.htm':
            result = highlightHTML(result);
            break;
        case '.css':
            result = highlightCSS(result);
            break;
        case '.yaml':
        case '.yml':
            result = highlightYAML(result);
            break;
        case '.xml':
            result = highlightXML(result);
            break;
        default:
            result = highlightGeneric(result);
    }

    return result;
}

/**
 * JSON 语法高亮
 * @param {string} code - 代码
 * @returns {string} 高亮后的 HTML
 */
export function highlightJSON(code) {
    return code.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        let color = CODE_COLORS.number;
        if (/^"/.test(match)) color = /:$/.test(match) ? CODE_COLORS.attrName : CODE_COLORS.string;
        else if (/true|false|null/.test(match)) color = CODE_COLORS.boolean;
        return `<span style="color: ${color};">${match}</span>`;
    });
}

/**
 * Python 语法高亮
 * @param {string} code - 代码
 * @returns {string} 高亮后的 HTML
 */
export function highlightPython(code) {
    const keywords = /\b(def|class|import|from|if|elif|else|while|for|in|try|except|finally|with|as|return|yield|raise|pass|break|continue|and|or|not|is|lambda|True|False|None|async|await)\b/g;
    const decorators = /@[\w.]+/g;
    const strings = /("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
    const comments = /#.*$/gm;
    const numbers = /\b(\d+\.?\d*)\b/g;
    const functions = /\b([a-zA-Z_]\w*)\s*(?=\()/g;

    // 顺序很重要：注释 -> 字符串 -> 关键字 -> 函数 -> 数字
    return code
        .replace(comments, `<span style="color: ${CODE_COLORS.comment};">$&</span>`)
        .replace(strings, `<span style="color: ${CODE_COLORS.string};">$&</span>`)
        .replace(keywords, `<span style="color: ${CODE_COLORS.keyword};">$&</span>`)
        .replace(decorators, `<span style="color: ${CODE_COLORS.function};">$&</span>`)
        .replace(functions, `<span style="color: ${CODE_COLORS.function};">$1</span>(`)
        .replace(numbers, `<span style="color: ${CODE_COLORS.number};">$1</span>`);
}

/**
 * JavaScript/TypeScript 语法高亮
 * @param {string} code - 代码
 * @returns {string} 高亮后的 HTML
 */
export function highlightJavaScript(code) {
    const keywords = /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|this|class|extends|import|export|from|async|await|try|catch|finally|throw|null|undefined|true|false|in|instanceof|typeof|void)\b/g;
    const templateStrings = /`(?:[^`\\]|\\.)*`/g;
    const strings = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
    const comments = /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm;
    const numbers = /\b(\d+\.?\d*)\b/g;
    const functions = /\b([a-zA-Z_]\w*)\s*(?=\()/g;
    const arrowFunc = /(&gt;|=>)/g;

    return code
        .replace(comments, `<span style="color: ${CODE_COLORS.comment};">$&</span>`)
        .replace(templateStrings, `<span style="color: ${CODE_COLORS.string};">$&</span>`)
        .replace(strings, `<span style="color: ${CODE_COLORS.string};">$&</span>`)
        .replace(keywords, `<span style="color: ${CODE_COLORS.keyword};">$&</span>`)
        .replace(functions, `<span style="color: ${CODE_COLORS.function};">$1</span>(`)
        .replace(arrowFunc, `<span style="color: ${CODE_COLORS.keyword};">$&</span>`)
        .replace(numbers, `<span style="color: ${CODE_COLORS.number};">$1</span>`);
}

/**
 * HTML 语法高亮
 * @param {string} code - 代码
 * @returns {string} 高亮后的 HTML
 */
export function highlightHTML(code) {
    // HTML 标签
    code = code.replace(/(&lt;\/?)([\w-]+)/g, `$1<span style="color: ${CODE_COLORS.tag};">$2</span>`);
    // 属性名
    code = code.replace(/([\w-]+)(=)/g, `<span style="color: ${CODE_COLORS.attrName};">$1</span>$2`);
    // 属性值
    code = code.replace(/(=)("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, `$1<span style="color: ${CODE_COLORS.attrValue};">$2</span>`);
    return code;
}

/**
 * CSS 语法高亮
 * @param {string} code - 代码
 * @returns {string} 高亮后的 HTML
 */
export function highlightCSS(code) {
    // 注释
    code = code.replace(/(\/\*[\s\S]*?\*\/)/g, `<span style="color: ${CODE_COLORS.comment};">$1</span>`);
    // 选择器
    code = code.replace(/^([\s]*)([.#@][\w-]+|[\w]+|::?[\w-]+)/gm, `$1<span style="color: ${CODE_COLORS.class};">$2</span>`);
    // 属性名
    code = code.replace(/([\w-]+)(?=\s*:)/g, `<span style="color: ${CODE_COLORS.attrName};">$1</span>`);
    // 属性值
    code = code.replace(/:\s*([^;{]+)/g, `: <span style="color: ${CODE_COLORS.attrValue};">$1</span>`);
    return code;
}

/**
 * YAML 语法高亮
 * @param {string} code - 代码
 * @returns {string} 高亮后的 HTML
 */
export function highlightYAML(code) {
    // 键
    code = code.replace(/^(\s*)([\w-]+)(?=\s*:)/gm, `$1<span style="color: ${CODE_COLORS.attrName};">$2</span>:`);
    // 字符串值
    code = code.replace(/: ['"]([^'"]+)['"]/g, `: <span style="color: ${CODE_COLORS.string};">'$1'</span>`);
    // 布尔值和数字
    code = code.replace(/\b(true|false|yes|no|on|off)\b/gi, `<span style="color: ${CODE_COLORS.boolean};">$&</span>`);
    code = code.replace(/\b(\d+\.?\d*)\b/g, `<span style="color: ${CODE_COLORS.number};">$1</span>`);
    return code;
}

/**
 * XML 语法高亮
 * @param {string} code - 代码
 * @returns {string} 高亮后的 HTML
 */
export function highlightXML(code) {
    // 标签名
    code = code.replace(/(&lt;\/?)([\w-:]+)/g, `$1<span style="color: ${CODE_COLORS.tag};">$2</span>`);
    // 属性名
    code = code.replace(/([\w-:]+)(=)/g, `<span style="color: ${CODE_COLORS.attrName};">$1</span>$2`);
    // 属性值
    code = code.replace(/(=)("(?:[^"\\]|\\.)*")/g, `$1<span style="color: ${CODE_COLORS.attrValue};">$2</span>`);
    return code;
}

/**
 * 通用语法高亮（仅字符串和数字）
 * @param {string} code - 代码
 * @returns {string} 高亮后的 HTML
 */
export function highlightGeneric(code) {
    const strings = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
    const numbers = /\b(\d+\.?\d*)\b/g;
    const comments = /(#|\/\/).*$/gm;
    return code.replace(comments, `<span style="color: ${CODE_COLORS.comment};">$&</span>`)
        .replace(strings, `<span style="color: ${CODE_COLORS.string};">$&</span>`)
        .replace(numbers, `<span style="color: ${CODE_COLORS.number};">$1</span>`);
}
