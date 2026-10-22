// Пастельные пары из дизайна. Tailwind видит только полные имена классов,
// поэтому они перечислены целиком, а не собираются из кусочков строк.

export type Tone = 'lilac' | 'sky' | 'pink' | 'peach' | 'mint' | 'yellow';
export type SolidTone = 'violet' | 'blue';

export const TONE_BG: Record<Tone, string> = {
  lilac: 'bg-lilac-soft',
  sky: 'bg-sky-soft',
  pink: 'bg-pink-soft',
  peach: 'bg-peach-soft',
  mint: 'bg-mint-soft',
  yellow: 'bg-yellow-soft',
};

export const TONE_ACCENT_TEXT: Record<Tone, string> = {
  lilac: 'text-lilac',
  sky: 'text-sky',
  pink: 'text-pink',
  peach: 'text-peach',
  mint: 'text-mint',
  yellow: 'text-yellow',
};

/** Цвет акцента как CSS-значение — для SVG (кольца прогресса, графики). */
export const TONE_ACCENT_VAR: Record<Tone, string> = {
  lilac: 'var(--color-lilac)',
  sky: 'var(--color-sky)',
  pink: 'var(--color-pink)',
  peach: 'var(--color-peach)',
  mint: 'var(--color-mint)',
  yellow: 'var(--color-yellow)',
};

export const SOLID_BG: Record<SolidTone, string> = {
  violet: 'bg-tile-violet',
  blue: 'bg-tile-blue',
};

/** Навыки и их цвета (раздел 4): аудирование, слова, речь, грамматика. */
export const SKILL_TONE = {
  listening: 'lilac',
  vocab: 'sky',
  speaking: 'pink',
  grammar: 'peach',
} as const satisfies Record<string, Tone>;
