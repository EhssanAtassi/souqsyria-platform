#!/usr/bin/env node

/**
 * Script to automatically fix common TypeScript compilation errors
 * - TS2564: Property has no initializer
 * - TS18046/TS18048: Error is of type 'unknown'
 * - TS6133: Unused imports
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SRC_DIR = path.join(__dirname, 'src');
const FILE_PATTERN = /\.ts$/;

/**
 * Recursively get all TypeScript files
 */
function getAllTsFiles(dir) {
  const files = [];

  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (item !== 'node_modules' && item !== 'dist') {
          traverse(fullPath);
        }
      } else if (FILE_PATTERN.test(item)) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

/**
 * Fix TS2564: Add definite assignment assertion (!) to class properties
 */
function fixPropertyInitializers(content) {
  // Match class property declarations without initializers
  // Pattern: property: type; (but not if it already has ! or = or ?)
  const lines = content.split('\n');
  const fixed = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if it's a property declaration inside a class
    // Match patterns like: "  propertyName: Type;" but not "  propertyName!: Type;" or "  propertyName?: Type;" or "  propertyName = "
    const propertyMatch = line.match(/^(\s+)(@\w+.*\n)?(\s*)([a-zA-Z_$][\w$]*)(\s*):([\s\S]*?);(\s*)(\/\/.*)?$/);

    if (propertyMatch && !line.includes('!') && !line.includes('?') && !line.includes('=')) {
      // Check if the previous line has a decorator (like @Column, @PrimaryKey, etc.)
      const hasDecorator = i > 0 && lines[i - 1].trim().startsWith('@');

      // Add ! before the colon
      const indent = propertyMatch[1];
      const propName = propertyMatch[4];
      const typeAndRest = line.substring(line.indexOf(':'));

      fixed.push(`${indent}${propName}!${typeAndRest}`);
    } else {
      fixed.push(line);
    }
  }

  return fixed.join('\n');
}

/**
 * Fix TS18046: Type catch blocks as 'unknown' then cast
 */
function fixCatchBlocks(content) {
  // Pattern 1: catch (error) { ... error.something ... }
  // Replace with: catch (error: unknown) { ... (error as Error).something ... }

  let fixed = content;

  // Fix catch block parameter types
  fixed = fixed.replace(
    /catch\s*\(\s*([a-zA-Z_$][\w$]*)\s*\)/g,
    'catch ($1: unknown)'
  );

  // Fix error.stack, error.message, error.toString() references
  fixed = fixed.replace(
    /([a-zA-Z_$][\w$]*)\.(stack|message|toString\(\))/g,
    (match, errorVar, prop) => {
      // Don't replace if already casted
      if (fixed.includes(`(${errorVar} as Error)`)) {
        return match;
      }
      return `(${errorVar} as Error).${prop}`;
    }
  );

  return fixed;
}

/**
 * Fix TS18048: Possibly undefined
 */
function fixPossiblyUndefined(content) {
  // Add optional chaining or non-null assertion where appropriate
  // Pattern: result.affected > 0
  // Fix: result.affected! > 0 or (result.affected ?? 0) > 0

  let fixed = content;

  // Fix .affected property access
  fixed = fixed.replace(
    /(\w+)\.affected\s*>/g,
    '($1.affected ?? 0) >'
  );

  fixed = fixed.replace(
    /(\w+)\.affected\s*</g,
    '($1.affected ?? 0) <'
  );

  fixed = fixed.replace(
    /(\w+)\.affected\s*===/g,
    '($1.affected ?? 0) ==='
  );

  return fixed;
}

/**
 * Remove or comment out unused imports
 */
function fixUnusedImports(content, filePath) {
  const lines = content.split('\n');
  const fixed = [];
  const unusedImports = [];

  for (const line of lines) {
    // Check if it's an import line
    const importMatch = line.match(/^import\s*{([^}]+)}\s*from/);

    if (importMatch) {
      const imports = importMatch[1].split(',').map(i => i.trim());
      const usedImports = [];

      for (const imp of imports) {
        // Check if the import is used in the file
        const importName = imp.split(' as ')[0].trim();
        const isUsed = content.split('\n')
          .filter((l, idx) => idx !== lines.indexOf(line))
          .some(l => new RegExp(`\\b${importName}\\b`).test(l));

        if (isUsed) {
          usedImports.push(imp);
        } else {
          unusedImports.push(importName);
        }
      }

      if (usedImports.length > 0) {
        fixed.push(line.replace(importMatch[1], usedImports.join(', ')));
      } else {
        // Comment out the entire import
        fixed.push(`// ${line}`);
      }
    } else {
      fixed.push(line);
    }
  }

  if (unusedImports.length > 0) {
    console.log(`  Removed unused imports in ${path.basename(filePath)}: ${unusedImports.join(', ')}`);
  }

  return fixed.join('\n');
}

/**
 * Process a single file
 */
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const original = content;

    // Apply fixes
    content = fixPropertyInitializers(content);
    content = fixCatchBlocks(content);
    content = fixPossiblyUndefined(content);
    // content = fixUnusedImports(content, filePath); // Can be slow, enable if needed

    // Only write if changed
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`✓ Fixed: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Main function
 */
function main() {
  console.log('Starting TypeScript error fixes...\n');

  const files = getAllTsFiles(SRC_DIR);
  console.log(`Found ${files.length} TypeScript files\n`);

  let fixedCount = 0;

  for (const file of files) {
    if (processFile(file)) {
      fixedCount++;
    }
  }

  console.log(`\n✓ Fixed ${fixedCount} files`);
  console.log('\nRun "npm run build" to verify the fixes');
}

// Run the script
if (require.main === module) {
  main();
}
