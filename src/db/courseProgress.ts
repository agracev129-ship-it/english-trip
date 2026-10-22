// Где она сейчас в курсе: какие уроки пройдены, какой следующий, открыта ли неделя.
import { useLiveQuery } from 'dexie-react-hooks';
import { allLessons, weeks } from '../content';
import { dayKey } from '../lib/day';
import { db, type LessonRun } from './db';

export type CourseProgress = {
  /** id пройденных уроков */
  finished: Set<string>;
  /** Незаконченные уроки: lessonId → прогресс 0…1 */
  inProgress: Map<string, LessonRun>;
  /** Следующий урок по порядку (или null, если курс пройден) */
  next: (typeof allLessons)[number] | null;
  /** Сегодня уже пройден хотя бы один урок */
  doneToday: boolean;
  isWeekUnlocked: (weekId: string) => boolean;
  weekDone: (weekId: string) => number;
};

export function useCourseProgress(): CourseProgress | undefined {
  const runs = useLiveQuery(() => db.lessonRuns.toArray());
  if (!runs) return undefined;

  const finished = new Set(runs.filter((r) => r.finishedAt).map((r) => r.lessonId));
  const inProgress = new Map(
    runs
      .filter((r) => !r.finishedAt && !finished.has(r.lessonId))
      .sort((a, b) => a.startedAt - b.startedAt)
      .map((r) => [r.lessonId, r]),
  );
  const today = dayKey();
  const doneToday = runs.some((r) => r.finishedAt && dayKey(new Date(r.finishedAt)) === today);
  const weekDone = (weekId: string) =>
    weeks.find((w) => w.id === weekId)?.lessons.filter((l) => finished.has(l.id)).length ?? 0;
  // Неделя открывается, когда пройдены все 7 уроков предыдущей
  const isWeekUnlocked = (weekId: string) => {
    const i = weeks.findIndex((w) => w.id === weekId);
    if (i <= 0) return i === 0;
    const prev = weeks[i - 1]!;
    return weekDone(prev.id) >= prev.lessons.length;
  };
  const next = allLessons.find((l) => !finished.has(l.plan.id)) ?? null;
  return { finished, inProgress, next, doneToday, isWeekUnlocked, weekDone };
}
