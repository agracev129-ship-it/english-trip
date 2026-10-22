import { useEffect, useState } from 'react';
import { loadTimings, usePlayer } from '../lib/audio';
import { activeWordIndex, type WordTiming } from '../lib/karaoke';
import { lineTokens } from '../lib/lessonBuilder';

type KaraokeTextProps = {
  clipId: string;
  text: string;
  /** Нажатие на слово: индекс слова в lineTokens(text) */
  onWordTap?: (index: number) => void;
};

/**
 * Текст реплики с подсветкой слова, которое звучит. Если разметки нет — подсвечивается вся
 * реплика. Слова можно нажимать (карточка слова).
 */
export function KaraokeText({ clipId, text, onWordTap }: KaraokeTextProps) {
  const { id, playing, time } = usePlayer();
  const [timings, setTimings] = useState<WordTiming[] | null>(null);
  useEffect(() => {
    let alive = true;
    loadTimings(clipId).then((t) => alive && setTimings(t));
    return () => {
      alive = false;
    };
  }, [clipId]);

  const active = playing && id === clipId;
  const words = text.split(/\s+/).filter(Boolean);
  // Тайминги размечены по тому же тексту, поэтому слова совпадают по индексу
  const current = active && timings?.length === words.length ? activeWordIndex(timings, time) : -1;
  const wholeLine = active && current === -1 && !(timings?.length === words.length);

  let tokenIndex = -1;
  return (
    <span className={wholeLine ? 'rounded bg-yellow-soft' : ''}>
      {words.map((w, i) => {
        const isWord = lineTokens(w).length > 0;
        if (isWord) tokenIndex++;
        const ti = tokenIndex;
        const cls = `-mx-0.5 rounded px-0.5 transition-colors ${i === current ? 'bg-yellow text-ink' : ''}`;
        return onWordTap && isWord ? (
          <span key={i}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onWordTap(ti);
              }}
              className={`${cls} underline decoration-line decoration-2 underline-offset-4`}
            >
              {w}
            </button>{' '}
          </span>
        ) : (
          <span key={i} className={cls}>
            {w}{' '}
          </span>
        );
      })}
    </span>
  );
}
