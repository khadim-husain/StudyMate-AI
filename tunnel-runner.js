const { spawn } = require('child_process');

function startTunnel() {
  console.log('[TUNNEL] Starting localtunnel for port 8000...');
  const proc = spawn('cmd.exe', ['/c', 'npx', '--yes', 'localtunnel', '--port', '8000', '--subdomain', 'studymate-ai-dev'], {
    stdio: ['ignore', 'pipe', 'pipe']
  });

  proc.stdout.on('data', data => {
    console.log('[TUNNEL STDOUT]', data.toString().trim());
  });

  proc.stderr.on('data', data => {
    console.error('[TUNNEL STDERR]', data.toString().trim());
  });

  proc.on('close', code => {
    console.log(`[TUNNEL] Exited with code ${code}, restarting in 3 seconds...`);
    setTimeout(startTunnel, 3000);
  });
}

startTunnel();

