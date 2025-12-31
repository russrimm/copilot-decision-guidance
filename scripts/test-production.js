/**
 * Test Production Build Script
 * Validates that the production build works before deploying
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { setTimeout } from 'timers/promises';
import fetch from 'node-fetch';

const REQUIRED_FILES = [
  'server-production.js',
  'packages/decision-engine/dist/index.js',
  'apps/web/dist/index.html',
  'package.json',
];

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

console.log(`${YELLOW}🧪 Testing Production Build...${RESET}\n`);

// Step 1: Check required files exist
console.log('Step 1: Checking required files...');
let allFilesExist = true;
for (const file of REQUIRED_FILES) {
  const exists = existsSync(file);
  console.log(`  ${exists ? GREEN + '✓' : RED + '✗'} ${file}${RESET}`);
  if (!exists) allFilesExist = false;
}

if (!allFilesExist) {
  console.error(`\n${RED}❌ Missing required files. Run: npm run build${RESET}`);
  process.exit(1);
}

// Step 2: Check decision-engine is compiled
console.log('\nStep 2: Verifying decision-engine compilation...');
const engineFiles = [
  'packages/decision-engine/dist/index.js',
  'packages/decision-engine/dist/index.d.ts',
  'packages/decision-engine/dist/data/decision-model.v1.json',
];

for (const file of engineFiles) {
  const exists = existsSync(file);
  console.log(`  ${exists ? GREEN + '✓' : RED + '✗'} ${file}${RESET}`);
  if (!exists) {
    console.error(`\n${RED}❌ Decision engine not compiled. Run: npm run build:packages${RESET}`);
    process.exit(1);
  }
}

// Step 3: Test import (no tsx needed)
console.log('\nStep 3: Testing pure JavaScript imports...');
try {
  const { decisionModel } = await import('../packages/decision-engine/dist/index.js');
  console.log(`  ${GREEN}✓${RESET} Decision engine imports successfully`);
  console.log(`  ${GREEN}✓${RESET} Model version: ${decisionModel.version}`);
} catch (error) {
  console.error(`  ${RED}✗ Failed to import decision engine:${RESET}`, error.message);
  process.exit(1);
}

// Step 4: Start server and test
console.log('\nStep 4: Starting production server...');
const server = spawn('node', ['server-production.js'], {
  env: { ...process.env, PORT: '8888', NODE_ENV: 'production' },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let serverOutput = '';
server.stdout.on('data', (data) => {
  serverOutput += data.toString();
  process.stdout.write(`  ${data}`);
});

server.stderr.on('data', (data) => {
  console.error(`  ${RED}${data}${RESET}`);
});

// Wait for server to start
console.log('  Waiting for server to be ready...');
await setTimeout(5000);

// Step 5: Test endpoints
console.log('\nStep 5: Testing API endpoints...');
try {
  const healthRes = await fetch('http://localhost:8888/api/health');
  if (healthRes.ok) {
    console.log(`  ${GREEN}✓${RESET} /api/health returns 200`);
  } else {
    throw new Error(`Health check failed: ${healthRes.status}`);
  }

  const modelRes = await fetch('http://localhost:8888/api/model');
  if (modelRes.ok) {
    const model = await modelRes.json();
    console.log(`  ${GREEN}✓${RESET} /api/model returns model v${model.version}`);
  } else {
    throw new Error(`Model endpoint failed: ${modelRes.status}`);
  }

  const scoreRes = await fetch('http://localhost:8888/api/score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers: {} }),
  });
  if (scoreRes.ok) {
    console.log(`  ${GREEN}✓${RESET} /api/score responds correctly`);
  } else {
    throw new Error(`Score endpoint failed: ${scoreRes.status}`);
  }

  // Test frontend serves
  const frontendRes = await fetch('http://localhost:8888/');
  if (frontendRes.ok && frontendRes.headers.get('content-type')?.includes('text/html')) {
    console.log(`  ${GREEN}✓${RESET} Frontend HTML is served`);
  } else {
    throw new Error('Frontend not served correctly');
  }
} catch (error) {
  console.error(`  ${RED}✗ ${error.message}${RESET}`);
  server.kill();
  process.exit(1);
} finally {
  server.kill();
}

// Success!
console.log(`\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
console.log(`${GREEN}✅ Production build test PASSED!${RESET}`);
console.log(`${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
console.log(`\n${YELLOW}Ready to deploy to Azure!${RESET}`);
console.log(`\nNo tsx needed - pure JavaScript runtime ✨\n`);

process.exit(0);
