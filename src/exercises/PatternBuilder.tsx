import { useState } from 'react';
import { AnswerBar } from '../components/AnswerBar';
import { Card } from '../components/Card';
import { OptionButton, type OptionState } from '../components/OptionButton';
import { voices } from '../content';
import { patternClip, patternSentence } from '../content/clips';
import { play } from '../lib/audio';
import { buzz } from '../lib/haptics';
import type { ExerciseProps } from './types';

/** №15 Грамматика через шаблон: подставить из вариантов и услышать результат. */
export function PatternBuilder({
  item,
  week,
  speed,
  report,
  done,
}: ExerciseProps<'pattern_builder'>) {
  const [picked, setPicked] = useState<string | null>(null);
  const pattern = week.patterns.find((p) => p.id === item.pattern);
  const entry = pattern?.items[item.index];
  if (!pattern || !entry) return null;

  const answer = (o: string) => {
    if (picked) return;
    setPicked(o);
    const ok = o === entry.answer;
    buzz(ok ? 'correct' : 'wrong');
    report({ correct: ok, skill: 'grammar', itemIds: [`${week.id}/${pattern.id}#${item.index}`] });
    // В любом случае она слышит правильную фразу целиком
    void play(patternClip(voices, pattern, item.index).id, speed);
  };

  const [before, after] = pattern.template.split('___');
  const stateOf = (o: string): OptionState =>
    !picked ? 'normal' : o === entry.answer ? 'correct' : o === picked ? 'wrong' : 'dim';

  return (
    <>
      <div className="flex flex-col gap-5 pt-4">
        <div>
          <p className="text-sm font-bold text-muted">Шаблон</p>
          <p className="text-base text-muted">{pattern.ruleRu}</p>
        </div>
        <p className="text-center text-lg font-extrabold">{entry.promptRu}</p>
        <Card className="text-center text-xl font-bold">
          {before}
          <span
            className={`mx-1 inline-block min-w-16 rounded-chip px-2 ${
              picked ? 'bg-primary-100 text-primary-700' : 'border-b-4 border-line'
            }`}
          >
            {picked ?? ' '}
          </span>
          {after}
        </Card>
        <div className="flex flex-col gap-3">
          {item.options.map((o) => (
            <OptionButton key={o} state={stateOf(o)} onClick={() => answer(o)} disabled={!!picked}>
              {o}
            </OptionButton>
          ))}
        </div>
      </div>
      <AnswerBar
        status={!picked ? 'idle' : picked === entry.answer ? 'correct' : 'wrong'}
        onCheck={() => {}}
        canCheck={false}
        checkLabel="Выбери вариант"
        onNext={done}
      >
        <b>{patternSentence(pattern, entry.answer)}</b>
      </AnswerBar>
    </>
  );
}
