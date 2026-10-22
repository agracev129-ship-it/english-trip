import { useState } from 'react';
import { AnswerBar } from '../components/AnswerBar';
import { ListeningPlayer } from '../components/ListeningPlayer';
import { OptionButton, type OptionState } from '../components/OptionButton';
import { PillButton } from '../components/PillButton';
import { stop } from '../lib/audio';
import { buzz } from '../lib/haptics';
import type { ExerciseProps } from './types';

/**
 * №8 Прослушать диалог без текста (сколько угодно раз) → 3–4 вопроса с выбором ответа.
 * После ответа — объяснение на русском.
 */
export function DialogComprehension({
  item,
  week,
  speed,
  report,
  done,
}: ExerciseProps<'dialog_comprehension'>) {
  const listening = week.listenings.find((l) => l.id === item.listening);
  const [phase, setPhase] = useState<'listen' | 'questions'>('listen');
  const [heard, setHeard] = useState(false);
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  if (!listening) return null;
  const q = listening.questions[qi]!;

  const answer = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const ok = i === q.correct;
    buzz(ok ? 'correct' : 'wrong');
    report({ correct: ok, skill: 'listening', itemIds: [`${week.id}/${listening.id}?${qi}`] });
  };

  const next = () => {
    if (qi + 1 >= listening.questions.length) {
      stop();
      done();
      return;
    }
    setQi(qi + 1);
    setPicked(null);
  };

  const stateOf = (i: number): OptionState =>
    picked === null ? 'normal' : i === q.correct ? 'correct' : i === picked ? 'wrong' : 'dim';

  return (
    <>
      <div className="flex flex-col gap-5 pt-2">
        <div>
          <p className="text-sm font-bold text-muted">
            {listening.kind === 'dialog'
              ? 'Диалог'
              : listening.kind === 'announcement'
                ? 'Объявление'
                : 'Монолог'}
            {item.speedDelta > 0 && ' · чуть быстрее'}
          </p>
          <h2 className="text-xl font-extrabold">{listening.title}</h2>
          {phase === 'listen' && (
            <p className="mt-1 text-base text-muted">
              Послушай без текста. Можно сколько угодно раз — потом будут вопросы.
            </p>
          )}
        </div>

        <ListeningPlayer
          week={week}
          listening={listening}
          speed={speed}
          mode="hidden"
          compact={phase === 'questions'}
          onFinished={() => setHeard(true)}
        />

        {phase === 'questions' && (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-bold text-muted tabular-nums">
              Вопрос {qi + 1} из {listening.questions.length}
            </p>
            <p className="text-lg font-bold">{q.q}</p>
            {q.options.map((o, i) => (
              <OptionButton
                key={`${qi}-${i}`}
                state={stateOf(i)}
                onClick={() => answer(i)}
                disabled={picked !== null}
              >
                {o}
              </OptionButton>
            ))}
          </div>
        )}
      </div>

      {phase === 'listen' ? (
        <div className="pb-safe fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[480px] bg-bg/95 px-5 pt-3 pb-4">
          <PillButton
            fullWidth
            disabled={!heard}
            onClick={() => {
              stop();
              setPhase('questions');
            }}
          >
            {heard ? 'К вопросам' : 'Сначала послушай до конца'}
          </PillButton>
        </div>
      ) : (
        <AnswerBar
          status={picked === null ? 'idle' : picked === q.correct ? 'correct' : 'wrong'}
          onCheck={() => {}}
          canCheck={false}
          checkLabel="Выбери ответ"
          onNext={next}
        >
          {q.explainRu}
        </AnswerBar>
      )}
    </>
  );
}
