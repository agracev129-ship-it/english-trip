import { useState } from 'react';
import { AnswerBar } from '../components/AnswerBar';
import { OptionButton, type OptionState } from '../components/OptionButton';
import { SoundButton } from '../components/SoundButton';
import { voices } from '../content';
import { lineClip } from '../content/clips';
import { buzz } from '../lib/haptics';
import type { ExerciseProps } from './types';

/** №13 Одна фраза на ×0.75 → ×1.0 → ×1.25, после каждой вопрос «что услышала». */
export function SpeedLadder({ item, week, report, done }: ExerciseProps<'speed_ladder'>) {
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const listening = week.listenings.find((l) => l.id === item.listening);
  const line = listening?.lines[item.line];
  const step = item.rounds[round];
  if (!listening || !line || !step) return null;
  const clip = lineClip(voices, week, listening, item.line);

  const answer = (o: string) => {
    if (picked) return;
    setPicked(o);
    const ok = o === line.ru;
    buzz(ok ? 'correct' : 'wrong');
    report({
      correct: ok,
      skill: 'listening',
      itemIds: [`${week.id}/${listening.id}#${item.line}`],
      // Замедленная ступень не идёт в главную метрику «точность на слух»
      normalSpeed: step.speed >= 1,
    });
  };

  const next = () => {
    if (round + 1 >= item.rounds.length) return done();
    setRound(round + 1);
    setPicked(null);
  };

  const stateOf = (o: string): OptionState =>
    !picked ? 'normal' : o === line.ru ? 'correct' : o === picked ? 'wrong' : 'dim';

  return (
    <>
      <div className="flex flex-col items-center gap-5 pt-4">
        <p className="text-center text-lg font-extrabold">Что прозвучало?</p>
        <div className="flex gap-2" aria-label={`Ступень ${round + 1} из ${item.rounds.length}`}>
          {item.rounds.map((r, i) => (
            <span
              key={r.speed}
              className={`rounded-full px-3 py-1 text-sm font-extrabold tabular-nums ${
                i === round ? 'bg-primary-700 text-white' : i < round ? 'bg-primary-100' : 'bg-line'
              }`}
            >
              ×{r.speed}
            </span>
          ))}
        </div>
        {/* Новая ступень — новая кнопка: звук стартует сам на новой скорости */}
        <SoundButton
          key={round}
          clipId={clip.id}
          speed={step.speed}
          label="фраза"
          size="lg"
          autoPlay
        />
        <div className="flex w-full flex-col gap-3">
          {step.options.map((o) => (
            <OptionButton key={o} state={stateOf(o)} onClick={() => answer(o)} disabled={!!picked}>
              {o}
            </OptionButton>
          ))}
        </div>
      </div>
      <AnswerBar
        status={!picked ? 'idle' : picked === line.ru ? 'correct' : 'wrong'}
        onCheck={() => {}}
        canCheck={false}
        checkLabel="Выбери вариант"
        onNext={next}
        nextLabel={
          round + 1 >= item.rounds.length ? 'Дальше' : `Быстрее: ×${item.rounds[round + 1]!.speed}`
        }
      >
        <b>{line.text}</b>
      </AnswerBar>
    </>
  );
}
