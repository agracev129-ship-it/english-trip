import { useEffect } from 'react';
import { AnswerBar } from '../components/AnswerBar';
import { Card } from '../components/Card';
import { SoundButton } from '../components/SoundButton';
import { POS_RU, voices, wordByKey } from '../content';
import { exampleClip, wordClip } from '../content/clips';
import { introduceWord } from '../db/progress';
import type { ExerciseProps } from './types';

/** №1 Новое слово: звук → слово → перевод → пример со звуком. «Повтори вслух». */
export function WordIntro({ item, speed, done }: ExerciseProps<'word_intro'>) {
  const entry = wordByKey(item.word);
  useEffect(() => {
    void introduceWord(item.word);
  }, [item.word]);
  if (!entry) return null;
  const { word } = entry;

  return (
    <>
      <div className="flex flex-col items-center gap-5 pt-4 text-center">
        <p className="text-sm font-bold tracking-wide text-muted uppercase">Новое слово</p>
        <SoundButton
          clipId={wordClip(voices, word).id}
          speed={speed}
          label={word.en}
          size="lg"
          autoPlay
        />
        <div>
          <h2 className="text-[32px] leading-tight font-extrabold">{word.en}</h2>
          <p className="mt-1 text-xl font-semibold text-primary-700">{word.ru}</p>
          <p className="mt-1 text-sm font-semibold text-muted">{POS_RU[word.pos]}</p>
        </div>
        <Card className="flex w-full items-start gap-3 text-left">
          <SoundButton
            clipId={exampleClip(voices, word).id}
            speed={speed}
            label={word.example}
            size="sm"
          />
          <div>
            <p className="text-base font-semibold">{word.example}</p>
            <p className="text-sm text-muted">{word.exampleRu}</p>
          </div>
        </Card>
        <p className="text-sm font-semibold text-muted">🗣 Повтори вслух слово и пример</p>
      </div>
      <AnswerBar status="idle" onNext={done} />
    </>
  );
}
