// Проверка ответов (PROJECT.md, раздел 6): регистр, пунктуация, апострофы,
// сокращения, числа словами и цифрами, время «11:40» = «11.40».

const CONTRACTIONS: Record<string, string> = {
  "i'm": 'i am',
  "you're": 'you are',
  "we're": 'we are',
  "they're": 'they are',
  "he's": 'he is',
  "she's": 'she is',
  "it's": 'it is',
  "that's": 'that is',
  "there's": 'there is',
  "what's": 'what is',
  "where's": 'where is',
  "here's": 'here is',
  "let's": 'let us',
  "i'll": 'i will',
  "you'll": 'you will',
  "we'll": 'we will',
  "it'll": 'it will',
  "i'd": 'i would',
  "you'd": 'you would',
  "we'd": 'we would',
  "i've": 'i have',
  "you've": 'you have',
  "we've": 'we have',
  "don't": 'do not',
  "doesn't": 'does not',
  "didn't": 'did not',
  "isn't": 'is not',
  "aren't": 'are not',
  "wasn't": 'was not',
  "can't": 'cannot',
  "won't": 'will not',
  "couldn't": 'could not',
  "shouldn't": 'should not',
};

const UNITS = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

/** Число до 999 словами: 45 → «forty five». */
export function numberToWords(n: number): string {
  if (n < 20) return UNITS[n]!;
  if (n < 100) return TENS[Math.floor(n / 10)]! + (n % 10 ? ` ${UNITS[n % 10]}` : '');
  const rest = n % 100;
  return `${UNITS[Math.floor(n / 100)]} hundred${rest ? ` and ${numberToWords(rest)}` : ''}`;
}

/** Текст к сравнению: нижний регистр, без пунктуации, сокращения раскрыты, числа словами. */
export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[^a-z0-9'\s-]/g, ' ')
    .replace(/-/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => CONTRACTIONS[w] ?? w)
    .map((w) => (/^\d{1,3}$/.test(w) ? numberToWords(Number(w)) : w))
    .join(' ')
    .replace(/'/g, '')
    .trim();
}

export function sameText(a: string, b: string): boolean {
  return normalizeText(a) === normalizeText(b);
}

/** Расстояние Левенштейна — для опечаток «не больше одной на слово» (этап 3). */
export function editDistance(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0]!;
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j]!;
      dp[j] = Math.min(dp[j]! + 1, dp[j - 1]! + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length]!;
}

const clean = (s: string) => s.trim().replace(/\s+/g, '').replace(/^£/, '');

/** «11:40», «11.40», «1140», «11» → {h, m}. */
function parseTime(s: string): { h: number; m: number } | null {
  const m = /^(\d{1,2})(?:[:.]?(\d{2}))?$/.exec(s);
  if (!m) return null;
  const h = Number(m[1]);
  const min = m[2] === undefined ? 0 : Number(m[2]);
  return h <= 24 && min < 60 ? { h, m: min } : null;
}

function parseDecimal(s: string): number | null {
  return /^\d+([.,]\d+)?$/.test(s) ? Number(s.replace(',', '.')) : null;
}

/**
 * Совпадает ли введённое число с ответом. Как сравнивать, решает формат ответа в контенте:
 * - время «11:40»: «11.40», «1140» тоже верно, а «2:15» = «14:15»;
 * - дробь «2.50» (деньги): «2,5» и «2.5» тоже верно;
 * - целое «18»: только 18, а если это час (≤ 24) — ещё и «18:00».
 */
export function sameNumber(input: string, expected: string): boolean {
  const i = clean(input);
  const e = clean(expected);
  if (!i) return false;
  if (e.includes(':')) {
    const a = parseTime(i);
    const b = parseTime(e);
    return !!a && !!b && a.h % 12 === b.h % 12 && a.m === b.m;
  }
  if (/[.,]/.test(e)) {
    const a = parseDecimal(i);
    const b = parseDecimal(e);
    return a !== null && b !== null && Math.abs(a - b) < 1e-9;
  }
  const b = Number(e);
  if (/^\d+$/.test(i)) return Number(i) === b;
  const t = parseTime(i);
  return b <= 24 && !!t && t.m === 0 && t.h % 12 === b % 12;
}
