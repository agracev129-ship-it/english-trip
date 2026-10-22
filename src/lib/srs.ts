// Интервальное повторение на ts-fsrs (алгоритм FSRS, как в Anki).
import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Card } from 'ts-fsrs';

export type { Card };
export type Grade = 'again' | 'hard' | 'good' | 'easy';

const scheduler = fsrs(generatorParameters({ enable_fuzz: true, maximum_interval: 365 }));

const RATING = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
} as const;

/** «Выученное слово»: карточка в состоянии Review со стабильностью ≥ 7 дней (раздел 9). */
export const LEARNED_STABILITY_DAYS = 7;

export function newCard(now: Date = new Date()): Card {
  return createEmptyCard(now);
}

export function review(card: Card, grade: Grade, now: Date = new Date()): Card {
  return scheduler.next(card, now, RATING[grade]).card;
}

export function isDue(card: Card, now: Date = new Date()): boolean {
  return card.due.getTime() <= now.getTime();
}

export function isLearned(card: Card): boolean {
  return card.state === State.Review && card.stability >= LEARNED_STABILITY_DAYS;
}

export type WordStatus = 'new' | 'learning' | 'learned';

export function wordStatus(card: Card): WordStatus {
  if (card.state === State.New || card.reps === 0) return 'new';
  return isLearned(card) ? 'learned' : 'learning';
}

/** Прочность памяти 0…1 для индикатора: 1 — стабильность от 30 дней. */
export function memoryStrength(card: Card): number {
  if (card.reps === 0) return 0;
  return Math.min(1, card.stability / 30);
}
