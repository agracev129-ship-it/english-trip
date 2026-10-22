import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Volume2 } from 'lucide-react';
import { AnswerBar } from '../components/AnswerBar';
import { voices, wordByKey } from '../content';
import { sha1Hex } from '../content/audioId';
import { wordClip } from '../content/clips';
import { play } from '../lib/audio';
import { buzz } from '../lib/haptics';
import { seededRng, shuffle } from '../lib/random';
import type { ExerciseProps } from './types';

/** №5 Соединить 5 пар «звук ↔ перевод» на время. */
export function MatchPairs({ item, speed, report, done }: ExerciseProps<'match_pairs'>) {
  const words = useMemo(() => item.words.filter((k) => wordByKey(k)), [item.words]);
  // Порядок переводов зависит только от набора слов, чтобы не прыгал при перерисовке
  const right = useMemo(
    () => shuffle(words, seededRng(parseInt(sha1Hex(words.join()).slice(0, 8), 16))),
    [words],
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [matched, setMatched] = useState<string[]>([]);
  const [wrongFlash, setWrongFlash] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [startedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const finished = matched.length === words.length;

  useEffect(() => {
    if (finished) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(t);
  }, [finished, startedAt]);

  const tapSound = (key: string) => {
    if (matched.includes(key)) return;
    setSelected(key);
    void play(wordClip(voices, wordByKey(key)!.word).id, speed);
  };

  const tapTranslation = (key: string) => {
    if (!selected || matched.includes(key)) return;
    if (key === selected) {
      buzz('correct');
      const next = [...matched, key];
      setMatched(next);
      setSelected(null);
      if (next.length === words.length) {
        for (const k of words) {
          report({ correct: !mistakes.includes(k), skill: 'vocab', itemIds: [k] });
        }
      }
    } else {
      buzz('wrong');
      if (!mistakes.includes(selected)) setMistakes([...mistakes, selected]);
      setWrongFlash(key);
      setTimeout(() => setWrongFlash(null), 400);
    }
  };

  const mm = String(Math.floor(elapsed / 60));
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <>
      <div className="flex flex-col gap-4 pt-2">
        <div className="flex items-baseline justify-between">
          <p className="text-lg font-extrabold">Соедини звук и перевод</p>
          <p className="text-sm font-bold text-muted tabular-nums">
            ⏱ {mm}:{ss}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-3">
            {words.map((k, i) => {
              const done_ = matched.includes(k);
              return (
                <button
                  key={k}
                  type="button"
                  disabled={done_}
                  onClick={() => tapSound(k)}
                  aria-label={`Звук ${i + 1}`}
                  className={`flex min-h-16 items-center justify-center gap-2 rounded-tile font-bold ring-2 ring-inset ${
                    done_
                      ? 'bg-success-soft text-success opacity-60 ring-success'
                      : selected === k
                        ? 'bg-primary-100 text-primary-700 ring-primary-700'
                        : 'bg-surface text-primary-700 ring-line'
                  }`}
                >
                  <Volume2 size={22} aria-hidden /> {i + 1}
                </button>
              );
            })}
          </div>
          <div className="flex flex-col gap-3">
            {right.map((k) => {
              const done_ = matched.includes(k);
              return (
                <motion.button
                  key={k}
                  type="button"
                  disabled={done_}
                  onClick={() => tapTranslation(k)}
                  animate={wrongFlash === k ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
                  className={`min-h-16 rounded-tile px-3 text-sm leading-tight font-semibold ring-2 ring-inset ${
                    done_
                      ? 'bg-success-soft opacity-60 ring-success'
                      : wrongFlash === k
                        ? 'bg-error-soft ring-error'
                        : 'bg-surface ring-line'
                  }`}
                >
                  {wordByKey(k)!.word.ru}
                </motion.button>
              );
            })}
          </div>
        </div>
        {!finished && (
          <p className="text-center text-sm font-semibold text-muted">
            Нажми на звук, послушай и выбери перевод
          </p>
        )}
      </div>
      {finished && (
        <AnswerBar status={mistakes.length === 0 ? 'correct' : 'wrong'} onNext={done}>
          {mistakes.length === 0
            ? `Все пары без ошибок за ${mm}:${ss}`
            : `Готово за ${mm}:${ss}, ошибок: ${mistakes.length}`}
        </AnswerBar>
      )}
    </>
  );
}
