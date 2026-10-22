// Учебный контент для приложения. Проверка схемы делается при сборке и в CI
// (npm run validate, тесты), поэтому здесь JSON просто приводится к типам.
import courseJson from '../../content/course.json';
import voicesJson from '../../content/voices.json';
import type { Course, Voices, Week } from './schema.ts';

const weekFiles = import.meta.glob<Week>('../../content/month*/week*.json', {
  eager: true,
  import: 'default',
});

export const course = courseJson as Course;
export const voices = voicesJson as Voices;

/** Недели в порядке курса */
export const weeks: Week[] = course.months.flatMap((m) =>
  m.weeks.map((id) => {
    const [, month, week] = /^m(\d+)w(\d+)$/.exec(id) ?? [];
    const w = weekFiles[`../../content/month${month}/week${week}.json`];
    if (!w) throw new Error(`Нет файла недели ${id}`);
    return w;
  }),
);

export function getWeek(id: string): Week | undefined {
  return weeks.find((w) => w.id === id);
}

/** Все уроки курса по порядку. */
export const allLessons = weeks.flatMap((w) => w.lessons.map((plan) => ({ week: w, plan })));

export function findLesson(lessonId: string) {
  return allLessons.find((l) => l.plan.id === lessonId);
}

const wordsByKey = new Map<string, { week: Week; word: Week['words'][number] }>(
  weeks.flatMap((w) => w.words.map((word) => [`${w.id}/${word.id}`, { week: w, word }] as const)),
);

/** Слово курса по ключу «m1w1/boarding-pass». */
export function wordByKey(key: string) {
  return wordsByKey.get(key);
}

export const POS_RU: Record<string, string> = {
  noun: 'существительное',
  verb: 'глагол',
  adj: 'прилагательное',
  adv: 'наречие',
  phrase: 'фраза',
  other: 'служебное слово',
};

/** Короткое название урока по его плану: тема главного аудиотекста или повторение. */
export function lessonTitle(week: Week, day: number): string {
  const plan = week.lessons.find((l) => l.day === day);
  const main = plan?.steps.find((s) => s.type === 'dialog_comprehension');
  if (day <= 4 && main?.ref?.[0]) {
    return week.listenings.find((l) => l.id === main.ref![0])?.title ?? `День ${day}`;
  }
  return day === 7 ? 'Большое повторение и разговор с ИИ' : 'Те же тексты, но быстрее';
}
