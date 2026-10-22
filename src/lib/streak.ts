// Стрик (PROJECT.md, раздел 9): день засчитывается, когда пройден хотя бы один урок
// (≥ 80% шагов). За каждые 7 дней подряд — заморозка, максимум 2. Заморозка
// автоматически тратится на пропущенный день.
import { diffDays } from './day';

export const MAX_FREEZES = 2;
export const FREEZE_EVERY = 7;

export type Streak = {
  current: number;
  best: number;
  /** Последний засчитанный день, «YYYY-MM-DD», или null */
  lastActiveDate: string | null;
  freezes: number;
};

export const EMPTY_STREAK: Streak = { current: 0, best: 0, lastActiveDate: null, freezes: 0 };

export type StreakUpdate = {
  streak: Streak;
  /** Сколько заморозок потрачено на пропуски */
  freezesUsed: number;
  /** Получена новая заморозка */
  freezeEarned: boolean;
  /** День уже был засчитан раньше — ничего не изменилось */
  alreadyCounted: boolean;
};

/** Засчитать день `today` (урок пройден). */
export function completeDay(s: Streak, today: string): StreakUpdate {
  if (s.lastActiveDate === today) {
    return { streak: s, freezesUsed: 0, freezeEarned: false, alreadyCounted: true };
  }
  let current: number;
  let freezes = s.freezes;
  let freezesUsed = 0;
  if (!s.lastActiveDate) {
    current = 1;
  } else {
    const missed = diffDays(s.lastActiveDate, today) - 1;
    if (missed < 0) {
      // Часы телефона ушли назад — не ломаем стрик, просто ничего не делаем
      return { streak: s, freezesUsed: 0, freezeEarned: false, alreadyCounted: true };
    }
    if (missed === 0) current = s.current + 1;
    else if (missed <= freezes) {
      freezes -= missed;
      freezesUsed = missed;
      current = s.current + 1;
    } else current = 1;
  }
  const freezeEarned = current % FREEZE_EVERY === 0 && freezes < MAX_FREEZES;
  if (freezeEarned) freezes += 1;
  return {
    streak: { current, best: Math.max(s.best, current), lastActiveDate: today, freezes },
    freezesUsed,
    freezeEarned,
    alreadyCounted: false,
  };
}

export type StreakStatus = {
  /** Стрик, который показываем сейчас (0, если он уже прервался) */
  current: number;
  doneToday: boolean;
  /** Сегодня урока ещё не было, а без него стрик сгорит (или потратит заморозку) */
  atRisk: boolean;
};

/** Состояние стрика на день `today`, без изменения данных. */
export function streakStatus(s: Streak, today: string): StreakStatus {
  if (!s.lastActiveDate) return { current: 0, doneToday: false, atRisk: false };
  const gap = diffDays(s.lastActiveDate, today);
  if (gap <= 0) return { current: s.current, doneToday: true, atRisk: false };
  // gap − 1 пропущенных дней можно закрыть заморозками
  const alive = gap - 1 <= s.freezes;
  return { current: alive ? s.current : 0, doneToday: false, atRisk: alive && s.current > 0 };
}
