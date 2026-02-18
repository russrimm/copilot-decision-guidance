import { execSync } from 'node:child_process';

const ports = [3000, 3001];

function killWindowsPortListeners(targetPorts) {
  let output = '';
  try {
    output = execSync('netstat -ano -p tcp', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return;
  }

  const pids = new Set();
  const lines = output.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.includes('LISTENING')) {
      continue;
    }

    const parts = trimmed.split(/\s+/);
    if (parts.length < 5) {
      continue;
    }

    const localAddress = parts[1] ?? '';
    const pidRaw = parts[4] ?? '';
    const portMatch = localAddress.match(/:(\d+)$/);
    const pid = Number.parseInt(pidRaw, 10);

    if (!portMatch || Number.isNaN(pid) || pid === process.pid) {
      continue;
    }

    const port = Number.parseInt(portMatch[1], 10);
    if (targetPorts.includes(port)) {
      pids.add(pid);
    }
  }

  for (const pid of pids) {
    try {
      execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
      console.log(`[dev:ports] Killed PID ${pid} on dev port.`);
    } catch {
      // Ignore failures so dev startup can continue.
    }
  }
}

function killUnixPortListeners(targetPorts) {
  for (const port of targetPorts) {
    let output = '';
    try {
      output = execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
    } catch {
      continue;
    }

    const pids = output
      .split(/\r?\n/)
      .map((value) => Number.parseInt(value.trim(), 10))
      .filter((value) => !Number.isNaN(value) && value !== process.pid);

    for (const pid of pids) {
      try {
        process.kill(pid, 'SIGKILL');
        console.log(`[dev:ports] Killed PID ${pid} on dev port ${port}.`);
      } catch {
        // Ignore failures so dev startup can continue.
      }
    }
  }
}

if (process.platform === 'win32') {
  killWindowsPortListeners(ports);
} else {
  killUnixPortListeners(ports);
}
