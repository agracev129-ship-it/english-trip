// Караоке-подсветка: какое слово звучит в данный момент.

export type WordTiming = { w: string; start: number; end: number };

/** Окно «Поймай слово»: ±0.4 с вокруг звучания слова (PROJECT.md, раздел 6). */
export const CATCH_WINDOW = 0.4;

const normWord = (w: string) => w.toLowerCase().replace(/[^\p{L}\p{N}']/gu, '');

/** Попала ли она в слово: нажатие в момент time, слово может встречаться несколько раз. */
export function catchHit(timings: WordTiming[], target: string, time: number): boolean {
  const want = normWord(target);
  return timings.some(
    (t) => normWord(t.w) === want && time >= t.start - CATCH_WINDOW && time <= t.end + CATCH_WINDOW,
  );
}

/** Индекс слова, которое звучит в момент time; −1, если ни одно. */
export function activeWordIndex(timings: WordTiming[], time: number): number {
  for (let i = 0; i < timings.length; i++) {
    const t = timings[i]!;
    const next = timings[i + 1];
    // Между словами держим подсветку на предыдущем, чтобы не мигало
    if (time >= t.start && (next ? time < next.start : time <= t.end + 0.3)) return i;
  }
  return -1;
}
