import { useState } from 'react';
import { motion } from 'motion/react';
import { AnswerBar } from '../components/AnswerBar';
import { SoundButton } from '../components/SoundButton';
import { voices } from '../content';
import { lineClip } from '../content/clips';
import { sameText } from '../lib/check';
import { buzz } from '../lib/haptics';
import type { ExerciseProps } from './types';

/** №10 Звучит фраза → собрать её из плиток-слов (плюс 2 лишних слова-ловушки). */
export function DictationTiles({
  item,
  week,
  speed,
  report,
  done,
}: ExerciseProps<'dictation_tiles'>) {
  // Плитки различаем по индексу: одно и то же слово может встречаться дважды
  const [chosen, setChosen] = useState<number[]>([]);
  const [checked, setChecked] = useState<boolean | null>(null);
  const listening = week.listenings.find((l) => l.id === item.listening);
  const line = listening?.lines[item.line];
  if (!listening || !line) return null;
  const clip = lineClip(voices, week, listening, item.line);

  const check = () => {
    const ok = sameText(chosen.map((i) => item.tiles[i]).join(' '), line.text);
    setChecked(ok);
    buzz(ok ? 'correct' : 'wrong');
    report({
      correct: ok,
      skill: 'listening',
      itemIds: [`${week.id}/${listening.id}#${item.line}`],
    });
  };

  const locked = checked !== null;
  return (
    <>
      <div className="flex flex-col items-center gap-5 pt-4">
        <p className="text-center text-lg font-extrabold">Собери фразу, которую слышишь</p>
        <SoundButton clipId={clip.id} speed={speed} label="фраза" size="md" autoPlay />
        <div className="flex min-h-28 w-full flex-wrap content-start gap-2 rounded-card bg-surface p-3 shadow-soft">
          {chosen.length === 0 && (
            <span className="m-auto text-sm font-semibold text-muted">
              Нажимай на слова по порядку
            </span>
          )}
          {chosen.map((ti) => (
            <motion.button
              layout
              key={ti}
              type="button"
              disabled={locked}
              onClick={() => setChosen(chosen.filter((x) => x !== ti))}
              className="min-h-12 rounded-chip bg-primary-100 px-3 text-base font-semibold text-ink"
            >
              {item.tiles[ti]}
            </motion.button>
          ))}
        </div>
        <div className="flex w-full flex-wrap justify-center gap-2">
          {item.tiles.map((t, ti) => {
            const used = chosen.includes(ti);
            return (
              <motion.button
                layout
                key={ti}
                type="button"
                disabled={used || locked}
                onClick={() => setChosen([...chosen, ti])}
                className={`min-h-12 rounded-chip px-3 text-base font-semibold ring-2 ring-inset ring-line ${
                  used ? 'bg-line text-transparent' : 'bg-surface text-ink'
                }`}
              >
                {t}
              </motion.button>
            );
          })}
        </div>
      </div>
      <AnswerBar
        status={checked === null ? 'idle' : checked ? 'correct' : 'wrong'}
        onCheck={check}
        canCheck={chosen.length > 0}
        onNext={done}
      >
        <b>{line.text}</b>
        <span className="block text-sm text-muted">{line.ru}</span>
      </AnswerBar>
    </>
  );
}
