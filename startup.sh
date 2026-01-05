#!/bin/bash
# Azure App Service startup script

echo "=== Microsoft Agentic Solution Advisor Startup ==="
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Working directory: $(pwd)"
echo "PORT: ${PORT:-8080}"
echo "NODE_ENV: ${NODE_ENV:-production}"

# List files to verify deployment
echo "Files in root:"
ls -la

# Install production dependencies
echo "Installing production dependencies..."
npm ci --omit=dev --loglevel=verbose

# Verify server file exists
if [ ! -f "server-production.mjs" ]; then
  echo "ERROR: server-production.mjs not found!"
  exit 1
fi

echo "Starting production server..."
# Run the production server
exec node server-production.mjs
