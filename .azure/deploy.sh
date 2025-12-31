#!/bin/bash

# Azure Deployment Script
# Compiles TypeScript to JavaScript for production

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Starting Azure deployment..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Install dependencies (production only is fine now - no tsx needed!)
echo ""
echo "📦 Installing dependencies..."
npm ci --production

# Install build-time dependencies
echo ""
echo "🔧 Installing build dependencies..."
npm install --save-dev typescript

# Build decision engine package
echo ""
echo "⚙️  Building decision engine..."
cd packages/decision-engine
npm run build
cd ../..

# Build web frontend
echo ""
echo "🎨 Building web frontend..."
cd apps/web
npm run build
cd ../..

# Verify build
echo ""
echo "✅ Verifying build outputs..."
if [ -f "packages/decision-engine/dist/index.js" ]; then
  echo "  ✓ Decision engine compiled"
else
  echo "  ✗ Decision engine missing!"
  exit 1
fi

if [ -f "apps/web/dist/index.html" ]; then
  echo "  ✓ Frontend built"
else
  echo "  ✗ Frontend missing!"
  exit 1
fi

if [ -f "server-production.js" ]; then
  echo "  ✓ Server file present"
else
  echo "  ✗ Server file missing!"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Deployment build complete!"
echo "   Server will start with: node server-production.js"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
