#!/bin/bash
# Azure App Service startup script

echo "Starting Copilot Decision Guidance application..."
echo "Node version: $(node --version)"
echo "Working directory: $(pwd)"

# Run the production server with tsx support
node --import tsx server-production.js
