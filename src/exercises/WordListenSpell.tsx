import { useState } from 'react';
import { Delete } from 'lucide-react';
import { AnswerBar } from '../components/AnswerBar';
import { SoundButton } from '../components/SoundButton';
import { voices, wordByKey } from '../content';
import { wordClip } from '../content/clips';
import { gradeWord } from '../db/progress';
import { checkSpelling } from '../lib/check';
import { buzz } from '../lib/haptics';
import type { ExerciseProps } from './types';

/** №3 Звучит слово → собрать его из букв. Опечатка в один символ засчитывается с подсказкой. */
export function WordListenSpell({ item, speed, report, done }: ExerciseProps<'word_listen_spell'>) {
  // Буквы различаем по индексу: одна и та же буква может встречаться несколько раз
  const [chosen, setChosen] = useState<number[]>([]);
  const [result, setResult] = useState<{ correct: boolean; typo: boolean } | null>(null);
  const entry = wordByKey(item.word);
  if (!entry) return null;
  const { word } = entry;
  const typed = chosen.map((i) => item.letters[i]).join('');
  const locked = result !== null;

  const check = () => {
    const r = checkSpelling(typed, word.en);
    setResult(r);
    buzz(r.correct ? 'correct' : 'wrong');
    report({ correct: r.correct, skill: 'listening', itemIds: [item.word] });
    void gradeWord(item.word, r.correct ? 'good' : 'again');
  };

  return (
    <>
      <div className="flex flex-col items-center gap-5 pt-4">
        <p className="text-center text-lg font-extrabold">Собери слово, которое слышишь</p>
        <SoundButton
          clipId={wordClip(voices, word).id}
          speed={speed}
          label="слово"
          size="lg"
          autoPlay
        />
        <div className="flex min-h-16 w-full items-center gap-2 rounded-card bg-surface px-4 shadow-soft">
          <p className="min-w-0 flex-1 text-center text-2xl font-extrabold tracking-wide break-all">
            {typed || <span className="text-base font-semibold text-muted">Нажимай на буквы</span>}
          </p>
          <button
            type="button"
            aria-label="Стереть букву"
            disabled={locked || chosen.length === 0}
            onClick={() => setChosen(chosen.slice(0, -1))}
            className="grid size-12 shrink-0 place-items-center rounded-full text-muted disabled:opacity-30"
          >
            <Delete size={24} aria-hidden />
          </button>
        </div>
        <div className="flex w-full flex-wrap justify-center gap-2">
          {item.letters.map((l, i) => {
            const used = chosen.includes(i);
            return (
              <button
                key={i}
                type="button"
                disabled={used || locked}
                onClick={() => setChosen([...chosen, i])}
                className={`size-12 rounded-chip text-xl font-bold ring-2 ring-line ring-inset ${
                  used ? 'bg-line text-transparent' : 'bg-surface text-ink'
                }`}
              >
                {l}
              </button>
            );
          })}
        </div>
      </div>
      <AnswerBar
        status={result === null ? 'idle' : result.correct ? 'correct' : 'wrong'}
        onCheck={check}
        canCheck={chosen.length > 0}
        onNext={done}
      >
        <b>{word.en}</b> — {word.ru}
        {result?.typo && (
          <span className="block text-sm text-muted">
            Засчитано, но с опечаткой: у тебя «{typed}».
          </span>
        )}
      </AnswerBar>
    </>
  );
}
