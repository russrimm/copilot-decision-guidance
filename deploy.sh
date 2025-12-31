#!/bin/bash

# Azure Kudu Deployment Script
# This script is run by Azure during deployment

# Exit on any error
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Custom Deployment Script Starting..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Deployment source and target directories
DEPLOYMENT_SOURCE=${DEPLOYMENT_SOURCE:-/home/site/repository}
DEPLOYMENT_TARGET=${DEPLOYMENT_TARGET:-/home/site/wwwroot}

echo "Source: $DEPLOYMENT_SOURCE"
echo "Target: $DEPLOYMENT_TARGET"

cd "$DEPLOYMENT_SOURCE"

# 1. Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm ci --production=false

# 2. Build packages
echo ""
echo "⚙️  Building packages..."
npm run build:packages

# 3. Build web frontend
echo ""
echo "🎨 Building web frontend..."
npm run build:web

# 4. Copy files to deployment target
echo ""
echo "📋 Copying files to $DEPLOYMENT_TARGET..."

# Create target directory if it doesn't exist
mkdir -p "$DEPLOYMENT_TARGET"

# Copy essential files
echo "  Copying server files..."
cp -f server-production.js "$DEPLOYMENT_TARGET/"
cp -f package.json "$DEPLOYMENT_TARGET/"
cp -f package-lock.json "$DEPLOYMENT_TARGET/"

# Copy built packages
echo "  Copying built packages..."
mkdir -p "$DEPLOYMENT_TARGET/packages/decision-engine"
cp -rf packages/decision-engine/dist "$DEPLOYMENT_TARGET/packages/decision-engine/"
cp -f packages/decision-engine/package.json "$DEPLOYMENT_TARGET/packages/decision-engine/"

# Copy built frontend
echo "  Copying built frontend..."
mkdir -p "$DEPLOYMENT_TARGET/apps/web"
cp -rf apps/web/dist "$DEPLOYMENT_TARGET/apps/web/"

# Copy node_modules
echo "  Copying node_modules..."
cp -rf node_modules "$DEPLOYMENT_TARGET/"

# Copy other necessary files
if [ -f ".env" ]; then
  echo "  Copying .env..."
  cp -f .env "$DEPLOYMENT_TARGET/"
fi

if [ -f "web.config" ]; then
  echo "  Copying web.config..."
  cp -f web.config "$DEPLOYMENT_TARGET/"
fi

# 5. Verify deployment
echo ""
echo "✅ Verifying deployment files..."
cd "$DEPLOYMENT_TARGET"

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
