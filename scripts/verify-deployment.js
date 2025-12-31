#!/usr/bin/env node
import { existsSync } from 'fs';

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔍 Verifying deployment files...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const requiredFiles = [
  { path: 'server-production.js', name: 'Server entry point' },
  { path: 'packages/decision-engine/dist/index.js', name: 'Decision engine (compiled)' },
  { path: 'apps/web/dist/index.html', name: 'Frontend build' },
  { path: 'package.json', name: 'Package manifest' },
];

let allPresent = true;

for (const file of requiredFiles) {
  if (existsSync(file.path)) {
    console.log(`  ✓ ${file.name}`);
  } else {
    console.error(`  ✗ ${file.name} - MISSING: ${file.path}`);
    allPresent = false;
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (allPresent) {
  console.log('✅ All deployment files verified!');
  console.log('   Ready to start with: node server-production.js');
} else {
  console.error('❌ Some required files are missing!');
  console.error('   Deployment may fail.');
  process.exit(1);
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
