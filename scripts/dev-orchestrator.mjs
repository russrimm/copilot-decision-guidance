import { spawn } from 'node:child_process';

const API_HEALTH_URL = 'http://localhost:3001/api/health';
const API_WAIT_TIMEOUT_MS = 300000;
const API_POLL_INTERVAL_MS = 1000;

function runNpm(commandLine, label) {
  const child = spawn(commandLine, {
    stdio: 'inherit',
    shell: true,
    windowsHide: true,
  });

  child.on('error', (error) => {
    console.error(`[dev] ${label} process failed to start:`, error);
  });

  return child;
}

async function waitForApiHealth(apiProcess) {
  const start = Date.now();

  while (Date.now() - start < API_WAIT_TIMEOUT_MS) {
    if (apiProcess.exitCode !== null) {
      throw new Error(`[dev] API process exited early with code ${apiProcess.exitCode}.`);
    }

    try {
      const response = await fetch(API_HEALTH_URL);
      if (response.ok) {
        console.log('[dev] API health check passed.');
        return;
      }
    } catch {
      // keep waiting
    }

    await new Promise((resolve) => setTimeout(resolve, API_POLL_INTERVAL_MS));
  }

  throw new Error(`[dev] Timed out waiting for API health at ${API_HEALTH_URL}.`);
}

function terminate(child) {
  if (!child || child.exitCode !== null) {
    return;
  }
  child.kill('SIGTERM');
}

async function main() {
  let apiProcess;
  let webProcess;

  try {
    apiProcess = runNpm('npm run dev --workspace=apps/api', 'api');
    await waitForApiHealth(apiProcess);
    webProcess = runNpm('npm run dev --workspace=apps/web', 'web');

    const exitHandler = (signal) => {
      console.log(`[dev] Received ${signal}, stopping child processes...`);
      terminate(webProcess);
      terminate(apiProcess);
      process.exit(0);
    };

    process.on('SIGINT', () => exitHandler('SIGINT'));
    process.on('SIGTERM', () => exitHandler('SIGTERM'));

    const winnerCode = await new Promise((resolve) => {
      apiProcess.on('exit', (code) => resolve(code ?? 1));
      webProcess.on('exit', (code) => resolve(code ?? 1));
    });

    terminate(webProcess);
    terminate(apiProcess);

    process.exit(winnerCode);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    terminate(webProcess);
    terminate(apiProcess);
    process.exit(1);
  }
}

main();
