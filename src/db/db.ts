// Прогресс хранится только на телефоне, в IndexedDB (PROJECT.md, раздел 8.3).
// ВАЖНО: схему меняем только новой версией: db.version(N + 1).stores({...}).upgrade(...),
// старые версии не трогаем — иначе у ученицы пропадёт прогресс.
import Dexie, { type EntityTable } from 'dexie';
import type { Card } from '../lib/srs';
import type { Skill } from '../content/schema';
import type { ItemKind, LessonItem } from '../lib/lessonBuilder';
import type { Streak } from '../lib/streak';

export type Settings = {
  /** Скорость по умолчанию для «улитки» */
  slowSpeed: number;
  sounds: boolean;
  haptics: boolean;
};

export type Profile = {
  id: 'me';
  name: string;
  createdAt: number;
  settings: Settings;
  /** Спросили ли имя при первом запуске */
  askedName: boolean;
  lastBackupAt?: number;
};

export type WordState = {
  /** «m1w1/boarding-pass» для слов курса, «user/…» для добавленных из диалогов */
  key: string;
  card: Card;
  addedBy: 'course' | 'user';
  addedAt: number;
  lastReview?: number;
  /** Для слов, добавленных из диалога: слово и реплика с переводом как контекст */
  user?: { en: string; contextEn: string; contextRu: string; clipId: string };
};

export type StepResult = {
  item: number;
  kind: ItemKind;
  skill: Skill;
  correct: boolean;
  firstTry: boolean;
  /** Звучало в обычной скорости, без «улитки» — только такие ответы идут в точность на слух */
  normalSpeed: boolean;
  itemIds: string[];
  at: number;
};

export type LessonRun = {
  id: string;
  lessonId: string;
  weekId: string;
  day: number;
  seed: number;
  startedAt: number;
  finishedAt?: number;
  /** Индекс текущего задания */
  stepIndex: number;
  items: LessonItem[];
  /** Сколько заданий было в уроке изначально, без повторов ошибок */
  baseCount: number;
  results: StepResult[];
  /** Ключи слов, которые уже повторены после ошибки (чтобы не повторять бесконечно) */
  retried: string[];
  xp: number;
};

export type DailyStat = {
  date: string;
  seconds: number;
  xp: number;
  lessons: number;
  listenTotal: number;
  listenCorrect: number;
  listenTotalNormal: number;
  listenCorrectNormal: number;
  wordsReviewed: number;
};

export type StreakRow = Streak & { id: 'streak' };

export type TestResult = {
  id: string;
  kind: 'efset' | 'monthly';
  date: string;
  month?: number;
  total?: number;
  listening?: number;
  reading?: number;
  score?: number;
  details?: Record<string, unknown>;
};

export type Achievement = { id: string; unlockedAt: number };

export const db = new Dexie('english-trip') as Dexie & {
  profile: EntityTable<Profile, 'id'>;
  wordStates: EntityTable<WordState, 'key'>;
  lessonRuns: EntityTable<LessonRun, 'id'>;
  dailyStats: EntityTable<DailyStat, 'date'>;
  streak: EntityTable<StreakRow, 'id'>;
  tests: EntityTable<TestResult, 'id'>;
  achievements: EntityTable<Achievement, 'id'>;
};

db.version(1).stores({
  profile: 'id',
  wordStates: 'key, addedBy, card.due',
  lessonRuns: 'id, lessonId, weekId, startedAt, finishedAt',
  dailyStats: 'date',
  streak: 'id',
  tests: 'id, kind, date',
  achievements: 'id',
});

export const emptyDay = (date: string): DailyStat => ({
  date,
  seconds: 0,
  xp: 0,
  lessons: 0,
  listenTotal: 0,
  listenCorrect: 0,
  listenTotalNormal: 0,
  listenCorrectNormal: 0,
  wordsReviewed: 0,
});
