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
