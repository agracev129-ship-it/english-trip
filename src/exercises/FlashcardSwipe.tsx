import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { AnimatePresence, motion, type PanInfo } from 'motion/react';
import { SoundButton } from '../components/SoundButton';
import { voices, wordByKey } from '../content';
import { exampleClip, wordClip } from '../content/clips';
import { db } from '../db/db';
import { gradeWord } from '../db/progress';
import { buzz } from '../lib/haptics';
import type { Grade } from '../lib/srs';
import type { ExerciseProps } from './types';

type Face = {
  en: string;
  ru: string;
  clipId: string;
  example?: string;
  exampleRu?: string;
  exampleClipId?: string;
};

function useFace(key: string): Face | null {
  const user = useLiveQuery(
    () => (key.startsWith('user/') ? db.wordStates.get(key) : undefined),
    [key],
  );
  const course = wordByKey(key);
  if (course) {
    return {
      en: course.word.en,
      ru: course.word.ru,
      clipId: wordClip(voices, course.word).id,
      example: course.word.example,
      exampleRu: course.word.exampleRu,
      exampleClipId: exampleClip(voices, course.word).id,
    };
  }
  if (user?.user) {
    // Своё слово из диалога: перевода слова нет, на обороте — реплика с переводом
    return {
      en: user.user.en,
      ru: user.user.contextRu,
      clipId: user.user.clipId,
      example: user.user.contextEn,
    };
  }
  return null;
}

const SWIPE = 90;

/** №4 Карточки FSRS: вправо «помню», влево «забыла», вверх «легко». */
export function FlashcardSwipe({ item, speed, report, done }: ExerciseProps<'flashcard_swipe'>) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const key = item.words[index];
  const face = useFace(key ?? '');

  const grade = (g: Grade) => {
    if (!key) return;
    buzz(g === 'again' ? 'wrong' : 'correct');
    report({ correct: g !== 'again', skill: 'vocab', itemIds: [key] });
    void gradeWord(key, g);
    setFlipped(false);
    if (index + 1 >= item.words.length) done();
    else setIndex(index + 1);
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y < -SWIPE) grade('easy');
    else if (info.offset.x > SWIPE) grade('good');
    else if (info.offset.x < -SWIPE) grade('again');
  };

  return (
    <div className="flex flex-col gap-5 pt-2">
      <div className="flex items-baseline justify-between">
        <p className="text-lg font-extrabold">Повторение</p>
        <p className="text-sm font-bold text-muted tabular-nums">
          {Math.min(index + 1, item.words.length)} / {item.words.length}
        </p>
      </div>

      <div className="relative h-[340px]">
        {!face && key?.startsWith('user/') === false && (
          // Слово исчезло из курса (контент поменялся) — просто пропускаем
          <button
            type="button"
            onClick={() => grade('good')}
            className="absolute inset-0 text-muted"
          >
            Пропустить карточку
          </button>
        )}
        <AnimatePresence mode="popLayout">
          {face && (
            <motion.div
              key={key}
              drag
              dragSnapToOrigin
              dragElastic={0.6}
              onDragEnd={onDragEnd}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => setFlipped(true)}
              className="absolute inset-0 flex cursor-grab touch-none flex-col items-center justify-center gap-4 rounded-card bg-surface p-6 text-center shadow-soft"
            >
              <div onClick={(e) => e.stopPropagation()}>
                <SoundButton clipId={face.clipId} speed={speed} label={face.en} autoPlay />
              </div>
              <p className="text-[28px] leading-tight font-extrabold">{face.en}</p>
              {flipped ? (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-xl font-semibold text-primary-700">{face.ru}</p>
                  {face.example && (
                    <div
                      className="mt-2 flex items-start gap-2 text-left"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {face.exampleClipId && (
                        <SoundButton
                          clipId={face.exampleClipId}
                          speed={speed}
                          label={face.example}
                          size="sm"
                        />
                      )}
                      <p className="text-sm">
                        {face.example}
                        {face.exampleRu && (
                          <span className="block text-muted">{face.exampleRu}</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm font-semibold text-muted">
                  Вспомни перевод и нажми на карточку
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="text-center text-xs font-semibold text-muted">
        Свайп вправо — помню, влево — забыла, вверх — легко
      </p>
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => grade('again')}
          className="min-h-14 rounded-full bg-error-soft font-bold"
        >
          Забыла
        </button>
        <button
          type="button"
          onClick={() => grade('good')}
          className="min-h-14 rounded-full bg-success-soft font-bold"
        >
          Помню
        </button>
        <button
          type="button"
          onClick={() => grade('easy')}
          className="min-h-14 rounded-full bg-sky-soft font-bold"
        >
          Легко
        </button>
      </div>
    </div>
  );
}
