import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const rootDir = '/home/simonlui/Code_Repositories/Personal_Projects/4chan-xt';
const dirs = ['src', 'tools', 'benchmarks'];

function getAllFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getAllFiles(fullPath, files);
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }
  return files;
}

const files = [];
for (const dir of dirs) {
  getAllFiles(path.join(rootDir, dir), files);
}

console.log(`Found ${files.length} TypeScript files in total.`);

let totalNoCheck = 0;
let cleanableCount = 0;
const cleanableFiles = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.startsWith('// @ts-nocheck\n')) {
    totalNoCheck++;
    // Try removing it
    const modifiedContent = content.substring('// @ts-nocheck\n'.length);
    fs.writeFileSync(file, modifiedContent, 'utf8');

    try {
      execSync('npm run typecheck', { stdio: 'ignore' });
      // If it compiles without errors, we successfully removed it!
      cleanableCount++;
      cleanableFiles.push(path.relative(rootDir, file));
      console.log(`Success: // @ts-nocheck can be permanently removed from ${path.relative(rootDir, file)}`);
    } catch (e) {
      // Failed, restore it
      fs.writeFileSync(file, content, 'utf8');
    }
  }
}

console.log(`\nSummary: Out of ${files.length} files:`);
console.log(`- Originally using // @ts-nocheck: ${totalNoCheck}`);
console.log(`- Checked by TypeScript: ${files.length - totalNoCheck}`);
console.log(`- Cleanable files: ${cleanableCount}`);
console.log(`- New Checked count: ${files.length - totalNoCheck + cleanableCount}`);
console.log(`- New Remaining nocheck: ${totalNoCheck - cleanableCount}`);
console.log('Cleanable files list:', cleanableFiles);
