import { useLiveQuery } from 'dexie-react-hooks';
import { BookmarkPlus, Check } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { PillButton } from './PillButton';
import { SoundButton } from './SoundButton';
import { POS_RU, voices, weeks, wordByKey } from '../content';
import { exampleClip, lineClip, wordClip } from '../content/clips';
import type { Listening, Week } from '../content/schema';
import { db } from '../db/db';
import { addCourseWord, addUserWord } from '../db/progress';
import { lineTokens, wordKey } from '../lib/lessonBuilder';
import { findVocabAt } from '../lib/vocabMatch';

export type WordTap = { listening: Listening; line: number; token: number };

type WordSheetProps = {
  week: Week;
  tap: WordTap | null;
  speed: number;
  onClose: () => void;
  onAdded?: () => void;
};

/** Карточка слова из текста: перевод, часть речи, пример, «В мой словарь» (PROJECT.md, 5.6). */
export function WordSheet({ week, tap, speed, onClose, onAdded }: WordSheetProps) {
  // Словарь — все недели курса до текущей включительно
  const upTo = weeks.findIndex((w) => w.id === week.id);
  const vocab = weeks
    .slice(0, upTo + 1)
    .flatMap((w) => w.words.map((x) => ({ key: wordKey(w.id, x.id), en: x.en })));

  const line = tap ? tap.listening.lines[tap.line] : undefined;
  const tokens = line ? lineTokens(line.text) : [];
  const match = tap ? findVocabAt(tokens, tap.token, vocab) : null;
  const course = match ? wordByKey(match.key) : undefined;
  const token = tokens[tap?.token ?? 0] ?? '';
  const storeKey = course ? match!.key : `user/${token.toLowerCase()}`;
  const saved = useLiveQuery(
    () => (tap ? db.wordStates.get(storeKey) : undefined),
    [storeKey, tap],
  );

  const add = async () => {
    if (!tap || !line) return;
    if (course) await addCourseWord(match!.key);
    else {
      await addUserWord({
        en: token,
        contextEn: line.text,
        contextRu: line.ru,
        clipId: lineClip(voices, week, tap.listening, tap.line).id,
      });
    }
    onAdded?.();
  };

  return (
    <BottomSheet open={!!tap} onClose={onClose} title={course ? course.word.en : token}>
      {tap && line && (
        <div className="flex flex-col gap-4">
          {course ? (
            <>
              <div className="flex items-center gap-3">
                <SoundButton
                  clipId={wordClip(voices, course.word).id}
                  speed={speed}
                  label={course.word.en}
                />
                <div>
                  <p className="text-xl font-bold text-primary-700">{course.word.ru}</p>
                  <p className="text-sm font-semibold text-muted">{POS_RU[course.word.pos]}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-tile bg-bg p-3">
                <SoundButton
                  clipId={exampleClip(voices, course.word).id}
                  speed={speed}
                  label={course.word.example}
                  size="sm"
                />
                <p className="text-base">
                  {course.word.example}
                  <span className="block text-sm text-muted">{course.word.exampleRu}</span>
                </p>
              </div>
            </>
          ) : (
            <div className="rounded-tile bg-bg p-3">
              <p className="text-sm font-semibold text-muted">
                Этого слова нет в словаре курса. Вот реплика, где оно встретилось:
              </p>
              <p className="mt-1 text-base">{line.text}</p>
              <p className="text-sm text-muted">{line.ru}</p>
            </div>
          )}
          {saved ? (
            <p className="flex min-h-14 items-center justify-center gap-2 font-bold text-success">
              <Check size={20} aria-hidden /> Уже в моём словаре
            </p>
          ) : (
            <PillButton variant="primary" fullWidth onClick={add}>
              <BookmarkPlus size={20} aria-hidden /> В мой словарь
            </PillButton>
          )}
        </div>
      )}
    </BottomSheet>
  );
}
