#!/bin/bash

# Custom Oryx post-build script
# Ensures server-production.js is present in deployment

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Post-build: Verifying deployment files..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "server-production.js" ]; then
    echo "✓ server-production.js found"
else
    echo "✗ ERROR: server-production.js missing!"
    exit 1
fi

if [ -f "packages/decision-engine/dist/index.js" ]; then
    echo "✓ Decision engine compiled"
else
    echo "✗ ERROR: Decision engine not compiled!"
    exit 1
fi

if [ -f "apps/web/dist/index.html" ]; then
    echo "✓ Frontend built"
else
    echo "✗ ERROR: Frontend not built!"
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All deployment files verified!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
