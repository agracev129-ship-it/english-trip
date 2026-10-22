import { useState } from 'react';
import { AnswerBar } from '../components/AnswerBar';
import { SoundButton } from '../components/SoundButton';
import { voices } from '../content';
import { drillClip } from '../content/clips';
import { sameNumber } from '../lib/check';
import { buzz } from '../lib/haptics';
import type { ExerciseProps } from './types';

/** №7 Звучит фраза с числом, временем, ценой → ввести цифрами. */
export function NumbersListen({
  item,
  week,
  speed,
  report,
  done,
}: ExerciseProps<'numbers_listen'>) {
  const drill = week.numberDrills.find((d) => d.id === item.drill);
  const [values, setValues] = useState<string[]>(() => drill?.answers.map(() => '') ?? []);
  const [checked, setChecked] = useState<boolean | null>(null);
  if (!drill) return null;

  const check = () => {
    const ok = drill.answers.every((a, i) => sameNumber(values[i] ?? '', a));
    setChecked(ok);
    buzz(ok ? 'correct' : 'wrong');
    report({ correct: ok, skill: 'listening', itemIds: [`${week.id}/${drill.id}`] });
  };

  return (
    <>
      <div className="flex flex-col items-center gap-6 pt-4">
        <p className="text-center text-lg font-extrabold">Запиши цифрами</p>
        <SoundButton
          clipId={drillClip(voices, drill).id}
          speed={speed}
          label="фраза"
          size="lg"
          autoPlay
        />
        <p className="text-center text-base font-semibold text-muted">{drill.promptRu}</p>
        <div className="flex w-full justify-center gap-3">
          {drill.answers.map((a, i) => (
            <input
              key={i}
              inputMode="decimal"
              autoComplete="off"
              aria-label={drill.answers.length > 1 ? `Число ${i + 1}` : 'Число'}
              placeholder={a.includes(':') ? '00:00' : '…'}
              value={values[i]}
              disabled={checked !== null}
              onChange={(e) => setValues(values.map((v, j) => (j === i ? e.target.value : v)))}
              onKeyDown={(e) =>
                e.key === 'Enter' && values.every(Boolean) && checked === null && check()
              }
              className={`min-h-16 w-full max-w-40 rounded-tile bg-surface px-3 text-center text-3xl font-extrabold tabular-nums ring-2 outline-none ring-inset focus:ring-primary-700 ${
                checked === null
                  ? 'ring-line'
                  : sameNumber(values[i] ?? '', a)
                    ? 'ring-success'
                    : 'ring-error'
              }`}
            />
          ))}
        </div>
      </div>
      <AnswerBar
        status={checked === null ? 'idle' : checked ? 'correct' : 'wrong'}
        onCheck={check}
        canCheck={values.every((v) => v.trim())}
        onNext={done}
      >
        «{drill.text}» → <b>{drill.answers.join(', ')}</b>
      </AnswerBar>
    </>
  );
}
