#!/bin/bash
# Azure App Service startup script

echo "Starting Microsoft Agentic Solution Advisor..."
echo "Node version: $(node --version)"
echo "Working directory: $(pwd)"

# Run the production server with tsx support
node --import tsx server-production.js
