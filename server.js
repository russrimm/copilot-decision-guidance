import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { spawn } from 'child_process';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
// Force port 8080 for production (ignore any Vite-set PORT env var)
const PORT = 8080;
const API_PORT = process.env.API_PORT || 3002;

// Start API server as a subprocess using tsx (TypeScript runner)
const apiProcess = spawn('node', ['--import', 'tsx', join(__dirname, 'apps/api/src/index.ts')], {
  env: { ...process.env, PORT: API_PORT.toString() },
  stdio: 'inherit',
});

apiProcess.on('error', (error) => {
  console.error('✗ Failed to start API server:', error.message);
});

console.log(`✓ API server starting on port ${API_PORT}...`);

// Give the API server a moment to start, then add proxy
setTimeout(() => {
  // Proxy API requests to the API server
  app.use(
    '/api',
    createProxyMiddleware({
      target: `http://localhost:${API_PORT}`,
      changeOrigin: true,
      logLevel: 'silent',
    })
  );
  console.log(`✓ Proxying /api requests to port ${API_PORT}`);
}, 2000);

// Serve static files from React build
const staticPath = join(__dirname, 'apps/web/dist');
app.use(express.static(staticPath));

console.log('✓ Static files from', staticPath);

// Handle React routing - send all other requests to index.html
app.get('*', (req, res) => {
  res.sendFile(join(staticPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`   http://localhost:${PORT}\n`);
});

export default app;
