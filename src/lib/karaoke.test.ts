import { describe, expect, it } from 'vitest';
import { activeWordIndex, type WordTiming } from './karaoke.ts';

const t: WordTiming[] = [
  { w: 'Good', start: 0.1, end: 0.4 },
  { w: 'morning.', start: 0.45, end: 0.9 },
  { w: 'Hello', start: 1.4, end: 1.8 },
];

describe('activeWordIndex', () => {
  it('до первого слова — ничего', () => expect(activeWordIndex(t, 0.05)).toBe(-1));
  it('внутри слова — это слово', () => {
    expect(activeWordIndex(t, 0.2)).toBe(0);
    expect(activeWordIndex(t, 0.5)).toBe(1);
    expect(activeWordIndex(t, 1.5)).toBe(2);
  });
  it('в паузе между словами держит предыдущее', () => expect(activeWordIndex(t, 1.1)).toBe(1));
  it('после конца — гаснет через 0.3 с', () => {
    expect(activeWordIndex(t, 2.0)).toBe(2);
    expect(activeWordIndex(t, 2.2)).toBe(-1);
  });
});
