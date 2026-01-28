#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const srcDir = './src';

function getAllTsFiles(dir, fileList = []) {
  const files = readdirSync(dir);

  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist') {
        getAllTsFiles(filePath, fileList);
      }
    } else if (extname(file) === '.ts') {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function fixFile(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  let modified = false;

  // Fix TS2564: Add ! to property declarations
  const propertyPattern = /^(\s+)(@[\w(){}[\]'",:\s]+\n)?(\s*)([a-zA-Z_$][\w$]*)(\s*):((?:(?!\/\/).)*);(\s*)(\/\/.*)?$/gm;

  content = content.replace(propertyPattern, (match, indent1, decorator, indent2, propName, space, typePart, endSpace, comment) => {
    // Skip if already has !, ?, or =
    if (match.includes('!:') || match.includes('?:') || match.includes('=')) {
      return match;
    }

    // Skip method signatures and parameters
    if (match.includes('(') || match.includes(')') || !indent1 || indent1.length < 2) {
      return match;
    }

    modified = true;
    const decoratorPart = decorator || '';
    const indentPart = indent2 || '';
    const commentPart = comment || '';
    const endSpacePart = endSpace || '';

    return `${indent1}${decoratorPart}${indentPart}${propName}!:${typePart};${endSpacePart}${commentPart}`;
  });

  // Fix catch blocks - type as unknown
  content = content.replace(/catch\s*\(\s*([a-zA-Z_$][\w$]*)\s*\)(\s*{)/g, (match, errorVar, brace) => {
    if (match.includes(': unknown') || match.includes(': any') || match.includes(': Error')) {
      return match;
    }
    modified = true;
    return `catch (${errorVar}: unknown)${brace}`;
  });

  // Fix error.stack and error.message in catch blocks
  content = content.replace(/(\w+)\.(stack|message|toString\(\))/g, (match, varName, prop) => {
    // Only replace if it looks like an error variable and not already casted
    if ((varName === 'error' || varName === 'err' || varName === 'e') && !content.includes(`(${varName} as Error)`)) {
      // Check if this is in a catch block context
      const beforeMatch = content.substring(0, content.indexOf(match));
      if (beforeMatch.includes('catch (')) {
        modified = true;
        return `(${varName} as Error).${prop}`;
      }
    }
    return match;
  });

  // Fix result.affected possibly undefined
  content = content.replace(/(\w+)\.affected\s*([><=!]+)/g, (match, varName, operator) => {
    if (match.includes('??')) {
      return match;
    }
    modified = true;
    return `(${varName}.affected ?? 0) ${operator}`;
  });

  // Fix null assignments for findOne results
  content = content.replace(/(=\s*await\s+this\.\w+\.findOne\([^)]+\));/g, (match) => {
    if (match.includes('!;') || match.includes('??')) {
      return match;
    }
    modified = true;
    return match.replace(');', ')!;');
  });

  // Remove unused imports
  const importPattern = /^import\s*{\s*([^}]+)\s*}\s*from\s*['"]([^'"]+)['"];?\s*$/gm;
  content = content.replace(importPattern, (match, imports, from) => {
    const importList = imports.split(',').map(i => i.trim());
    const usedImports = [];

    for (const imp of importList) {
      const importName = imp.includes(' as ') ? imp.split(' as ')[1].trim() : imp.trim();

      // Check if import is used elsewhere in file
      const pattern = new RegExp(`\\b${importName}\\b`);
      const withoutImportLine = content.replace(match, '');

      if (pattern.test(withoutImportLine)) {
        usedImports.push(imp);
      } else {
        modified = true;
      }
    }

    if (usedImports.length === 0) {
      return `// ${match}`;
    } else if (usedImports.length < importList.length) {
      return `import { ${usedImports.join(', ')} } from '${from}';`;
    }

    return match;
  });

  if (modified) {
    writeFileSync(filePath, content, 'utf-8');
    console.log(`✓ Fixed: ${filePath}`);
    return 1;
  }

  return 0;
}

function main() {
  console.log('Finding TypeScript files...');
  const files = getAllTsFiles(srcDir);
  console.log(`Found ${files.length} TypeScript files\n`);

  let fixedCount = 0;
  for (const file of files) {
    try {
      fixedCount += fixFile(file);
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  }

  console.log(`\n✓ Fixed ${fixedCount} files`);
  console.log('Run "npm run build" to verify fixes');
}

main();
