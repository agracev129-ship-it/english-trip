import { describe, expect, it } from 'vitest';
import { bossWon } from './boss';
import { checkDictation, checkSpelling } from './check';
import { catchHit, type WordTiming } from './karaoke';

describe('checkSpelling', () => {
  it('верно, опечатка в один символ — засчитано с подсказкой, больше — неверно', () => {
    expect(checkSpelling('passport', 'passport')).toEqual({ correct: true, typo: false });
    expect(checkSpelling('pasport', 'passport')).toEqual({ correct: true, typo: true });
    expect(checkSpelling('pasprt', 'passport').correct).toBe(false);
  });
  it('пробелы и регистр не важны: фраза из букв без пробела', () => {
    expect(checkSpelling('boardingpass', 'boarding pass')).toEqual({ correct: true, typo: false });
  });
  it('короткие слова не считаются опечаткой', () => {
    expect(checkSpelling('it', 'is').correct).toBe(false);
  });
});

describe('checkDictation', () => {
  const T = "I'll send you a link.";
  it('регистр, пунктуация, сокращения', () => {
    expect(checkDictation("i'll send you a link", T).correct).toBe(true);
    expect(checkDictation('I will send you a link!', T).correct).toBe(true);
  });
  it('опечатка в слове прощается, но отмечается', () => {
    const r = checkDictation('I will sned you a link', T);
    expect(r.correct).toBe(true);
    expect(r.marks.find((m) => m.word === 'send')?.status).toBe('typo');
    expect(r.marks.find((m) => m.word === 'link.')?.status).toBe('ok');
  });
  it('пропущенное слово красное, остальные остаются зелёными', () => {
    const r = checkDictation('I will you a link', T);
    expect(r.correct).toBe(false);
    expect(r.marks.map((m) => m.status)).toEqual(['ok', 'wrong', 'ok', 'ok', 'ok']);
  });
  it('неверное слово и лишнее слово', () => {
    const wrong = checkDictation('I will send you the link', T);
    expect(wrong.correct).toBe(false);
    expect(wrong.marks.find((m) => m.word === 'a')?.status).toBe('wrong');
    const extra = checkDictation('I will send you a link now', T);
    expect(extra.correct).toBe(false);
    expect(extra.extra).toEqual(['now']);
  });
  it('числа словами и цифрами', () => {
    expect(checkDictation('Gate 18', 'Gate eighteen.').correct).toBe(true);
  });
  it('пустой ввод: все слова красные', () => {
    const r = checkDictation('', 'Here is my passport.');
    expect(r.correct).toBe(false);
    expect(r.marks.every((m) => m.status === 'wrong')).toBe(true);
    expect(r.extra).toEqual([]);
  });
});

describe('catchHit', () => {
  const t: WordTiming[] = [
    { w: 'Your', start: 0.1, end: 0.3 },
    { w: 'gate,', start: 0.3, end: 0.7 },
    { w: 'is', start: 1.5, end: 1.6 },
    { w: 'gate', start: 3.0, end: 3.4 },
  ];
  it('окно ±0.4 с вокруг слова, регистр и пунктуация не важны', () => {
    expect(catchHit(t, 'Gate', 0.5)).toBe(true);
    expect(catchHit(t, 'gate', 0.0)).toBe(true);
    expect(catchHit(t, 'gate', 1.11)).toBe(false);
    expect(catchHit(t, 'gate', 1.09)).toBe(true);
  });
  it('слово встречается дважды: подходит любое', () => {
    expect(catchHit(t, 'gate', 3.5)).toBe(true);
    expect(catchHit(t, 'gate', 2.0)).toBe(false);
  });
  it('другого слова в окне нет', () => {
    expect(catchHit(t, 'plane', 0.5)).toBe(false);
  });
});

describe('босс', () => {
  it('победа: успела и верно хотя бы 60%', () => {
    expect(bossWon(6, 10, 5)).toBe(true);
    expect(bossWon(5, 10, 5)).toBe(false);
    expect(bossWon(10, 10, -1)).toBe(false);
    expect(bossWon(0, 0, 100)).toBe(false);
  });
});
