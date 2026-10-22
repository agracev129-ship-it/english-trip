// Все изменения прогресса — здесь: первый запуск, уроки, ответы, слова, стрик, XP, время.
import {
  db,
  emptyDay,
  type DailyStat,
  type LessonRun,
  type StepResult,
  type WordState,
} from './db';
import { STARTING_EFSET } from '../config';
import { dayKey } from '../lib/day';
import { newCard, review, type Grade } from '../lib/srs';
import { completeDay, EMPTY_STREAK, type StreakUpdate } from '../lib/streak';
import { XP } from '../lib/xp';
import { buildLesson, type ItemKind } from '../lib/lessonBuilder';
import type { LessonPlan, Week } from '../content/schema';

/** Первый запуск: профиль, стрик, стартовый EF SET, просьба браузеру не удалять данные. */
export async function initProgress(): Promise<void> {
  await db.transaction('rw', db.profile, db.streak, db.tests, async () => {
    if (!(await db.profile.get('me'))) {
      await db.profile.put({
        id: 'me',
        name: '',
        createdAt: Date.now(),
        askedName: false,
        settings: { slowSpeed: 0.75, sounds: true, haptics: true },
      });
    }
    if (!(await db.streak.get('streak'))) await db.streak.put({ id: 'streak', ...EMPTY_STREAK });
    if (!(await db.tests.get('efset-start'))) {
      await db.tests.put({
        id: 'efset-start',
        kind: 'efset',
        date: STARTING_EFSET.date,
        total: STARTING_EFSET.total,
        reading: STARTING_EFSET.reading,
        listening: STARTING_EFSET.listening,
      });
    }
  });
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      await navigator.storage.persist();
    }
  } catch {
    // Браузер может не поддерживать — не страшно
  }
}

async function bumpDay(patch: (d: DailyStat) => void, date = dayKey()): Promise<void> {
  await db.transaction('rw', db.dailyStats, async () => {
    const d = (await db.dailyStats.get(date)) ?? emptyDay(date);
    patch(d);
    await db.dailyStats.put(d);
  });
}

export const addSeconds = (s: number) => bumpDay((d) => (d.seconds += s));

// ---------- Уроки ----------

/** Незаконченный урок с этим id, если она вышла посередине. */
export async function activeRun(lessonId: string): Promise<LessonRun | undefined> {
  const runs = await db.lessonRuns.where('lessonId').equals(lessonId).toArray();
  return runs.filter((r) => !r.finishedAt).sort((a, b) => b.startedAt - a.startedAt)[0];
}

export async function dueWordKeys(now = new Date()): Promise<string[]> {
  const due = await db.wordStates.where('card.due').belowOrEqual(now).toArray();
  return due.sort((a, b) => a.card.due.getTime() - b.card.due.getTime()).map((w) => w.key);
}

// Два одновременных вызова (например, двойной эффект React в режиме разработки или двойной тап)
// не должны создать два разных урока
const starting = new Map<string, Promise<LessonRun>>();

export function startRun(week: Week, plan: LessonPlan): Promise<LessonRun> {
  let p = starting.get(plan.id);
  if (!p) {
    p = createOrResumeRun(week, plan).finally(() => starting.delete(plan.id));
    starting.set(plan.id, p);
  }
  return p;
}

async function createOrResumeRun(week: Week, plan: LessonPlan): Promise<LessonRun> {
  const existing = await activeRun(plan.id);
  if (existing) return existing;
  const seed = Math.floor(Math.random() * 2 ** 31);
  const items = buildLesson({ week, plan, dueWords: await dueWordKeys(), seed });
  const run: LessonRun = {
    id: `${plan.id}-${Date.now()}`,
    lessonId: plan.id,
    weekId: week.id,
    day: plan.day,
    seed,
    startedAt: Date.now(),
    stepIndex: 0,
    items,
    baseCount: items.length,
    results: [],
    retried: [],
    xp: 0,
  };
  await db.lessonRuns.put(run);
  return run;
}

export const saveRun = (run: LessonRun) => db.lessonRuns.put(run);

export function xpFor(kind: ItemKind, correct: boolean): number {
  if (!correct) return 0;
  if (kind === 'dialog_comprehension') return XP.listeningQuestion;
  if (kind === 'dictation_tiles') return XP.dictation;
  return XP.wordCorrect;
}

/** Записать ответ в статистику дня (XP, точность на слух). Сам урок сохраняет движок. */
export async function recordAnswer(r: StepResult): Promise<void> {
  const xp = xpFor(r.kind, r.correct && r.firstTry);
  await bumpDay((d) => {
    d.xp += xp;
    if (r.skill === 'listening' && r.firstTry) {
      d.listenTotal++;
      if (r.correct) d.listenCorrect++;
      if (r.normalSpeed) {
        d.listenTotalNormal++;
        if (r.correct) d.listenCorrectNormal++;
      }
    }
  });
}

export type LessonSummary = {
  xp: number;
  streak: StreakUpdate;
  listeningCorrect: number;
  listeningTotal: number;
  newWords: number;
  perfectListening: boolean;
};

/** Урок пройден: XP за урок, стрик, счётчик уроков за день. */
export async function finishRun(run: LessonRun): Promise<LessonSummary> {
  const listening = run.results.filter((r) => r.skill === 'listening' && r.firstTry);
  const listeningCorrect = listening.filter((r) => r.correct).length;
  const perfectListening = listening.length > 0 && listeningCorrect === listening.length;
  const bonus = XP.lessonComplete + (perfectListening ? XP.perfectListeningBonus : 0);
  run.xp += bonus;
  run.finishedAt = Date.now();
  await saveRun(run);

  const today = dayKey();
  await bumpDay((d) => {
    d.xp += bonus;
    d.lessons++;
  }, today);

  const streakRow = (await db.streak.get('streak')) ?? { id: 'streak' as const, ...EMPTY_STREAK };
  const update = completeDay(streakRow, today);
  await db.streak.put({ id: 'streak', ...update.streak });

  const newWords = run.items.filter((i) => i.kind === 'word_intro').length;
  return {
    xp: run.xp,
    streak: update,
    listeningCorrect,
    listeningTotal: listening.length,
    newWords,
    perfectListening,
  };
}

// ---------- Слова ----------

/** Слово курса впервые показано: заводим карточку FSRS (если её ещё нет). */
export async function introduceWord(key: string): Promise<void> {
  if (await db.wordStates.get(key)) return;
  await db.wordStates.put({ key, card: newCard(), addedBy: 'course', addedAt: Date.now() });
}

/** Оценка слова: по ответу в задании или свайпу карточки. */
export async function gradeWord(key: string, grade: Grade): Promise<void> {
  const now = new Date();
  const ws: WordState = (await db.wordStates.get(key)) ?? {
    key,
    card: newCard(now),
    addedBy: 'course',
    addedAt: now.getTime(),
  };
  ws.card = review(ws.card, grade, now);
  ws.lastReview = now.getTime();
  await db.wordStates.put(ws);
  await bumpDay((d) => d.wordsReviewed++);
}

export async function addUserWord(
  entry: Required<Pick<WordState, 'user'>>['user'],
): Promise<string> {
  const key = `user/${entry.en.toLowerCase()}`;
  if (!(await db.wordStates.get(key))) {
    await db.wordStates.put({
      key,
      card: newCard(),
      addedBy: 'user',
      addedAt: Date.now(),
      user: entry,
    });
  }
  return key;
}

/** Слово курса добавлено вручную из диалога: карточка появится, если её ещё нет. */
export async function addCourseWord(key: string): Promise<void> {
  await introduceWord(key);
}

// ---------- Профиль ----------

export async function setName(name: string): Promise<void> {
  await db.profile.update('me', { name: name.trim(), askedName: true });
}

export async function markNameAsked(): Promise<void> {
  await db.profile.update('me', { askedName: true });
}
