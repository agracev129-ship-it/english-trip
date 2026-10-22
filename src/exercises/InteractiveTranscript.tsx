import { useState } from 'react';
import { AnswerBar } from '../components/AnswerBar';
import { ListeningPlayer, type TextMode } from '../components/ListeningPlayer';
import { WordSheet, type WordTap } from '../components/WordSheet';
import { stop } from '../lib/audio';
import type { ExerciseProps } from './types';

const MODES: { id: TextMode; label: string }[] = [
  { id: 'text', label: 'Текст' },
  { id: 'translation', label: 'С переводом' },
];

/**
 * №9 Текст диалога с караоке-подсветкой. Нажатие на слово открывает карточку.
 * Задание: прослушай с текстом и добавь 2 незнакомых слова в свой словарь.
 */
export function InteractiveTranscript({
  item,
  week,
  speed,
  done,
}: ExerciseProps<'interactive_transcript'>) {
  const listening = week.listenings.find((l) => l.id === item.listening);
  const [mode, setMode] = useState<TextMode>('text');
  const [tap, setTap] = useState<WordTap | null>(null);
  const [added, setAdded] = useState(0);
  if (!listening) return null;

  return (
    <>
      <div className="flex flex-col gap-4 pt-2 pb-8">
        <div>
          <p className="text-sm font-bold text-muted">С текстом · {listening.title}</p>
          <h2 className="text-lg font-extrabold">
            Послушай с текстом и добавь 2 незнакомых слова в словарь
          </h2>
          <p className="mt-1 text-sm font-semibold text-muted">
            Нажми на слово — откроется перевод. На реплику — она прозвучит ещё раз.
          </p>
        </div>

        <div
          className="flex gap-1.5 self-start rounded-full bg-surface p-1 shadow-soft"
          role="group"
          aria-label="Режим текста"
        >
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={mode === m.id}
              onClick={() => setMode(m.id)}
              className={`min-h-11 rounded-full px-4 text-sm font-bold ${
                mode === m.id ? 'bg-ink text-white' : 'text-muted'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <ListeningPlayer
          week={week}
          listening={listening}
          speed={speed}
          mode={mode}
          onWordTap={(line, token) => setTap({ listening, line, token })}
        />
      </div>

      <WordSheet
        week={week}
        tap={tap}
        speed={speed}
        onClose={() => setTap(null)}
        onAdded={() => setAdded((n) => n + 1)}
      />

      <AnswerBar
        status="idle"
        onNext={() => {
          stop();
          done();
        }}
        nextLabel={added >= 2 ? 'Готово' : `Готово · добавлено слов: ${added}`}
      />
    </>
  );
}
