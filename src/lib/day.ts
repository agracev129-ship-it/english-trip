// «Учебный день» начинается в 03:00 по местному времени (PROJECT.md, раздел 9):
// урок в 01:30 ночи ещё засчитывается во вчерашний день.

export const DAY_START_HOUR = 3;

/** Ключ дня вида «2026-10-22» с учётом границы в 03:00. */
export function dayKey(date: Date = new Date()): string {
  const d = new Date(date.getTime());
  d.setHours(d.getHours() - DAY_START_HOUR);
  return formatKey(d);
}

function formatKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Полдень этого дня — удобная точка, не зависящая от перехода на летнее время. */
export function keyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y!, m! - 1, d!, 12);
}

export function addDays(key: string, n: number): string {
  const d = keyToDate(key);
  d.setDate(d.getDate() + n);
  return formatKey(d);
}

/** Сколько дней от a до b (b − a). */
export function diffDays(a: string, b: string): number {
  return Math.round((keyToDate(b).getTime() - keyToDate(a).getTime()) / 86_400_000);
}

/** Понедельник недели, в которую входит день. */
export function weekStart(key: string): string {
  const dow = (keyToDate(key).getDay() + 6) % 7;
  return addDays(key, -dow);
}
