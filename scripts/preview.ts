import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout } from 'node:timers/promises';

export async function startPreview(port: number) {
  const child = spawn(process.execPath, ['node_modules/astro/bin/astro.mjs', 'preview', '--host', '127.0.0.1', '--port', String(port)], { stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  child.stdout.on('data', (chunk: Buffer) => { output += chunk.toString(); });
  child.stderr.on('data', (chunk: Buffer) => { output += chunk.toString(); });
  const closed = once(child, 'close');
  const stop = async () => { if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM'); await closed; };
  const base = (process.env.BASE_PATH || '/').replace(/\/$/, '');
  const url = `http://127.0.0.1:${port}${base}/`;
  try {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (child.exitCode !== null) throw new Error(`Preview exited before becoming ready:\n${output}`);
      if (output.includes(`:${port}`)) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Preview returned HTTP ${response.status}: ${url}`);
        return { url, stop };
      }
      await setTimeout(100);
    }
    throw new Error(`Preview did not start:\n${output}`);
  } catch (error) { await stop(); throw error; }
}
