// XP и уровни-города (PROJECT.md, раздел 9). Уровень n → n+1 требует 300 + 50·n XP.

export const XP = {
  wordCorrect: 10,
  listeningQuestion: 15,
  dictation: 10,
  lessonComplete: 50,
  perfectListeningBonus: 20,
  boss: 100,
  monthlyTest: 150,
} as const;

export const CITIES = [
  'Хельсинки',
  'Дублин',
  'Эдинбург',
  'Лондон',
  'Амстердам',
  'Барселона',
  'Лиссабон',
  'Нью-Йорк',
  'Торонто',
  'Сидней',
  'Токио',
  'Сингапур',
  'Кейптаун',
  'Рио-де-Жанейро',
  'Ванкувер',
] as const;

/** XP, нужные, чтобы перейти с уровня n на n+1. */
export const xpForLevel = (n: number) => 300 + 50 * n;

export const cityFor = (level: number) => CITIES[(level - 1) % CITIES.length]!;

export type LevelInfo = {
  level: number;
  city: string;
  nextCity: string;
  /** XP внутри текущего уровня */
  into: number;
  /** Сколько всего нужно на этом уровне */
  needed: number;
};

export function levelInfo(totalXp: number): LevelInfo {
  let level = 1;
  let rest = Math.max(0, Math.floor(totalXp));
  while (rest >= xpForLevel(level)) {
    rest -= xpForLevel(level);
    level++;
  }
  return {
    level,
    city: cityFor(level),
    nextCity: cityFor(level + 1),
    into: rest,
    needed: xpForLevel(level),
  };
}
