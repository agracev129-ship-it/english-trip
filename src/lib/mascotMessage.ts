// Что говорит маскот на главной: одна реплика по самой важной ситуации (PROJECT.md, 5.2).
import { DAY_START_HOUR, diffDays } from './day';
import { daysWord, wordsWord } from './plural';
import type { Streak, StreakStatus } from './streak';

export type MascotState =
  | 'idle' // моргает
  | 'happy' // правильный ответ
  | 'sad' // ошибка (мягко)
  | 'fire' // стрик
  | 'sleepy' // давно не заходила
  | 'celebrate' // урок пройден
  | 'thinking'; // загрузка

export type MascotMessage = {
  state: MascotState;
  title: string;
  text: string;
  /** Куда ведёт нажатие на баннер */
  to?: string;
  /** Стрик действительно в опасности: выделяем его и на шапке */
  urgent?: boolean;
};

/** С такого числа слов на повторение маскот про них напоминает. */
export const DUE_REMINDER = 5;
/** Столько дней без занятий — «давно не виделись». */
const AWAY_DAYS = 3;
/** С такого стрика им стоит похвастаться. */
const PROUD_STREAK = 3;
/** С этого часа тревожимся за стрик: раньше день ещё впереди, незачем подгонять. */
const EVENING_HOUR = 20;

export function mascotMessage(input: {
  streak: Streak;
  status: StreakStatus;
  today: string;
  dueWords: number;
  anyLessonDone: boolean;
  /** Местный час, 0–23 */
  hour: number;
}): MascotMessage {
  const { streak, status, today, dueWords, anyLessonDone, hour } = input;
  const review: MascotMessage = {
    state: 'idle',
    title: `Пора повторить ${dueWords} ${wordsWord(dueWords)}`,
    text: 'Пара минут сейчас — и они останутся в памяти надолго.',
    to: '/review',
  };

  if (!anyLessonDone) {
    return {
      state: 'idle',
      title: 'Привет! Я Эхо',
      text: 'Вместе натренируем слух. Начни с первого урока — это около 20 минут.',
    };
  }
  if (status.doneToday) {
    if (dueWords >= DUE_REMINDER) return review;
    return {
      state: 'happy',
      title: 'Ты молодец!',
      text:
        status.current > 1
          ? `${status.current} ${daysWord(status.current)} подряд. До завтра!`
          : 'Сегодняшний урок пройден. До завтра!',
    };
  }
  // Учебный день длится до 03:00, поэтому ночь — тоже «вечер»
  const late = hour >= EVENING_HOUR || hour < DAY_START_HOUR;
  const missed = streak.lastActiveDate ? diffDays(streak.lastActiveDate, today) - 1 : 0;
  if (status.atRisk && (late || missed > 0)) {
    return {
      state: 'fire',
      urgent: true,
      title: 'Стрик под угрозой',
      text:
        missed > 0
          ? `${status.current} ${daysWord(status.current)} подряд. Заморозка спасёт пропуск, если пройти урок сегодня.`
          : `${status.current} ${daysWord(status.current)} подряд — пройди урок сегодня, чтобы не потерять серию.`,
    };
  }
  const away = streak.lastActiveDate ? diffDays(streak.lastActiveDate, today) : 0;
  if (away >= AWAY_DAYS) {
    return {
      state: 'sleepy',
      title: 'Давно не виделись!',
      text: 'Ничего страшного. Один короткий урок — и снова в ритме.',
    };
  }
  if (dueWords >= DUE_REMINDER) return review;
  if (status.current >= PROUD_STREAK) {
    return {
      state: 'fire',
      title: `${status.current} ${daysWord(status.current)} подряд!`,
      text: 'Так держать. Сегодняшний урок ждёт.',
    };
  }
  return { state: 'idle', title: 'Готова к уроку?', text: 'Сегодня снова слушаем и понимаем.' };
}
