import { describe, expect, it } from 'vitest';
import { addDays, dayKey, diffDays, weekStart } from './day';
import { completeDay, EMPTY_STREAK, streakStatus, type Streak } from './streak';
import { levelInfo, xpForLevel } from './xp';
import { isLearned, newCard, review, wordStatus } from './srs';
import { normalizeText, numberToWords, sameNumber, sameText } from './check';
import { seededRng, shuffle } from './random';

describe('day: граница дня в 03:00', () => {
  it('01:30 ночи — ещё вчера, 03:00 — уже сегодня', () => {
    expect(dayKey(new Date(2026, 9, 23, 1, 30))).toBe('2026-10-22');
    expect(dayKey(new Date(2026, 9, 23, 3, 0))).toBe('2026-10-23');
    expect(dayKey(new Date(2026, 9, 22, 23, 59))).toBe('2026-10-22');
  });
  it('арифметика дней через месяцы и годы', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(diffDays('2026-10-22', '2026-11-01')).toBe(10);
    expect(diffDays('2026-03-28', '2026-03-30')).toBe(2); // переход на летнее время в Европе
  });
  it('неделя начинается с понедельника', () => {
    expect(weekStart('2026-10-22')).toBe('2026-10-19'); // четверг → понедельник
    expect(weekStart('2026-10-19')).toBe('2026-10-19');
    expect(weekStart('2026-10-25')).toBe('2026-10-19'); // воскресенье
  });
});

describe('streak', () => {
  const run = (days: string[], start: Streak = EMPTY_STREAK) =>
    days.reduce((s, d) => completeDay(s, d).streak, start);

  it('первый день и дни подряд', () => {
    expect(run(['2026-10-01']).current).toBe(1);
    expect(run(['2026-10-01', '2026-10-02', '2026-10-03']).current).toBe(3);
  });
  it('второй урок в тот же день не увеличивает стрик', () => {
    const s = run(['2026-10-01']);
    const u = completeDay(s, '2026-10-01');
    expect(u.alreadyCounted).toBe(true);
    expect(u.streak.current).toBe(1);
  });
  it('пропуск без заморозок сбрасывает стрик, лучший сохраняется', () => {
    const s = run(['2026-10-01', '2026-10-02', '2026-10-04']);
    expect(s.current).toBe(1);
    expect(s.best).toBe(2);
  });
  it('за 7 дней подряд — заморозка, максимум 2', () => {
    const days = Array.from({ length: 21 }, (_, i) => addDays('2026-10-01', i));
    expect(run(days.slice(0, 6)).freezes).toBe(0);
    expect(run(days.slice(0, 7)).freezes).toBe(1);
    expect(run(days.slice(0, 14)).freezes).toBe(2);
    expect(run(days).freezes).toBe(2);
  });
  it('заморозка спасает пропущенный день', () => {
    const days = Array.from({ length: 7 }, (_, i) => addDays('2026-10-01', i)); // до 07.10
    const s = run(days);
    const u = completeDay(s, '2026-10-09'); // 08.10 пропущен
    expect(u.freezesUsed).toBe(1);
    expect(u.streak.current).toBe(8);
    expect(u.streak.freezes).toBe(0);
  });
  it('статус: сегодня, под угрозой, сгорел', () => {
    const s = run(['2026-10-01', '2026-10-02']);
    expect(streakStatus(s, '2026-10-02')).toEqual({ current: 2, doneToday: true, atRisk: false });
    expect(streakStatus(s, '2026-10-03')).toEqual({ current: 2, doneToday: false, atRisk: true });
    expect(streakStatus(s, '2026-10-05').current).toBe(0);
  });
});

describe('xp', () => {
  it('уровень n требует 300 + 50·n', () => {
    expect(xpForLevel(1)).toBe(350);
    expect(levelInfo(0)).toMatchObject({ level: 1, city: 'Хельсинки', into: 0, needed: 350 });
    expect(levelInfo(349).level).toBe(1);
    expect(levelInfo(350)).toMatchObject({ level: 2, city: 'Дублин', into: 0, needed: 400 });
    expect(levelInfo(350 + 400 + 10)).toMatchObject({ level: 3, city: 'Эдинбург', into: 10 });
  });
});

describe('srs', () => {
  it('новая карточка — новое слово, после повторений становится выученным', () => {
    let now = new Date(2026, 9, 1, 12);
    let card = newCard(now);
    expect(wordStatus(card)).toBe('new');
    card = review(card, 'good', now);
    expect(wordStatus(card)).toBe('learning');
    for (let i = 0; i < 6 && !isLearned(card); i++) {
      now = new Date(card.due.getTime() + 60_000);
      card = review(card, 'good', now);
    }
    expect(isLearned(card)).toBe(true);
    expect(wordStatus(card)).toBe('learned');
  });
  it('«забыла» откладывает карточку совсем ненадолго', () => {
    const now = new Date(2026, 9, 1, 12);
    const card = review(newCard(now), 'again', now);
    expect(card.due.getTime() - now.getTime()).toBeLessThan(15 * 60_000);
  });
});

describe('check: текст', () => {
  it('регистр, пунктуация, апострофы', () => {
    expect(sameText('Here is my passport.', 'here is my PASSPORT')).toBe(true);
    expect(sameText('I’m fine', "I'm fine!")).toBe(true);
  });
  it('сокращения: I’m = I am', () => {
    expect(sameText("I'm from Russia", 'I am from Russia')).toBe(true);
    expect(sameText("It's on your key card", 'It is on your key card')).toBe(true);
  });
  it('числа цифрами и словами', () => {
    expect(numberToWords(18)).toBe('eighteen');
    expect(numberToWords(45)).toBe('forty five');
    expect(numberToWords(406)).toBe('four hundred and six');
    expect(sameText('Gate 18', 'gate eighteen')).toBe(true);
    expect(normalizeText('fifty-six')).toBe('fifty six');
  });
  it('разные фразы не совпадают', () => {
    expect(sameText('gate twelve', 'gate twenty')).toBe(false);
  });
});

describe('check: числа', () => {
  it('время: 11:40 = 11.40 = 1140, 2:15 = 14:15', () => {
    expect(sameNumber('11:40', '11:40')).toBe(true);
    expect(sameNumber('11.40', '11:40')).toBe(true);
    expect(sameNumber('1140', '11:40')).toBe(true);
    expect(sameNumber('14:15', '2:15')).toBe(true);
    expect(sameNumber('11:14', '11:40')).toBe(false);
  });
  it('деньги: 2.50 = 2,5 = 2.5', () => {
    expect(sameNumber('2.50', '2.50')).toBe(true);
    expect(sameNumber('2,5', '2.50')).toBe(true);
    expect(sameNumber('£2.5', '2.50')).toBe(true);
    expect(sameNumber('2.15', '2.50')).toBe(false);
  });
  it('целые: 18 = 18, час 7 = 7:00', () => {
    expect(sameNumber('18', '18')).toBe(true);
    expect(sameNumber(' 18 ', '18')).toBe(true);
    expect(sameNumber('80', '18')).toBe(false);
    expect(sameNumber('7:00', '7')).toBe(true);
    expect(sameNumber('19:00', '7')).toBe(true);
    expect(sameNumber('', '7')).toBe(false);
  });
});

describe('random', () => {
  it('одно и то же зерно — один и тот же порядок', () => {
    const a = shuffle([1, 2, 3, 4, 5, 6], seededRng(42));
    const b = shuffle([1, 2, 3, 4, 5, 6], seededRng(42));
    expect(a).toEqual(b);
    expect([...a].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
