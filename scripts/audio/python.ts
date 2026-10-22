// Где лежит Python-окружение для озвучки.
// Оно ставится вне папки проекта: проект лежит в OneDrive, а в окружении ~1 ГБ мелких файлов,
// которые OneDrive пытался бы синхронизировать. Путь можно переопределить переменной ENGLISH_TRIP_VENV.
import { homedir } from 'node:os';
import { join } from 'node:path';

const isWin = process.platform === 'win32';

export const VENV_DIR =
  process.env.ENGLISH_TRIP_VENV ??
  (isWin
    ? join(process.env.LOCALAPPDATA ?? join(homedir(), 'AppData', 'Local'), 'english-trip', 'venv')
    : join(homedir(), '.cache', 'english-trip', 'venv'));

export const VENV_PYTHON = isWin
  ? join(VENV_DIR, 'Scripts', 'python.exe')
  : join(VENV_DIR, 'bin', 'python');
