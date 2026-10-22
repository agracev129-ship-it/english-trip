import { describe, expect, it } from 'vitest';
import { clampProgress, toPercent } from './progress';

describe('clampProgress', () => {
  it('оставляет значения внутри 0…1 как есть', () => {
    expect(clampProgress(0)).toBe(0);
    expect(clampProgress(0.42)).toBe(0.42);
    expect(clampProgress(1)).toBe(1);
  });

  it('обрезает выход за границы', () => {
    expect(clampProgress(-0.5)).toBe(0);
    expect(clampProgress(1.7)).toBe(1);
  });

  it('считает NaN и бесконечность нулём', () => {
    expect(clampProgress(Number.NaN)).toBe(0);
    expect(clampProgress(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe('toPercent', () => {
  it('округляет до целых процентов', () => {
    expect(toPercent(0.736)).toBe(74);
    expect(toPercent(0.004)).toBe(0);
    expect(toPercent(2)).toBe(100);
  });
});
