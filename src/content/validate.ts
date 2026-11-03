// Проверка всего контента: схема zod + связи между частями (ссылки уроков, говорящие,
// голоса, иконки, аудиофайлы). Работает и в Node (npm run validate), и в тестах Vitest.
import { weekClips, uniqueClips } from './clips.ts';
import {
  CourseSchema,
  VoicesSchema,
  WeekSchema,
  type Course,
  type ExerciseType,
  type Voices,
  type Week,
} from './schema.ts';

export type ContentFiles = {
  course: unknown;
  voices: unknown;
  /** Ключ — путь вида «month1/week1» */
  weeks: Record<string, unknown>;
};

export type ValidateOptions = {
  iconExists?: (name: string) => boolean;
  /** Если передано — проверяется, что для каждого клипа есть mp3 */
  audioExists?: (id: string) => boolean;
};

export type ValidateResult = {
  errors: string[];
  course?: Course;
  voices?: Voices;
  weeks: Week[];
  missingAudio: string[];
};

const WORD_TYPES: ExerciseType[] = [
  'word_intro',
  'word_listen_choice',
  'word_listen_spell',
  'flashcard_swipe',
  'match_pairs',
];
const LISTENING_TYPES: ExerciseType[] = [
  'dialog_comprehension',
  'interactive_transcript',
];
const LINE_TYPES: ExerciseType[] = [
  'dictation_tiles',
  'dictation_typing',
  'catch_the_word',
  'speed_ladder',
  'shadowing',
  'say_it',
];

function zodErrors(where: string, error: { issues: { path: PropertyKey[]; message: string }[] }) {
  return error.issues.map((i) => `${where}: ${i.path.map(String).join('.') || '(корень)'} — ${i.message}`);
}

function duplicates(ids: string[]): string[] {
  const seen = new Set<string>();
  const dup = new Set<string>();
  for (const id of ids) (seen.has(id) ? dup : seen).add(id);
  return [...dup];
}

export function validateContent(files: ContentFiles, opts: ValidateOptions = {}): ValidateResult {
  const errors: string[] = [];
  const weeks: Week[] = [];
  const missingAudio: string[] = [];

  const course = CourseSchema.safeParse(files.course);
  if (!course.success) errors.push(...zodErrors('content/course.json', course.error));
  const voices = VoicesSchema.safeParse(files.voices);
  if (!voices.success) errors.push(...zodErrors('content/voices.json', voices.error));

  for (const [path, raw] of Object.entries(files.weeks)) {
    const where = `content/${path}.json`;
    const parsed = WeekSchema.safeParse(raw);
    if (!parsed.success) {
      errors.push(...zodErrors(where, parsed.error));
      continue;
    }
    const week = parsed.data;
    weeks.push(week);
    const err = (msg: string) => errors.push(`${where}: ${msg}`);

    const m = /^month(\d+)\/week(\d+)$/.exec(path);
    if (!m || week.id !== `m${m[1]}w${m[2]}` || week.n !== Number(m[2])) {
      err(`id «${week.id}» и n=${week.n} не совпадают с именем файла`);
    }
    if (opts.iconExists && !opts.iconExists(week.icon)) err(`нет иконки public/icons/3d/${week.icon}.png`);

    const allIds = [
      ...week.words.map((w) => w.id),
      ...week.listenings.map((l) => l.id),
      ...week.minimalPairs.map((p) => p.id),
      ...week.numberDrills.map((d) => d.id),
      ...week.patterns.map((p) => p.id),
      ...week.lessons.map((l) => l.id),
    ];
    for (const d of duplicates(allIds)) err(`id «${d}» встречается несколько раз`);
    for (const d of duplicates(week.words.map((w) => w.en.toLowerCase()))) err(`слово «${d}» повторяется`);

    for (const l of week.listenings) {
      const speakerIds = new Set(l.speakers.map((s) => s.id));
      for (const s of l.speakers) {
        if (voices.success && !voices.data.roles[s.voice]) {
          err(`${l.id}: роли голоса «${s.voice}» нет в voices.json`);
        }
      }
      l.lines.forEach((line, i) => {
        if (!speakerIds.has(line.speaker)) err(`${l.id}#${i}: нет говорящего «${line.speaker}»`);
      });
      l.questions.forEach((q, i) => {
        if (q.correct >= q.options.length) err(`${l.id}, вопрос ${i + 1}: correct вне вариантов`);
        if (duplicates(q.options).length) err(`${l.id}, вопрос ${i + 1}: одинаковые варианты`);
      });
    }

    for (const p of week.patterns) {
      p.items.forEach((item, i) => {
        if (duplicates([item.answer, ...item.wrong]).length) {
          err(`шаблон ${p.id}, пункт ${i + 1}: одинаковые варианты`);
        }
      });
    }

    if (week.branching) {
      const b = week.branching;
      const at = `разговор ${b.id}`;
      const byId = new Map(b.nodes.map((n) => [n.id, n]));
      for (const d of duplicates(b.nodes.map((n) => n.id))) err(`${at}: узел «${d}» повторяется`);
      if (!byId.has(b.start)) err(`${at}: нет начального узла «${b.start}»`);
      const speakerIds = new Set(b.speakers.map((s) => s.id));
      for (const s of b.speakers) {
        if (voices.success && !voices.data.roles[s.voice]) err(`${at}: нет голоса «${s.voice}»`);
      }
      for (const n of b.nodes) {
        if (!speakerIds.has(n.speaker)) err(`${at}, ${n.id}: нет говорящего «${n.speaker}»`);
        if (n.options.length && !n.options.some((o) => o.ok)) {
          err(`${at}, ${n.id}: нет ни одного уместного ответа`);
        }
        for (const o of n.options) {
          if (!byId.has(o.next)) err(`${at}, ${n.id}: ответ ведёт в несуществующий «${o.next}»`);
          if (!o.ok && !o.hintRu) err(`${at}, ${n.id}: у неуместного ответа нет подсказки`);
        }
      }
      // Из начала по уместным ответам должен быть путь до конца разговора
      const seen = new Set<string>();
      const walk = (nodeId: string): boolean => {
        if (seen.has(nodeId)) return false;
        seen.add(nodeId);
        const n = byId.get(nodeId);
        if (!n) return false;
        return n.options.length === 0 || n.options.filter((o) => o.ok).some((o) => walk(o.next));
      };
      if (!walk(b.start)) err(`${at}: по уместным ответам нельзя дойти до конца`);
      // Все узлы достижимы
      const reach = new Set<string>();
      const visit = (nodeId: string) => {
        if (reach.has(nodeId)) return;
        reach.add(nodeId);
        for (const o of byId.get(nodeId)?.options ?? []) visit(o.next);
      };
      visit(b.start);
      for (const n of b.nodes) if (!reach.has(n.id)) err(`${at}: узел «${n.id}» недостижим`);
    }

    const wordIds = new Set(week.words.map((w) => w.id));
    const listeningById = new Map(week.listenings.map((l) => [l.id, l]));
    const pairIds = new Set(week.minimalPairs.map((p) => p.id));
    const drillIds = new Set(week.numberDrills.map((d) => d.id));
    const patternIds = new Set(week.patterns.map((p) => p.id));
    const days = week.lessons.map((l) => l.day);
    if (duplicates(days.map(String)).length || days.some((d, i) => d !== i + 1)) {
      err('уроки должны идти по дням 1…7');
    }

    const checkRefs = (step: { type: ExerciseType; ref?: string[] }, at: string) => {
        for (const ref of step.ref ?? []) {
          const ok = WORD_TYPES.includes(step.type)
            ? wordIds.has(ref)
            : LISTENING_TYPES.includes(step.type)
              ? listeningById.has(ref)
              : LINE_TYPES.includes(step.type)
                ? (() => {
                    const [lid, idx] = ref.split('#');
                    const l = listeningById.get(lid ?? '');
                    return !!l && idx !== undefined && Number(idx) >= 0 && Number(idx) < l.lines.length;
                  })()
                : step.type === 'minimal_pairs'
                  ? pairIds.has(ref)
                  : step.type === 'numbers_listen'
                    ? drillIds.has(ref)
                    : step.type === 'pattern_builder'
                      ? patternIds.has(ref)
                      : true;
          if (!ok) err(`${at}: ссылка «${ref}» никуда не ведёт`);
        }
    };
    for (const lesson of week.lessons) {
      lesson.steps.forEach((step, i) => {
        checkRefs(step, `${lesson.id}, шаг ${i + 1} (${step.type})`);
        if (step.type === 'branching_dialog' && !week.branching) {
          err(`${lesson.id}: в плане разговор, а в неделе его нет`);
        }
        if (step.type === 'boss_week' && !week.boss) {
          err(`${lesson.id}: в плане босс, а в неделе его нет`);
        }
      });
    }
    week.boss?.steps.forEach((step, i) => {
      checkRefs(step, `босс, шаг ${i + 1} (${step.type})`);
    });

    if (voices.success) {
      try {
        const clips = uniqueClips(weekClips(voices.data, week));
        if (opts.audioExists) {
          for (const c of clips) if (!opts.audioExists(c.id)) missingAudio.push(`${c.id} ${c.source}`);
        }
      } catch (e) {
        err((e as Error).message);
      }
    }
  }

  if (course.success) {
    for (const month of course.data.months) {
      for (const wid of month.weeks) {
        const key = wid.replace(/^m(\d+)w(\d+)$/, 'month$1/week$2');
        if (!(key in files.weeks)) {
          errors.push(`content/course.json: месяц ${month.n} ссылается на «${wid}», а файла ${key}.json нет`);
        }
      }
    }
  }

  return {
    errors,
    course: course.success ? course.data : undefined,
    voices: voices.success ? voices.data : undefined,
    weeks,
    missingAudio,
  };
}
