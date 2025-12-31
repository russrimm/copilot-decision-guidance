#!/bin/bash

# Azure Kudu Deployment Script
# This script is run by Azure during deployment

# Exit on any error and print commands
set -ex

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Custom Deployment Script Starting..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Deployment source and target directories
DEPLOYMENT_SOURCE=${DEPLOYMENT_SOURCE:-/home/site/repository}
DEPLOYMENT_TARGET=${DEPLOYMENT_TARGET:-/home/site/wwwroot}

echo "Source: $DEPLOYMENT_SOURCE"
echo "Target: $DEPLOYMENT_TARGET"
echo "Current directory: $(pwd)"

cd "$DEPLOYMENT_SOURCE" || exit 1

# 1. Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm ci --production=false || npm install

# 2. Build packages
echo ""
echo "⚙️  Building packages..."
npm run build:packages || { echo "Package build failed"; exit 1; }

# 3. Skip frontend build - using pre-built version
echo ""
echo "🎨 Using pre-built frontend..."

# 4. Copy files to deployment target
echo ""
echo "📋 Copying files to $DEPLOYMENT_TARGET..."

# Remove old deployment except hostingstart.html
cd "$DEPLOYMENT_TARGET" || exit 1
find . -maxdepth 1 ! -name 'hostingstart.html' ! -name '.' ! -name '..' -exec rm -rf {} + || true

cd "$DEPLOYMENT_SOURCE" || exit 1

# Copy everything
echo "  Copying all files..."
cp -r . "$DEPLOYMENT_TARGET/" || { echo "Copy failed"; exit 1; }

# 5. Verify deployment
echo ""
echo "✅ Verifying deployment files..."
cd "$DEPLOYMENT_TARGET" || exit 1

ls -la

if [ -f "server-production.js" ]; then
  echo "  ✓ server-production.js"
else
  echo "  ✗ server-production.js MISSING!"
  exit 1
fi

if [ -f "packages/decision-engine/dist/index.js" ]; then
  echo "  ✓ Decision engine"
else
  echo "  ✗ Decision engine MISSING!"
  exit 1
fi

if [ -f "apps/web/dist/index.html" ]; then
  echo "  ✓ Frontend"
else
  echo "  ✗ Frontend MISSING!"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
