import type { Skill, Week } from '../content/schema';
import type { LessonItem } from '../lib/lessonBuilder';

export type Report = {
  correct: boolean;
  /** По умолчанию true: первая попытка */
  firstTry?: boolean;
  skill: Skill;
  itemIds: string[];
};

/** Общий интерфейс заданий (PROJECT.md, раздел 6). */
export type ExerciseProps<K extends LessonItem['kind']> = {
  item: Extract<LessonItem, { kind: K }>;
  week: Week;
  /** Скорость звука с учётом «улитки» */
  speed: number;
  /** Засчитать ответ (задание может сообщить несколько ответов, например вопросы к диалогу) */
  report: (r: Report) => void;
  /** Задание закончено — к следующему */
  done: () => void;
};
