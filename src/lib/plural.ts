/** Русское окончание по числу: plural(5, ['день', 'дня', 'дней']) → «дней». */
export function plural(n: number, [one, few, many]: [string, string, string]): string {
  const m10 = Math.abs(n) % 10;
  const m100 = Math.abs(n) % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

export const daysWord = (n: number) => plural(n, ['день', 'дня', 'дней']);
export const wordsWord = (n: number) => plural(n, ['слово', 'слова', 'слов']);
export const lessonsWord = (n: number) => plural(n, ['урок', 'урока', 'уроков']);
