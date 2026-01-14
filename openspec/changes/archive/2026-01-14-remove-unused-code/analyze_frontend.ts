// TypeScript/JavaScript 未使用导出分析工具
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const srcDir = join(__dirname, 'src');

interface ExportInfo {
  name: string;
  type: 'function' | 'class' | 'interface' | 'type' | 'variable' | 'enum';
  line: number;
  file: string;
  fullPath: string;
}

interface ImportInfo {
  module: string;
  imports: string[];
  file: string;
}

const exportsByFile = new Map<string, ExportInfo[]>();
const allImports: ImportInfo[] = [];

function walkDir(dir: string, callback: (file: string) => void) {
  const files = readdirSync(dir);
  for (const file of files) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      walkDir(fullPath, callback);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      callback(fullPath);
    }
  }
}

function extractExports(content: string, filePath: string): ExportInfo[] {
  const exports: ExportInfo[] = [];
  const lines = content.split('\n');

  const exportPatterns = [
    // export function/class
    /^\s*export\s+(?:async\s+)?function\s+(\w+)/,
    /^\s*export\s+class\s+(\w+)/,
    // export const/let/var
    /^\s*export\s+(?:const|let|var)\s+(\w+)/,
    // export interface/type
    /^\s*export\s+(interface|type)\s+(\w+)/,
    // export { name }
    /^\s*export\s*\{\s*([^}]+)\s*\}/,
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of exportPatterns) {
      const match = line.match(pattern);
      if (match) {
        if (pattern.toString().includes('interface|type')) {
          exports.push({
            name: match[2],
            type: match[1] === 'interface' ? 'interface' : 'type',
            line: i + 1,
            file: filePath,
            fullPath: filePath,
          });
        } else if (pattern.toString().includes('{')) {
          // export { name1, name2 }
          const names = match[1].split(',').map(n => n.trim().split(' as ')[0]);
          for (const name of names) {
            exports.push({
              name,
              type: 'variable',
              line: i + 1,
              file: filePath,
              fullPath: filePath,
            });
          }
        } else if (match[1]) {
          const type = line.includes('function') ? 'function' :
                      line.includes('class') ? 'class' :
                      line.includes('const') || line.includes('let') || line.includes('var') ? 'variable' : 'unknown';
          exports.push({
            name: match[1],
            type: type as any,
            line: i + 1,
            file: filePath,
            fullPath: filePath,
          });
        }
      }
    }
  }

  return exports;
}

function extractImports(content: string, filePath: string): ImportInfo[] {
  const imports: ImportInfo[] = [];
  const lines = content.split('\n');

  const importPatterns = [
    // import { a, b } from './module'
    /^\s*import\s*\{\s*([^}]+)\s*\}\s+from\s+['"]([^'"]+)['"]/,
    // import * as name from './module'
    /^\s*import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/,
    // import default from './module'
    /^\s*import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/,
  ];

  for (const line of lines) {
    for (const pattern of importPatterns) {
      const match = line.match(pattern);
      if (match) {
        const module = match[2];
        const importedItems = match[1].split(',').map(i => i.trim().split(' as ')[0]);
        imports.push({
          module,
          imports: importedItems,
          file: filePath,
        });
      }
    }
  }

  return imports;
}

// Main
console.log('分析前端代码...\n');

walkDir(srcDir, (filePath) => {
  const relativePath = filePath.replace(srcDir, '').replace(/\\/g, '/').replace(/^\//, '');
  const content = readFileSync(filePath, 'utf-8');

  // Extract exports
  const exports = extractExports(content, relativePath);
  if (exports.length > 0) {
    exportsByFile.set(relativePath, exports);
  }

  // Extract imports
  const imports = extractImports(content, relativePath);
  allImports.push(...imports);
});

console.log(`总文件数: ${exportsByFile.size}`);
console.log(`总导出数: ${[...exportsByFile.values()].flat().length}`);
console.log(`总导入数: ${allImports.length}\n`);

// Build a map of module exports
const moduleExports = new Map<string, Set<string>>();
for (const [file, exports] of exportsByFile) {
  // Skip test files
  if (file.includes('.test.')) continue;

  const moduleName = file.replace(/\.ts$/, '').replace(/\.tsx$/, '.js');
  const exportedNames = new Set(exports.map(e => e.name));
  moduleExports.set(moduleName, exportedNames);
}

// Check for unused exports
const unusedExports = new Map<string, ExportInfo[]>();

for (const [file, exports] of exportsByFile) {
  if (file.includes('.test.')) continue;

  for (const exp of exports) {
    const moduleName = file.replace(/\.ts$/, '').replace(/\.tsx$/, '.js');

    // Check if any import references this export
    let isUsed = false;

    for (const imp of allImports) {
      // Skip self-imports
      if (imp.file === file) continue;

      // Check if this import is from the same module
      const importModule = imp.module.replace(/\.ts$/, '').replace(/\.tsx$/, '.js');
      if (!importModule.endsWith(moduleName) && !moduleName.endsWith(importModule)) {
        continue;
      }

      // Check if this export is imported
      if (imp.imports.includes(exp.name) || imp.imports.includes('*')) {
        isUsed = true;
        break;
      }
    }

    if (!isUsed) {
      if (!unusedExports.has(file)) {
        unusedExports.set(file, []);
      }
      unusedExports.get(file)!.push(exp);
    }
  }
}

console.log('='.repeat(60));
console.log('可能未使用的导出:');
console.log('='.repeat(60));
console.log();

for (const [file, exports] of unusedExports) {
  if (exports.length > 0) {
    console.log(`${file}:`);
    for (const exp of exports) {
      console.log(`  - ${exp.name} [${exp.type}] (行 ${exp.line})`);
    }
    console.log();
  }
}
