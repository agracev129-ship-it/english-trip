// Караоке-подсветка: какое слово звучит в данный момент.

export type WordTiming = { w: string; start: number; end: number };

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
