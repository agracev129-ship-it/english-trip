/** Приводит долю прогресса к диапазону 0…1. NaN и бесконечность считаются нулём. */
export function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/** Доля в целых процентах для подписей: 0.736 → 74. */
export function toPercent(value: number): number {
  return Math.round(clampProgress(value) * 100);
}
