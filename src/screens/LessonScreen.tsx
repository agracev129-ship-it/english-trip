// Плеер урока (PROJECT.md, 5.4): задания по одному на экран, полоса прогресса, «улитка»,
// выход с подтверждением на странице. Каждый шаг сразу сохраняется — урок можно продолжить.
import { useEffect, useRef, useState, type ComponentType } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { AnimatePresence, motion } from 'motion/react';
import { Snail, X } from 'lucide-react';
import { BottomSheet } from '../components/BottomSheet';
import { PillButton } from '../components/PillButton';
import { findLesson } from '../content';
import { db, type LessonRun, type StepResult } from '../db/db';
import {
  finishRun,
  recordAnswer,
  saveRun,
  startRun,
  xpFor,
  type LessonSummary,
} from '../db/progress';
import { stop } from '../lib/audio';
import { isRetryable, type LessonItem } from '../lib/lessonBuilder';
import { AiConversation } from '../exercises/AiConversation';
import { DialogComprehension } from '../exercises/DialogComprehension';
import { DictationTiles } from '../exercises/DictationTiles';
import { FlashcardSwipe } from '../exercises/FlashcardSwipe';
import { InteractiveTranscript } from '../exercises/InteractiveTranscript';
import { MatchPairs } from '../exercises/MatchPairs';
import { MinimalPairs } from '../exercises/MinimalPairs';
import { NumbersListen } from '../exercises/NumbersListen';
import { WordIntro } from '../exercises/WordIntro';
import { WordListenChoice } from '../exercises/WordListenChoice';
import type { ExerciseProps, Report } from '../exercises/types';
import { LessonDone } from './LessonDone';

// Каждый тип задания — свой компонент с общим интерфейсом
const EXERCISES: { [K in LessonItem['kind']]: ComponentType<ExerciseProps<K>> } = {
  word_intro: WordIntro,
  word_listen_choice: WordListenChoice,
  flashcard_swipe: FlashcardSwipe,
  match_pairs: MatchPairs,
  minimal_pairs: MinimalPairs,
  numbers_listen: NumbersListen,
  dialog_comprehension: DialogComprehension,
  interactive_transcript: InteractiveTranscript,
  dictation_tiles: DictationTiles,
  ai_conversation: AiConversation,
};

/** Урок можно засчитать досрочно, если пройдено ≥ 80% заданий (раздел 9). */
const EARLY_FINISH = 0.8;

export function LessonScreen() {
  const { lessonId = '' } = useParams();
  const navigate = useNavigate();
  const found = findLesson(lessonId);
  const profile = useLiveQuery(() => db.profile.get('me'));
  const [run, setRun] = useState<LessonRun | null>(null);
  const [slow, setSlow] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [summary, setSummary] = useState<LessonSummary | null>(null);
  // Актуальное состояние урока доступно сразу, а записи в базу идут строго по очереди:
  // быстрое «ответ → Дальше» не теряет ответ из-за гонки двух сохранений
  const runRef = useRef<LessonRun | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const update = (next: LessonRun) => {
    runRef.current = next;
    setRun(next);
  };
  const persist = (job: () => Promise<unknown>) => {
    queue.current = queue.current.then(job).catch((e) => console.error('Не удалось сохранить', e));
  };

  useEffect(() => {
    if (found) {
      void startRun(found.week, found.plan).then((r) => {
        runRef.current = r;
        setRun(r);
      });
    }
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  if (!found) {
    return (
      <div className="p-8 text-center">
        <p className="text-lg font-bold">Урок не найден</p>
        <PillButton className="mt-4" onClick={() => navigate('/')}>
          На главную
        </PillButton>
      </div>
    );
  }
  if (summary && run)
    return <LessonDone summary={summary} week={found.week} day={found.plan.day} />;
  if (!run) return null;

  const { week } = found;
  const item = run.items[run.stepIndex];
  const base = week.baseSpeed + (item?.kind === 'dialog_comprehension' ? item.speedDelta : 0);
  const speed = slow ? (profile?.settings.slowSpeed ?? 0.75) : base;
  const progress = run.items.length ? run.stepIndex / run.items.length : 0;
  const canFinishEarly = run.stepIndex / run.baseCount >= EARLY_FINISH;

  const finish = async (r: LessonRun) => {
    stop();
    setSummary(await finishRun(r));
  };

  const report = (r: Report) => {
    const cur = runRef.current!;
    const curItem = cur.items[cur.stepIndex];
    if (!curItem) return;
    const isRetry = cur.stepIndex >= cur.baseCount;
    const result: StepResult = {
      item: cur.stepIndex,
      kind: curItem.kind,
      skill: r.skill,
      correct: r.correct,
      firstTry: (r.firstTry ?? true) && !isRetry,
      normalSpeed: !slow,
      itemIds: r.itemIds,
      at: Date.now(),
    };
    const next: LessonRun = {
      ...cur,
      results: [...cur.results, result],
      xp: cur.xp + xpFor(result.kind, result.correct && result.firstTry),
    };
    // Ошибку в задании со словом повторим в конце урока (один раз)
    const id = r.itemIds[0];
    if (!r.correct && !isRetry && isRetryable(curItem) && id && !cur.retried.includes(id)) {
      next.items = [...cur.items, curItem];
      next.retried = [...cur.retried, id];
    }
    update(next);
    persist(() => Promise.all([recordAnswer(result), saveRun(next)]));
  };

  const done = () => {
    stop();
    const cur = runRef.current!;
    const next = { ...cur, stepIndex: cur.stepIndex + 1 };
    window.scrollTo(0, 0);
    if (next.stepIndex >= next.items.length) {
      runRef.current = next;
      persist(() => finish(next));
      return;
    }
    update(next);
    persist(() => saveRun(next));
  };

  const Exercise = item
    ? (EXERCISES[item.kind] as ComponentType<ExerciseProps<typeof item.kind>>)
    : null;

  return (
    <div className="mx-auto min-h-dvh max-w-[480px] bg-bg">
      <header className="pt-safe sticky top-0 z-30 bg-bg/95 px-3 backdrop-blur">
        <div className="flex items-center gap-2 py-2">
          <button
            type="button"
            aria-label="Выйти из урока"
            onClick={() => setExitOpen(true)}
            className="grid size-12 shrink-0 place-items-center rounded-full text-muted"
          >
            <X size={26} aria-hidden />
          </button>
          <div
            className="h-3 flex-1 overflow-hidden rounded-full bg-line"
            role="progressbar"
            aria-label="Прогресс урока"
            aria-valuemin={0}
            aria-valuemax={run.items.length}
            aria-valuenow={run.stepIndex}
          >
            <motion.div
              className="h-full rounded-full bg-primary-700"
              initial={false}
              animate={{ width: `${Math.max(progress * 100, 3)}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
          <button
            type="button"
            aria-pressed={slow}
            aria-label={slow ? 'Обычная скорость' : 'Медленнее (улитка)'}
            onClick={() => setSlow(!slow)}
            className={`grid size-12 shrink-0 place-items-center rounded-full ${
              slow ? 'bg-primary-700 text-white' : 'text-muted'
            }`}
          >
            <Snail size={24} aria-hidden />
          </button>
        </div>
      </header>

      <main className="px-5 pb-56">
        <AnimatePresence mode="wait">
          <motion.div
            key={run.stepIndex}
            // Только прозрачность: сдвиг (transform) у родителя ломает position: fixed
            // у нижней панели задания — она уезжала бы в середину экрана
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {item && Exercise && (
              <Exercise item={item} week={week} speed={speed} report={report} done={done} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomSheet open={exitOpen} onClose={() => setExitOpen(false)} title="Выйти из урока?">
        <p className="text-base text-muted">
          Прогресс сохранится — урок можно будет продолжить с этого же места.
        </p>
        <div className="mt-5 flex flex-col gap-3">
          <PillButton fullWidth onClick={() => setExitOpen(false)}>
            Продолжить урок
          </PillButton>
          {canFinishEarly && (
            <PillButton
              variant="primary"
              fullWidth
              onClick={() => {
                setExitOpen(false);
                void finish(run);
              }}
            >
              Завершить урок сейчас
            </PillButton>
          )}
          <PillButton
            variant="secondary"
            fullWidth
            onClick={() => {
              stop();
              navigate('/');
            }}
          >
            Выйти
          </PillButton>
        </div>
      </BottomSheet>
    </div>
  );
}
