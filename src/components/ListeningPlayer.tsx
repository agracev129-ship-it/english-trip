import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { KaraokeText } from './KaraokeText';
import { voices } from '../content';
import { lineClip } from '../content/clips';
import type { Listening, Week } from '../content/schema';
import { play, stop } from '../lib/audio';

export type TextMode = 'hidden' | 'text' | 'translation';

type ListeningPlayerProps = {
  week: Week;
  listening: Listening;
  speed: number;
  mode: TextMode;
  /** Компактный вид (над вопросами) */
  compact?: boolean;
  onWordTap?: (line: number, token: number) => void;
  /** Диалог прослушан до конца хотя бы раз */
  onFinished?: () => void;
};

/**
 * Плеер аудирования (PROJECT.md, 5.6): большая кнопка Play/Pause со свечением, «повторить
 * фразу», текст с караоке-подсветкой. Реплики играют подряд; нажатие на реплику — только она.
 */
export function ListeningPlayer({
  week,
  listening,
  speed,
  mode,
  compact,
  onWordTap,
  onFinished,
}: ListeningPlayerProps) {
  const [line, setLine] = useState(0);
  const [running, setRunning] = useState(false);
  const runToken = useRef(0);
  const total = listening.lines.length;
  const clips = listening.lines.map((_, i) => lineClip(voices, week, listening, i));

  // Уходим с экрана — звук останавливаем
  useEffect(
    () => () => {
      runToken.current++;
      stop();
    },
    [],
  );

  const playFrom = async (start: number) => {
    const my = ++runToken.current;
    setRunning(true);
    for (let i = start; i < total; i++) {
      setLine(i);
      await play(clips[i]!.id, speed);
      if (runToken.current !== my) return; // пауза или другая реплика
      // Короткая пауза между репликами, как в живом разговоре
      await new Promise((r) => setTimeout(r, 350));
      if (runToken.current !== my) return;
    }
    setRunning(false);
    setLine(0);
    onFinished?.();
  };

  const pause = () => {
    runToken.current++;
    stop();
    setRunning(false);
  };

  const playOne = (i: number) => {
    runToken.current++;
    setRunning(false);
    setLine(i);
    void play(clips[i]!.id, speed);
  };

  const big = compact ? 'size-16' : 'size-28';
  return (
    <div className="flex flex-col gap-4">
      <div className={`flex items-center justify-center ${compact ? 'gap-4' : 'gap-6 py-2'}`}>
        <button
          type="button"
          onClick={() => playOne(line)}
          aria-label="Повторить фразу"
          className="grid size-12 place-items-center rounded-full bg-surface text-muted shadow-soft"
        >
          <RotateCcw size={22} aria-hidden />
        </button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          onClick={() => (running ? pause() : playFrom(line))}
          aria-label={running ? 'Пауза' : 'Слушать диалог'}
          className={`relative grid place-items-center rounded-full bg-primary-700 text-white shadow-[0_12px_40px_rgba(124,58,237,0.35)] ${big}`}
        >
          {running && (
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-full bg-primary/30"
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 1.4, opacity: 0 }}
              transition={{ duration: 1.3, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
          {running ? (
            <Pause size={compact ? 28 : 44} fill="currentColor" aria-hidden />
          ) : (
            <Play size={compact ? 28 : 44} fill="currentColor" className="ml-1" aria-hidden />
          )}
        </motion.button>
        <div className="grid size-12 place-items-center text-sm font-bold text-muted tabular-nums">
          {line + 1}/{total}
        </div>
      </div>

      {mode !== 'hidden' && (
        <ol className="flex flex-col gap-2.5">
          {listening.lines.map((l, i) => {
            const speaker = listening.speakers.find((s) => s.id === l.speaker);
            const isAnna = l.speaker === 'anna';
            return (
              <li key={i} className={`flex ${isAnna ? 'justify-end' : 'justify-start'}`}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => playOne(i)}
                  onKeyDown={(e) => e.key === 'Enter' && playOne(i)}
                  className={`max-w-[88%] rounded-tile px-4 py-2.5 text-left ring-2 ring-inset transition-colors ${
                    isAnna ? 'bg-primary-100' : 'bg-surface'
                  } ${i === line ? 'ring-primary-700/50' : 'ring-transparent'}`}
                >
                  <p className="text-xs font-bold text-muted">{speaker?.name}</p>
                  <p className="text-base leading-snug">
                    <KaraokeText
                      clipId={clips[i]!.id}
                      text={l.text}
                      onWordTap={onWordTap ? (t) => onWordTap(i, t) : undefined}
                    />
                  </p>
                  {mode === 'translation' && <p className="mt-0.5 text-sm text-muted">{l.ru}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
