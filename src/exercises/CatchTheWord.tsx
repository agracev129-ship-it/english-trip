import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { AnswerBar } from '../components/AnswerBar';
import { SoundButton } from '../components/SoundButton';
import { voices } from '../content';
import { lineClip } from '../content/clips';
import { currentTime, loadTimings, play, stop } from '../lib/audio';
import { buzz } from '../lib/haptics';
import { catchHit } from '../lib/karaoke';
import type { WordTiming } from '../lib/karaoke';
import type { ExerciseProps } from './types';

type Phase = 'ready' | 'playing' | 'hit' | 'early' | 'missed';

/** №12 Идёт фраза, заранее показано слово → нажать в момент, когда оно звучит (±0.4 с). */
export function CatchTheWord({ item, week, speed, report, done }: ExerciseProps<'catch_the_word'>) {
  const [phase, setPhase] = useState<Phase>('ready');
  const [timings, setTimings] = useState<WordTiming[] | null | undefined>(undefined);
  const answered = useRef(false);
  const listening = week.listenings.find((l) => l.id === item.listening);
  const line = listening?.lines[item.line];
  const clip = listening && line ? lineClip(voices, week, listening, item.line) : null;

  useEffect(() => {
    let alive = true;
    if (clip) void loadTimings(clip.id).then((t) => alive && setTimings(t));
    return () => {
      alive = false;
      // Выход посреди фразы — это не ошибка: звук остановится, но ответ не засчитаем
      answered.current = true;
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clip?.id]);

  if (!listening || !line || !clip) return null;

  const answer = (p: Phase) => {
    if (answered.current) return;
    answered.current = true;
    setPhase(p);
    const ok = p === 'hit';
    buzz(ok ? 'correct' : 'wrong');
    report({
      correct: ok,
      skill: 'listening',
      itemIds: [`${week.id}/${listening.id}#${item.line}`],
    });
  };

  const start = () => {
    setPhase('playing');
    void play(clip.id, speed).then(() => answer('missed'));
  };

  const tap = () => {
    if (!timings) return;
    const hit = catchHit(timings, item.target, currentTime());
    answer(hit ? 'hit' : 'early');
    stop();
  };

  // Без разметки слов задание пройти нельзя (редкий случай) — не мучаем и идём дальше
  if (timings === null) {
    return (
      <>
        <p className="pt-8 text-center text-base font-semibold text-muted">
          Для этой фразы задание недоступно.
        </p>
        <AnswerBar status="idle" onNext={done} />
      </>
    );
  }

  const answeredNow = phase === 'hit' || phase === 'early' || phase === 'missed';
  return (
    <>
      <div className="flex flex-col items-center gap-5 pt-4 text-center">
        <p className="text-lg font-extrabold">Нажми, когда услышишь слово</p>
        <p className="rounded-card bg-surface px-8 py-5 text-[32px] leading-tight font-extrabold shadow-soft">
          {item.target}
        </p>

        {phase === 'ready' && (
          <button
            type="button"
            disabled={timings === undefined}
            onClick={start}
            className="mt-4 grid size-44 place-items-center rounded-full bg-primary-700 text-xl font-extrabold text-white shadow-[0_12px_40px_rgba(124,58,237,0.35)] disabled:opacity-50"
          >
            Слушать
          </button>
        )}
        {phase === 'playing' && (
          <motion.button
            type="button"
            onPointerDown={tap}
            whileTap={{ scale: 0.92 }}
            className="mt-4 grid size-44 place-items-center rounded-full bg-yellow text-2xl font-extrabold text-ink shadow-[0_12px_40px_rgba(245,183,0,0.4)]"
          >
            Слышу!
          </motion.button>
        )}
        {answeredNow && (
          <div className="mt-2 flex flex-col items-center gap-2">
            <SoundButton clipId={clip.id} speed={speed} label="фраза" />
            <p className="text-sm font-semibold text-muted">Послушай ещё раз</p>
          </div>
        )}
      </div>
      {answeredNow && (
        <AnswerBar status={phase === 'hit' ? 'correct' : 'wrong'} onNext={done}>
          {phase === 'hit' && 'Точно в момент! '}
          {phase === 'early' && 'Нажато не вовремя. '}
          {phase === 'missed' && 'Слово прозвучало, а нажатия не было. '}
          <b>{line.text}</b>
          <span className="block text-sm text-muted">{line.ru}</span>
        </AnswerBar>
      )}
    </>
  );
}
