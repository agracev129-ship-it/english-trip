// Личные настройки приложения. Репозиторий публичный, поэтому здесь нет ничего,
// кроме того, что не жалко показать.

export const APP_NAME = 'English Trip';

/** Имя ученицы для приветствия. Пустая строка — приветствие без имени. */
export const LEARNER_NAME = '';

/** Стартовый результат EF SET. На этапе 2 записывается в базу при первом запуске. */
export const STARTING_EFSET = {
  date: '2026-10-19',
  total: 34,
  reading: 47,
  listening: 20,
} as const;

/** Цель на день, минут. */
export const DAILY_GOAL_MINUTES = 20;
