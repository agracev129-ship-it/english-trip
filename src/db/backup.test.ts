import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';
import {
  backupDue,
  BackupError,
  exportBackup,
  importBackup,
  parseBackup,
  resetProgress,
} from './backup';
import { gradeWord, initProgress, introduceWord } from './progress';

beforeEach(async () => {
  await resetProgress();
});

describe('резервная копия', () => {
  it('сохранить → стереть → восстановить: прогресс возвращается целиком', async () => {
    await initProgress();
    await db.profile.update('me', { name: 'Тест' });
    await introduceWord('m1w1/passport');
    await gradeWord('m1w1/passport', 'good');
    await db.streak.put({
      id: 'streak',
      current: 5,
      best: 9,
      lastActiveDate: '2026-10-22',
      freezes: 1,
    });
    const before = await db.wordStates.get('m1w1/passport');

    const text = JSON.stringify(await exportBackup());
    await resetProgress();
    expect(await db.wordStates.count()).toBe(0);
    expect((await db.profile.get('me'))?.name).toBe('');

    await importBackup(parseBackup(text));
    const after = await db.wordStates.get('m1w1/passport');
    expect((await db.profile.get('me'))?.name).toBe('Тест');
    expect(await db.streak.get('streak')).toMatchObject({ current: 5, best: 9, freezes: 1 });
    expect(after?.card.due).toBeInstanceOf(Date);
    expect(after?.card.due.getTime()).toBe(before?.card.due.getTime());
    expect(after?.card.stability).toBe(before?.card.stability);
    // индекс по дате повторения работает после восстановления
    const far = new Date(Date.now() + 365 * 86_400_000);
    expect(await db.wordStates.where('card.due').belowOrEqual(far).count()).toBe(1);
  });

  it('чужой или битый файл не принимается', () => {
    expect(() => parseBackup('не json')).toThrow(BackupError);
    expect(() => parseBackup('{"app":"other"}')).toThrow(BackupError);
    expect(() =>
      parseBackup(JSON.stringify({ app: 'english-trip', dbVersion: 999, tables: {} })),
    ).toThrow(/новой версии/);
  });

  it('сброс оставляет чистый профиль и стартовый EF SET', async () => {
    await introduceWord('m1w1/gate');
    await resetProgress();
    expect(await db.wordStates.count()).toBe(0);
    expect(await db.tests.get('efset-start')).toMatchObject({ listening: 20 });
  });

  it('напоминание о копии — раз в 2 недели', () => {
    const day = 86_400_000;
    const now = 100 * day;
    expect(backupDue({ createdAt: now - 3 * day }, now)).toBe(false);
    expect(backupDue({ createdAt: now - 20 * day }, now)).toBe(true);
    expect(backupDue({ createdAt: now - 40 * day, lastBackupAt: now - day }, now)).toBe(false);
  });
});
