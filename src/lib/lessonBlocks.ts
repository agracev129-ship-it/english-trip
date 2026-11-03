// Блоки урока для списка «план урока» (PROJECT.md, раздел 7).
import type { LessonPlan } from '../content/schema';
import type { LessonItem } from './lessonBuilder';

export const BLOCKS = [
  { id: 'warmup', label: 'Разминка-повторение', kinds: ['flashcard_swipe', 'match_pairs'] },
  { id: 'words', label: 'Новые слова', kinds: ['word_intro', 'word_listen_choice'] },
  {
    id: 'listening',
    label: 'Главное аудирование',
    kinds: ['dialog_comprehension', 'interactive_transcript', 'speed_ladder'],
  },
  {
    id: 'ear',
    label: 'Тренажёр слуха',
    kinds: ['minimal_pairs', 'numbers_listen', 'catch_the_word', 'word_listen_spell'],
  },
  { id: 'speak', label: 'Говорим вслух', kinds: ['shadowing', 'say_it'] },
  { id: 'grammar', label: 'Грамматика шаблоном', kinds: ['pattern_builder'] },
  { id: 'dictation', label: 'Диктант', kinds: ['dictation_tiles', 'dictation_typing'] },
  { id: 'talk', label: 'Живой разговор', kinds: ['branching_dialog'] },
  { id: 'boss', label: 'Босс недели', kinds: ['boss_week'] },
  { id: 'ai', label: 'Бонус: поговори с ИИ', kinds: ['ai_conversation'] },
] as const;

export type BlockState = { id: string; label: string; done: boolean };

/** Какие блоки есть в плане урока и какие уже пройдены (по текущему заданию урока). */
export function lessonBlocks(
  plan: LessonPlan,
  run?: { items: LessonItem[]; stepIndex: number },
  finished = false,
): BlockState[] {
  const types = new Set<string>(plan.steps.map((s) => s.type));
  return BLOCKS.filter((b) => b.kinds.some((k) => types.has(k))).map((b) => {
    let done = finished;
    if (!done && run) {
      const idx = run.items
        .map((it, i) => ((b.kinds as readonly string[]).includes(it.kind) ? i : -1))
        .filter((i) => i >= 0);
      done = idx.length > 0 && idx.every((i) => i < run.stepIndex);
    }
    // В большом повторении слова только на слух, новых нет
    const label = b.id === 'words' && !types.has('word_intro') ? 'Слова на слух' : b.label;
    return { id: b.id, label, done };
  });
}
