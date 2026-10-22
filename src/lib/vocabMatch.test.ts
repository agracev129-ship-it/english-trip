import { describe, expect, it } from 'vitest';
import { findVocabAt } from './vocabMatch';
import { lineTokens } from './lessonBuilder';

const vocab = [
  { key: 'w/boarding-pass', en: 'boarding pass' },
  { key: 'w/boarding', en: 'boarding' },
  { key: 'w/cost', en: 'cost' },
  { key: 'w/take-off', en: 'take off' },
];

describe('findVocabAt', () => {
  const t = lineTokens('Here is your boarding pass. Boarding starts at ten fifteen.');
  it('фраза важнее отдельного слова', () => {
    expect(findVocabAt(t, 3, vocab)).toEqual({ key: 'w/boarding-pass', start: 3, end: 5 });
    expect(findVocabAt(t, 4, vocab)).toEqual({ key: 'w/boarding-pass', start: 3, end: 5 });
  });
  it('отдельное слово без регистра', () => {
    expect(findVocabAt(t, 5, vocab)).toEqual({ key: 'w/boarding', start: 5, end: 6 });
  });
  it('простые формы: costs → cost, takes off → take off', () => {
    expect(findVocabAt(lineTokens('It costs two pounds.'), 1, vocab)?.key).toBe('w/cost');
    expect(findVocabAt(lineTokens('The plane takes off soon'), 2, vocab)?.key).toBe('w/take-off');
  });
  it('нет в словаре — null', () => {
    expect(findVocabAt(t, 0, vocab)).toBeNull();
  });
});
