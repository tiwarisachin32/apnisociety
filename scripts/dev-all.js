#!/usr/bin/env node
/**
 * ApniSociety Dual Runner (FastAPI Backend + Vite Frontend)
 * Automatically spawns both the Python FastAPI server on port 8000
 * and the Vite React server on port 3000.
 */

import { spawn } from 'child_process';
import path from 'path';

console.log('\x1b[36m%s\x1b[0m', '══════════════════════════════════════════════════════════════════');
console.log('\x1b[32m%s\x1b[0m', ' 🚀 ApniSociety Full-Stack Dev Runner (FastAPI + Vite)');
console.log('\x1b[36m%s\x1b[0m', '══════════════════════════════════════════════════════════════════');
console.log('• Frontend: http://localhost:3000');
console.log('• Backend API: http://localhost:8000 (Docs: http://localhost:8000/docs)');
console.log('• Proxy: Vite proxies /api and /health to http://localhost:8000');
console.log('');

// 1. Start Python FastAPI Backend (uvicorn)
console.log('\x1b[33m%s\x1b[0m', '[FastAPI] Starting uvicorn backend.main:app on port 8000...');
const backendProc = spawn(
  'uvicorn',
  ['backend.main:app', '--host', '0.0.0.0', '--port', '8000', '--reload'],
  {
    stdio: 'inherit',
    shell: true,
  }
);

backendProc.on('error', (err) => {
  console.warn('\x1b[31m%s\x1b[0m', `[FastAPI Warning] Could not start uvicorn: ${err.message}`);
  console.warn('Tip: Ensure python virtual environment is activated and requirements installed:');
  console.warn('     pip install -r backend/requirements.txt');
});

// 2. Start Vite Frontend
console.log('\x1b[34m%s\x1b[0m', '[Vite] Starting frontend dev server on port 3000...');
const frontendProc = spawn(
  'npx',
  ['vite', '--port=3000', '--host=0.0.0.0'],
  {
    stdio: 'inherit',
    shell: true,
  }
);

function cleanup() {
  console.log('\nShutting down full-stack services...');
  try { backendProc.kill(); } catch {}
  try { frontendProc.kill(); } catch {}
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
