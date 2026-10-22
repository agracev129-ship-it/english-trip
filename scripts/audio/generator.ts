// Запуск Python-генератора (generate.py) из Node.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { VENV_PYTHON } from './python.ts';

export type Job = { id: string; voice: string; text: string };
export type JobResult = { id: string; duration: number; timings: boolean; quality: number };

export function runGenerator(jobs: Job[], outDir: string): JobResult[] {
  if (!existsSync(VENV_PYTHON)) {
    console.error('Не найдено Python-окружение для озвучки. Сначала выполни: npm run audio:setup');
    process.exit(1);
  }
  const tmp = mkdtempSync(join(tmpdir(), 'english-trip-audio-'));
  try {
    const jobsPath = join(tmp, 'jobs.json');
    const resultsPath = join(tmp, 'results.json');
    writeFileSync(jobsPath, JSON.stringify(jobs));
    const proc = spawnSync(
      VENV_PYTHON,
      [
        join(import.meta.dirname, 'generate.py'),
        '--jobs',
        jobsPath,
        '--out',
        outDir,
        '--results',
        resultsPath,
      ],
      { stdio: 'inherit', env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' } },
    );
    const results: JobResult[] = existsSync(resultsPath)
      ? JSON.parse(readFileSync(resultsPath, 'utf8'))
      : [];
    if (proc.status !== 0) console.error(`\nГенератор завершился с ошибкой (код ${proc.status}).`);
    return results;
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
