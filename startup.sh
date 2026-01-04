#!/bin/bash
# Azure App Service startup script

echo "Starting Microsoft Agentic Solution Advisor..."
echo "Node version: $(node --version)"
echo "Working directory: $(pwd)"

# Install production dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "Installing production dependencies..."
  npm ci --omit=dev
fi

# Run the production server
node server-production.mjs
