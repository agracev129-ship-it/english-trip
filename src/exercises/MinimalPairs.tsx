import { useState } from 'react';
import { AnswerBar } from '../components/AnswerBar';
import { OptionButton, type OptionState } from '../components/OptionButton';
import { SoundButton } from '../components/SoundButton';
import { voices } from '../content';
import { pairClips } from '../content/clips';
import { buzz } from '../lib/haptics';
import type { ExerciseProps } from './types';

/** №6 Звучит одно слово из пары (ship/sheep) → выбрать, какое. */
export function MinimalPairs({ item, week, speed, report, done }: ExerciseProps<'minimal_pairs'>) {
  const [picked, setPicked] = useState<'a' | 'b' | null>(null);
  const pair = week.minimalPairs.find((p) => p.id === item.pair);
  if (!pair) return null;
  const clips = pairClips(voices, pair);
  const target = clips[item.target];

  const answer = (side: 'a' | 'b') => {
    if (picked) return;
    setPicked(side);
    const ok = side === item.target;
    buzz(ok ? 'correct' : 'wrong');
    report({ correct: ok, skill: 'listening', itemIds: [`${week.id}/${pair.id}`] });
  };

  const stateOf = (side: 'a' | 'b'): OptionState =>
    !picked ? 'normal' : side === item.target ? 'correct' : side === picked ? 'wrong' : 'dim';

  return (
    <>
      <div className="flex flex-col items-center gap-6 pt-4">
        <p className="text-center text-lg font-extrabold">Какое слово прозвучало?</p>
        <SoundButton clipId={target.id} speed={speed} label="слово" size="lg" autoPlay />
        <div className="grid w-full grid-cols-2 gap-3">
          {(['a', 'b'] as const).map((side) => (
            <OptionButton
              key={side}
              state={stateOf(side)}
              onClick={() => answer(side)}
              disabled={!!picked}
              className="text-center"
            >
              <span className="block text-2xl font-extrabold">{pair[side]}</span>
              <span className="block text-sm text-muted">{side === 'a' ? pair.aRu : pair.bRu}</span>
            </OptionButton>
          ))}
        </div>
        {picked && (
          <div className="grid w-full grid-cols-2 gap-3">
            {(['a', 'b'] as const).map((side) => (
              <div key={side} className="flex items-center justify-center gap-2">
                <SoundButton clipId={clips[side].id} speed={speed} label={pair[side]} size="sm" />
                <span className="font-semibold">{pair[side]}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <AnswerBar
        status={!picked ? 'idle' : picked === item.target ? 'correct' : 'wrong'}
        onCheck={() => {}}
        canCheck={false}
        checkLabel="Выбери слово"
        onNext={done}
      >
        Прозвучало <b>{pair[item.target]}</b>. Послушай оба слова и сравни.
      </AnswerBar>
    </>
  );
}
