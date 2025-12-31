# Migration Guide: From tsx Runtime to Compiled JavaScript

## Problem Statement

If your TypeScript monorepo uses `tsx` to run TypeScript directly in production and you're experiencing Azure deployment issues like:

- `Cannot find package 'tsx'`
- Module resolution errors
- Need for `NPM_CONFIG_PRODUCTION=false`

This guide shows you how to fix it permanently.

## Solution Overview

**Stop running TypeScript at runtime. Compile it to JavaScript instead.**

## Step-by-Step Migration

### 1. Configure TypeScript Compilation for Packages

For each TypeScript package in your monorepo:

**packages/your-package/tsconfig.json:**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "noEmit": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts", "dist"]
}
```

**packages/your-package/package.json:**

```json
{
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc"
  }
}
```

### 2. Add .js Extensions to Imports

TypeScript with ESM requires `.js` extensions in imports:

**Before:**

```typescript
import { foo } from './utils';
import type { Bar } from './types';
```

**After:**

```typescript
import { foo } from './utils.js';
import type { Bar } from './types.js';
```

### 3. Handle JSON Imports

JSON imports need special handling:

**Before:**

```typescript
import data from './data.json';
```

**After:**

```typescript
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(__dirname, 'data.json'), 'utf-8'));
```

Don't forget to copy JSON files during build:

```json
{
  "scripts": {
    "build": "tsc && npm run copy-data",
    "copy-data": "node -e \"require('fs').cpSync('src/data', 'dist/data', {recursive: true})\""
  }
}
```

### 4. Update Root package.json

**Remove tsx from start command:**

**Before:**

```json
{
  "scripts": {
    "start": "node --import tsx server.js"
  },
  "dependencies": {
    "tsx": "^4.0.0"
  }
}
```

**After:**

```json
{
  "scripts": {
    "build": "npm run build:packages && npm run build:web",
    "build:packages": "npm run build --workspaces",
    "postinstall": "npm run build:packages",
    "start": "node server.js"
  }
}
```

### 5. Update Server File

Your production server should import compiled JavaScript:

**server.js:**

```javascript
import { yourFunction } from './packages/your-package/dist/index.js';

// Rest of your server code
```

### 6. Update .gitignore

Allow compiled dist folders to be committed (or built during deployment):

**.gitignore:**

```
dist/
!packages/*/dist/
!apps/*/dist/
```

### 7. Create Production Test Script

**scripts/test-production.js:**

```javascript
import { existsSync } from 'fs';

// Check compiled files exist
const requiredFiles = ['packages/your-package/dist/index.js', 'apps/your-app/dist/index.html'];

for (const file of requiredFiles) {
  if (!existsSync(file)) {
    console.error(`❌ Missing: ${file}`);
    process.exit(1);
  }
}

// Try importing
const { yourFunction } = await import('./packages/your-package/dist/index.js');
console.log('✅ Production build valid');
```

Add to package.json:

```json
{
  "scripts": {
    "test:prod": "node scripts/test-production.js"
  }
}
```

### 8. Update Azure Configuration

**Azure Portal → Configuration → General Settings:**

```
Startup Command: node server.js
```

**Application Settings:**

```
SCM_DO_BUILD_DURING_DEPLOYMENT = true
WEBSITE_NODE_DEFAULT_VERSION = 20-lts
```

Remove: `NPM_CONFIG_PRODUCTION=false` (not needed!)

**deployment script (.azure/deploy.sh):**

```bash
#!/bin/bash
npm ci --production
npm install --save-dev typescript
npm run build
```

### 9. Update web.config (if using Windows App Service)

**Before:**

```xml
<iisnode nodeProcessCommandLine="node --import tsx" />
```

**After:**

```xml
<!-- No special configuration needed -->
```

## Verification Checklist

After migration:

```powershell
# 1. Clean build
rm -rf packages/*/dist apps/*/dist
npm install
npm run build

# 2. Verify compiled files
ls packages/your-package/dist/index.js
ls packages/your-package/dist/index.d.ts

# 3. Test production
npm run test:prod

# 4. Start server
npm start

# 5. Test endpoints
curl http://localhost:3000/api/health
```

If all pass, you're ready to deploy!

## Benefits

**Before (tsx runtime):**

- ❌ Platform-specific configuration needed
- ❌ Complex dependency management
- ❌ Difficult to debug
- ❌ Potential runtime errors
- ❌ Slower startup

**After (compiled JavaScript):**

- ✅ Works on any Node.js platform
- ✅ Standard npm install
- ✅ Easy to debug .js files
- ✅ Compile-time error checking
- ✅ Faster startup

## Troubleshooting

### TypeScript errors during compilation

Check your tsconfig.json:

- `moduleResolution`: "node" (not "bundler")
- `allowImportingTsExtensions`: false
- `noEmit`: false

### Module not found errors

- Add `.js` extensions to all relative imports
- Use `moduleResolution: "node"` in tsconfig
- Ensure dist/ folder is created

### JSON import errors

Use `readFileSync` instead of `import` for JSON files.

### Production test fails

- Run `npm run build` first
- Check that dist/ folders exist
- Verify file paths are correct

## Common Patterns

### Workspace Package

```json
{
  "name": "@org/package",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc"
  }
}
```

### Server Entry Point

```javascript
// server.js
import { pkg } from './packages/pkg/dist/index.js';
app.listen(PORT, () => console.log('Server ready'));
```

### Build All

```json
{
  "scripts": {
    "build": "npm run build --workspaces --if-present"
  }
}
```

## Summary

1. Configure TypeScript to output JavaScript
2. Add .js extensions to imports
3. Build packages to dist/
4. Import from dist/ in production
5. Remove tsx dependency
6. Test with `npm run test:prod`
7. Deploy with standard Node.js

No more runtime TypeScript issues! 🎉
