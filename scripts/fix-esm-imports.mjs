/**
 * Post-build script: adds .js extensions to relative imports in compiled ESM output.
 *
 * TypeScript's tsc with moduleResolution:"bundler" emits extensionless imports
 * (e.g. from './foo') which Node.js ESM cannot resolve. This script walks the
 * dist directory and rewrites them to include .js (or /index.js for directories).
 *
 * Usage: node scripts/fix-esm-imports.mjs <dist-directory>
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { join, extname } from 'path';

const distDir = process.argv[2];
if (!distDir) {
  console.error('Usage: node fix-esm-imports.mjs <dist-directory>');
  process.exit(1);
}

const IMPORT_RE = /(from\s+['"])(\.\.?\/[^'"]+?)(['"])/g;

function fixFile(filePath) {
  let content = readFileSync(filePath, 'utf8');
  let changed = false;

  content = content.replace(IMPORT_RE, (match, prefix, importPath, suffix) => {
    // Already has a file extension — leave it alone
    if (extname(importPath)) return match;

    const dir = join(filePath, '..');
    const asFile = join(dir, importPath + '.js');
    const asDir = join(dir, importPath, 'index.js');

    if (existsSync(asFile) && statSync(asFile).isFile()) {
      changed = true;
      return `${prefix}${importPath}.js${suffix}`;
    }
    if (existsSync(asDir) && statSync(asDir).isFile()) {
      changed = true;
      return `${prefix}${importPath}/index.js${suffix}`;
    }

    // Fallback: just append .js
    changed = true;
    return `${prefix}${importPath}.js${suffix}`;
  });

  if (changed) {
    writeFileSync(filePath, content);
  }
}

function walkDir(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (entry.name.endsWith('.js')) {
      fixFile(fullPath);
    }
  }
}

walkDir(distDir);
