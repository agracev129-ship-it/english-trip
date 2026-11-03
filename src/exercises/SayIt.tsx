import { useEffect, useRef, useState } from 'react';
import { Mic } from 'lucide-react';
import { AnswerBar } from '../components/AnswerBar';
import { Card } from '../components/Card';
import { PillButton } from '../components/PillButton';
import { SoundButton } from '../components/SoundButton';
import { voices } from '../content';
import { lineClip } from '../content/clips';
import { stop } from '../lib/audio';
import { checkDictation } from '../lib/check';
import { buzz } from '../lib/haptics';
import { listenOnce } from '../lib/speech';
import type { ExerciseProps } from './types';

const MAX_TRIES = 2;

type Phase = 'idle' | 'listening' | 'retry' | 'unheard' | 'correct' | 'wrong';

/**
 * №16 Сказать фразу → распознавание проверяет. Появляется только если она сама включила это
 * в настройках: голос уходит на серверы Google.
 */
export function SayIt({ item, week, speed, report, done }: ExerciseProps<'say_it'>) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [heard, setHeard] = useState('');
  const tries = useRef(0);
  const cancel = useRef<(() => void) | null>(null);
  const listening = week.listenings.find((l) => l.id === item.listening);
  const line = listening?.lines[item.line];

  useEffect(() => () => cancel.current?.(), []);

  if (!listening || !line) return null;
  const clip = lineClip(voices, week, listening, item.line);

  const finish = (ok: boolean) => {
    setPhase(ok ? 'correct' : 'wrong');
    buzz(ok ? 'correct' : 'wrong');
    report({
      correct: ok,
      skill: 'speaking',
      firstTry: tries.current === 1,
      itemIds: [`${week.id}/${listening.id}#${item.line}`],
    });
  };

  const say = async () => {
    stop();
    setPhase('listening');
    const { result, cancel: c } = listenOnce();
    cancel.current = c;
    const alternatives = await result;
    cancel.current = null;
    if (alternatives.length === 0) {
      setPhase('unheard');
      return;
    }
    tries.current++;
    setHeard(alternatives[0]!);
    if (alternatives.some((a) => checkDictation(a, line.text).correct)) finish(true);
    else if (tries.current >= MAX_TRIES) finish(false);
    else setPhase('retry');
  };

  const answered = phase === 'correct' || phase === 'wrong';
  return (
    <>
      <div className="flex flex-col items-center gap-5 pt-4 text-center">
        <p className="text-lg font-extrabold">Скажи эту фразу</p>
        <Card className="flex w-full items-start gap-3 text-left">
          <SoundButton clipId={clip.id} speed={speed} label={line.text} />
          <div>
            <p className="text-lg font-bold">{line.text}</p>
            <p className="text-sm text-muted">{line.ru}</p>
          </div>
        </Card>
        {phase === 'retry' && (
          <p className="text-base font-semibold text-muted">
            Я услышал: «{heard}». Попробуй ещё раз, чуть чётче.
          </p>
        )}
        {phase === 'unheard' && (
          <p className="text-base font-semibold text-muted">
            Не получилось распознать. Попробуй ещё раз или пропусти.
          </p>
        )}
        {(phase === 'idle' || phase === 'retry' || phase === 'unheard') && (
          <PillButton variant="primary" fullWidth onClick={say}>
            <Mic size={20} aria-hidden /> Сказать
          </PillButton>
        )}
        {phase === 'listening' && (
          <p className="flex min-h-14 items-center gap-2 text-base font-bold text-primary-700">
            <Mic size={20} aria-hidden /> Слушаю…
          </p>
        )}
        {phase === 'unheard' && (
          <PillButton variant="secondary" fullWidth onClick={done}>
            Пропустить
          </PillButton>
        )}
      </div>
      {answered && (
        <AnswerBar status={phase === 'correct' ? 'correct' : 'wrong'} onNext={done}>
          Услышано: «{heard}»
        </AnswerBar>
      )}
    </>
  );
}
