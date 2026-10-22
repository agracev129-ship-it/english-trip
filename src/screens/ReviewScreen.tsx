// «Повторить сейчас»: быстрая сессия карточек из словаря вне урока.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { X } from 'lucide-react';
import { Icon3D } from '../components/Icon3D';
import { PillButton } from '../components/PillButton';
import { weeks } from '../content';
import { db } from '../db/db';
import { dueWordKeys, recordAnswer } from '../db/progress';
import { stop } from '../lib/audio';
import { FlashcardSwipe } from '../exercises/FlashcardSwipe';

const SESSION = 15;

/** Сначала то, что пора повторить; если такого нет — самые непрочные слова. */
async function pickWords(): Promise<string[]> {
  const due = await dueWordKeys();
  if (due.length) return due.slice(0, SESSION);
  const all = await db.wordStates.toArray();
  return all
    .sort((a, b) => a.card.stability - b.card.stability)
    .slice(0, SESSION)
    .map((w) => w.key);
}

export function ReviewScreen() {
  const navigate = useNavigate();
  const [words, setWords] = useState<string[] | null>(null);
  const [right, setRight] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    void pickWords().then(setWords);
    return () => stop();
  }, []);

  if (!words) return null;

  return (
    <div className="pt-safe mx-auto min-h-dvh max-w-[480px] bg-bg px-5">
      <header className="flex items-center gap-2 py-2">
        <button
          type="button"
          aria-label="Закрыть"
          onClick={() => navigate('/vocab')}
          className="-ml-3 grid size-12 place-items-center rounded-full text-muted"
        >
          <X size={26} aria-hidden />
        </button>
        <p className="text-base font-bold">Повторение слов</p>
      </header>

      {words.length === 0 ? (
        <p className="py-16 text-center text-base font-semibold text-muted">
          В словаре пока нет слов. Они появятся после первого урока.
        </p>
      ) : finished ? (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <Icon3D name="trophy" size={96} />
          <h1 className="text-[28px] font-extrabold">Повторено: {words.length}</h1>
          <p className="text-base text-muted">
            Помнишь {right} из {words.length}. Забытые слова скоро вернутся на повторение.
          </p>
          <PillButton fullWidth onClick={() => navigate('/vocab')}>
            Готово
          </PillButton>
        </div>
      ) : (
        <FlashcardSwipe
          item={{ kind: 'flashcard_swipe', words }}
          week={weeks[0]!}
          speed={1}
          report={(r) => {
            if (r.correct) setRight((n) => n + 1);
            void recordAnswer({
              item: 0,
              kind: 'flashcard_swipe',
              skill: r.skill,
              correct: r.correct,
              firstTry: true,
              normalSpeed: true,
              itemIds: r.itemIds,
              at: Date.now(),
            });
          }}
          done={() => setFinished(true)}
        />
      )}
    </div>
  );
}
