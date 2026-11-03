// Схема учебного контента (PROJECT.md, раздел 8.1).
// Контент лежит в content/month*/week*.json и проверяется этой схемой при `npm run validate`,
// в тестах и в CI. Звук к тексту не прописывается вручную: id аудио вычисляется из голоса
// и текста (см. audioId.ts), поэтому контент можно править, не трогая никаких хешей.
import { z } from 'zod';

export const SKILLS = ['listening', 'vocab', 'speaking', 'grammar'] as const;
export type Skill = (typeof SKILLS)[number];

/** Все типы заданий из раздела 6. MVP — этап 2, остальные — этап 3. */
export const EXERCISE_TYPES = [
  'word_intro',
  'word_listen_choice',
  'word_listen_spell',
  'flashcard_swipe',
  'match_pairs',
  'minimal_pairs',
  'numbers_listen',
  'dialog_comprehension',
  'interactive_transcript',
  'dictation_tiles',
  'dictation_typing',
  'catch_the_word',
  'speed_ladder',
  'shadowing',
  'pattern_builder',
  'say_it',
  'branching_dialog',
  'boss_week',
  'ai_conversation',
] as const;
export type ExerciseType = (typeof EXERCISE_TYPES)[number];

const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'id: латиница, цифры и дефисы');
const en = z.string().trim().min(1);
const ru = z.string().trim().min(1).regex(/[а-яё]/i, 'ожидается текст на русском');

/** Необязательная «произносимая» версия текста, если она отличается от написанной. */
const say = en.optional();

export const WordSchema = z.object({
  id,
  en,
  ru,
  pos: z.enum(['noun', 'verb', 'adj', 'adv', 'phrase', 'other']),
  example: en,
  exampleRu: ru,
  say,
  exampleSay: say,
});

export const SpeakerSchema = z.object({
  id,
  /** Имя на экране: «Anna», «Agent» */
  name: z.string().min(1),
  /** Роль голоса из content/voices.json, например «woman1» */
  voice: z.string().min(1),
});

export const LineSchema = z.object({
  speaker: id,
  text: en,
  ru,
  say,
});

export const QuestionSchema = z.object({
  q: en,
  options: z.array(en).min(3).max(4),
  correct: z.number().int().min(0),
  explainRu: ru,
});

export const ListeningSchema = z.object({
  id,
  kind: z.enum(['dialog', 'announcement', 'monologue']),
  title: ru,
  speakers: z.array(SpeakerSchema).min(1),
  lines: z.array(LineSchema).min(2),
  questions: z.array(QuestionSchema).min(3).max(4),
});

export const MinimalPairSchema = z.object({
  id,
  a: en,
  b: en,
  aRu: ru,
  bRu: ru,
  /** Явное произношение, если Kokoro читает слово иначе: "[live](/lˈɪv/)" */
  aSay: say,
  bSay: say,
});

export const NumberDrillSchema = z.object({
  id,
  /** Что звучит */
  text: en,
  /** Что нужно ввести цифрами, по одному полю на число: ["18", "11:40"] */
  answers: z.array(z.string().regex(/^[0-9][0-9:.,]*$/, 'ответ — только цифры')).min(1),
  /** Подсказка, что вводить: «Номер выхода и время вылета» */
  promptRu: ru,
  say,
});

/** Грамматика шаблоном: «Could I have ___, please?» + подсказка-правило на 1–2 строки. */
export const PatternSchema = z.object({
  id,
  /** Шаблон с пропуском «___» */
  template: en.regex(/___/, 'в шаблоне нужен пропуск ___'),
  ruleRu: ru,
  items: z
    .array(
      z.object({
        /** Что сказать: «Попроси плед» */
        promptRu: ru,
        answer: en,
        wrong: z.array(en).min(2).max(3),
      }),
    )
    .min(2),
});

export const BranchOptionSchema = z.object({
  text: en,
  ru,
  /** Следующий узел разговора */
  next: id,
  /** Уместный ли это ответ */
  ok: z.boolean(),
  /** Подсказка на русском, если ответ неуместный */
  hintRu: ru.optional(),
});

export const BranchNodeSchema = z.object({
  id,
  speaker: id,
  text: en,
  ru,
  /** Пусто — разговор закончен */
  options: z.array(BranchOptionSchema),
});

/** Интерактивный разговор: персонаж говорит голосом, ответы выбирает ученица. */
export const BranchingSchema = z.object({
  id,
  title: ru,
  introRu: ru,
  /** Кто говорит; ответы звучат голосом героини (роль «anna») */
  speakers: z.array(SpeakerSchema).min(1),
  start: id,
  nodes: z.array(BranchNodeSchema).min(3),
});

export const BossStepSchema = z.object({
  /** Строчка сюжета над заданием */
  storyRu: ru,
  type: z.enum([
    'word_listen_choice',
    'word_listen_spell',
    'minimal_pairs',
    'numbers_listen',
    'dictation_tiles',
    'dictation_typing',
    'catch_the_word',
    'pattern_builder',
  ]),
  ref: z.array(z.string().min(1)).length(1),
});

/** «Босс недели»: цепочка заданий подряд с сюжетом и таймером. */
export const BossSchema = z.object({
  id,
  title: ru,
  storyRu: ru,
  /** Финал истории при победе и при поражении */
  winRu: ru,
  loseRu: ru,
  timeLimitSec: z.number().int().min(60).max(900),
  steps: z.array(BossStepSchema).min(6).max(8),
});

export const StepSchema = z.object({
  type: z.enum(EXERCISE_TYPES),
  /** Ссылки на элементы недели: id слов, диалогов, пар, чисел или реплик «d1#3» */
  ref: z.array(z.string().min(1)).optional(),
  params: z.record(z.string(), z.unknown()).optional(),
});

export const LessonPlanSchema = z.object({
  id,
  day: z.number().int().min(1).max(7),
  steps: z.array(StepSchema).min(3),
});

export const WeekSchema = z.object({
  id,
  n: z.number().int().min(1).max(4),
  title: ru,
  description: ru,
  /** Имя файла 3D-иконки в public/icons/3d без расширения */
  icon: id,
  baseSpeed: z.number().min(0.5).max(1.5),
  words: z.array(WordSchema).min(20).max(30),
  listenings: z.array(ListeningSchema).min(4),
  minimalPairs: z.array(MinimalPairSchema).min(4),
  numberDrills: z.array(NumberDrillSchema).min(4),
  patterns: z.array(PatternSchema),
  branching: BranchingSchema.optional(),
  boss: BossSchema.optional(),
  aiPrompt: en,
  lessons: z.array(LessonPlanSchema).length(7),
});

export const MonthSchema = z.object({
  id,
  n: z.number().int().min(1),
  title: ru,
  level: z.string().min(1),
  targetSpeed: z.number().min(0.5).max(1.5),
  /** id недель по порядку; сами недели — в content/month{n}/week{k}.json */
  weeks: z.array(id).min(1).max(4),
});

export const CourseSchema = z.object({
  months: z.array(MonthSchema).min(1),
});

export const VoicesSchema = z.object({
  /** Голос, которым читаются отдельные слова и примеры */
  narrator: z.string().min(1),
  /** Роль → голос Kokoro: «woman1» → «bf_emma» */
  roles: z.record(z.string(), z.string().regex(/^[ab][fm]_[a-z]+$/, 'голос Kokoro, например bf_emma')),
});

export type Word = z.infer<typeof WordSchema>;
export type Speaker = z.infer<typeof SpeakerSchema>;
export type Line = z.infer<typeof LineSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type Listening = z.infer<typeof ListeningSchema>;
export type MinimalPair = z.infer<typeof MinimalPairSchema>;
export type NumberDrill = z.infer<typeof NumberDrillSchema>;
export type Pattern = z.infer<typeof PatternSchema>;
export type Branching = z.infer<typeof BranchingSchema>;
export type BranchNode = z.infer<typeof BranchNodeSchema>;
export type BranchOption = z.infer<typeof BranchOptionSchema>;
export type Boss = z.infer<typeof BossSchema>;
export type Step = z.infer<typeof StepSchema>;
export type LessonPlan = z.infer<typeof LessonPlanSchema>;
export type Week = z.infer<typeof WeekSchema>;
export type Month = z.infer<typeof MonthSchema>;
export type Course = z.infer<typeof CourseSchema>;
export type Voices = z.infer<typeof VoicesSchema>;
