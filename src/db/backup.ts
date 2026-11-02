// Резервная копия всего прогресса в JSON-файл и восстановление из него (PROJECT.md, 8.3).
import { db } from './db';
import { initProgress } from './progress';

export const BACKUP_APP = 'english-trip';

const TABLES = [
  'profile',
  'wordStates',
  'lessonRuns',
  'dailyStats',
  'streak',
  'tests',
  'achievements',
] as const;
type TableName = (typeof TABLES)[number];

export type BackupFile = {
  app: typeof BACKUP_APP;
  /** Версия схемы базы, из которой сделана копия */
  dbVersion: number;
  exportedAt: string;
  tables: Record<TableName, unknown[]>;
};

export async function exportBackup(): Promise<BackupFile> {
  const tables = {} as Record<TableName, unknown[]>;
  await db.transaction(
    'r',
    TABLES.map((t) => db.table(t)),
    async () => {
      for (const t of TABLES) tables[t] = await db.table(t).toArray();
    },
  );
  return { app: BACKUP_APP, dbVersion: db.verno, exportedAt: new Date().toISOString(), tables };
}

export function backupFileName(date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  const d = `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
  return `english-trip-${d}.json`;
}

/** Даты в карточках FSRS после JSON становятся строками — возвращаем им тип Date. */
function reviveWordState(raw: unknown): unknown {
  const w = raw as { card?: { due?: unknown; last_review?: unknown } };
  if (w.card) {
    if (w.card.due) w.card.due = new Date(w.card.due as string);
    if (w.card.last_review) w.card.last_review = new Date(w.card.last_review as string);
  }
  return w;
}

export class BackupError extends Error {}

/** Проверка файла без записи: что это наша копия и что в ней. */
export function parseBackup(text: string): BackupFile {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new BackupError('Это не файл резервной копии (не JSON).');
  }
  const b = data as Partial<BackupFile>;
  if (b?.app !== BACKUP_APP || typeof b.dbVersion !== 'number' || !b.tables) {
    throw new BackupError('Это не резервная копия English Trip.');
  }
  if (b.dbVersion > db.verno) {
    throw new BackupError(
      'Копия сделана в более новой версии приложения. Сначала обнови приложение.',
    );
  }
  for (const t of TABLES)
    if (!Array.isArray(b.tables[t] ?? [])) throw new BackupError('Файл повреждён.');
  return b as BackupFile;
}

/** Заменить весь прогресс содержимым копии. */
export async function importBackup(file: BackupFile): Promise<void> {
  await db.transaction(
    'rw',
    TABLES.map((t) => db.table(t)),
    async () => {
      for (const t of TABLES) {
        const rows = (file.tables[t] ?? []).map((r) =>
          t === 'wordStates' ? reviveWordState(r) : r,
        );
        await db.table(t).clear();
        if (rows.length) await db.table(t).bulkPut(rows);
      }
    },
  );
  await initProgress();
}

export async function markBackupDone(): Promise<void> {
  await db.profile.update('me', { lastBackupAt: Date.now() });
}

/** Полный сброс прогресса (после двойного подтверждения на странице). */
export async function resetProgress(): Promise<void> {
  await db.transaction(
    'rw',
    TABLES.map((t) => db.table(t)),
    async () => {
      for (const t of TABLES) await db.table(t).clear();
    },
  );
  await initProgress();
}

/** Пора напомнить про копию: раз в 2 недели (раздел 8.3). */
export function backupDue(profile: { createdAt: number; lastBackupAt?: number }, now = Date.now()) {
  const since = profile.lastBackupAt ?? profile.createdAt;
  return now - since > 14 * 24 * 60 * 60 * 1000;
}
