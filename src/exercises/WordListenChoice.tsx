import { useState } from 'react';
import { AnswerBar } from '../components/AnswerBar';
import { OptionButton, type OptionState } from '../components/OptionButton';
import { SoundButton } from '../components/SoundButton';
import { voices, wordByKey } from '../content';
import { wordClip } from '../content/clips';
import { gradeWord } from '../db/progress';
import { buzz } from '../lib/haptics';
import type { ExerciseProps } from './types';

/** №2 Звучит слово (текста нет) → выбрать перевод из 4. */
export function WordListenChoice({
  item,
  speed,
  report,
  done,
}: ExerciseProps<'word_listen_choice'>) {
  const [picked, setPicked] = useState<string | null>(null);
  const target = wordByKey(item.word);
  if (!target) return null;
  const correct = picked === item.word;

  const answer = (key: string) => {
    if (picked) return;
    setPicked(key);
    const ok = key === item.word;
    buzz(ok ? 'correct' : 'wrong');
    report({ correct: ok, skill: 'listening', itemIds: [item.word] });
    void gradeWord(item.word, ok ? 'good' : 'again');
  };

  const stateOf = (key: string): OptionState => {
    if (!picked) return 'normal';
    if (key === item.word) return 'correct';
    return key === picked ? 'wrong' : 'dim';
  };

  return (
    <>
      <div className="flex flex-col items-center gap-6 pt-4">
        <p className="text-center text-lg font-extrabold">Что означает это слово?</p>
        <SoundButton
          clipId={wordClip(voices, target.word).id}
          speed={speed}
          label="слово"
          size="lg"
          autoPlay
        />
        <div className="flex w-full flex-col gap-3">
          {item.options.map((key) => (
            <OptionButton
              key={key}
              state={stateOf(key)}
              onClick={() => answer(key)}
              disabled={!!picked}
            >
              {wordByKey(key)?.word.ru}
            </OptionButton>
          ))}
        </div>
      </div>
      <AnswerBar
        status={!picked ? 'idle' : correct ? 'correct' : 'wrong'}
        onCheck={() => {}}
        canCheck={false}
        checkLabel="Выбери вариант"
        onNext={done}
      >
        <b>{target.word.en}</b> — {target.word.ru}
      </AnswerBar>
    </>
  );
}
