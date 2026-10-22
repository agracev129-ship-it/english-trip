// npm run audio:setup — создаёт Python-окружение и ставит Kokoro, faster-whisper и т.д.
// Нужно один раз (и после изменения requirements.txt).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { VENV_DIR, VENV_PYTHON } from './python.ts';

const here = import.meta.dirname;
const run = (cmd: string, args: string[]) => execFileSync(cmd, args, { stdio: 'inherit' });

if (!existsSync(VENV_PYTHON)) {
  console.log(`Создаю окружение: ${VENV_DIR}`);
  mkdirSync(dirname(VENV_DIR), { recursive: true });
  if (process.platform === 'win32') run('py', ['-3.12', '-m', 'venv', VENV_DIR]);
  else run('python3', ['-m', 'venv', VENV_DIR]);
}

run(VENV_PYTHON, ['-m', 'pip', 'install', '--upgrade', 'pip']);
run(VENV_PYTHON, ['-m', 'pip', 'install', '-r', join(here, 'requirements.txt')]);
console.log('\nГотово. Озвучка запускается командой: npm run audio');
