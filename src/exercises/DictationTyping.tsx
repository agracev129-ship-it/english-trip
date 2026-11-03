import { useState } from 'react';
import { AnswerBar } from '../components/AnswerBar';
import { SoundButton } from '../components/SoundButton';
import { voices } from '../content';
import { lineClip } from '../content/clips';
import { checkDictation, type DictationResult, type WordStatus } from '../lib/check';
import { buzz } from '../lib/haptics';
import type { ExerciseProps } from './types';

const MARK: Record<WordStatus, string> = {
  ok: 'bg-success-soft text-success-ink',
  typo: 'bg-yellow-soft text-ink',
  wrong: 'bg-error-soft text-error-ink',
};

/** №11 Звучит фраза → набрать. Терпит регистр, пунктуацию и опечатку в слове. */
export function DictationTyping({
  item,
  week,
  speed,
  report,
  done,
}: ExerciseProps<'dictation_typing'>) {
  const [text, setText] = useState('');
  const [result, setResult] = useState<DictationResult | null>(null);
  const listening = week.listenings.find((l) => l.id === item.listening);
  const line = listening?.lines[item.line];
  if (!listening || !line) return null;
  const clip = lineClip(voices, week, listening, item.line);

  const check = () => {
    const r = checkDictation(text, line.text);
    setResult(r);
    buzz(r.correct ? 'correct' : 'wrong');
    report({
      correct: r.correct,
      skill: 'listening',
      itemIds: [`${week.id}/${listening.id}#${item.line}`],
    });
  };

  return (
    <>
      <div className="flex flex-col items-center gap-5 pt-4">
        <p className="text-center text-lg font-extrabold">Напиши фразу, которую слышишь</p>
        <SoundButton clipId={clip.id} speed={speed} label="фраза" size="md" autoPlay />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={result !== null}
          rows={3}
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          aria-label="Что ты услышала"
          placeholder="Пиши по-английски…"
          className="w-full resize-none rounded-card bg-surface p-4 text-lg font-semibold ring-2 ring-line outline-none ring-inset focus:ring-primary-700"
        />
      </div>
      <AnswerBar
        status={result === null ? 'idle' : result.correct ? 'correct' : 'wrong'}
        onCheck={check}
        canCheck={text.trim().length > 0}
        onNext={done}
      >
        {result && (
          <span className="flex flex-wrap gap-1">
            {result.marks.map((m, i) => (
              <span key={i} className={`rounded px-1 font-bold ${MARK[m.status]}`}>
                {m.word}
              </span>
            ))}
          </span>
        )}
        {!!result?.extra.length && (
          <span className="mt-1 block text-sm text-muted">Лишнее: {result.extra.join(', ')}</span>
        )}
        <span className="mt-1 block text-sm text-muted">{line.ru}</span>
      </AnswerBar>
    </>
  );
}
