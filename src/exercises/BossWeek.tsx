import { useEffect, useRef, useState, type ComponentType } from 'react';
import { Timer } from 'lucide-react';
import { AnswerBar } from '../components/AnswerBar';
import { Mascot } from '../components/Mascot';
import { stop } from '../lib/audio';
import { bossWon } from '../lib/boss';
import { EXERCISES } from './registry';
import type { ExerciseProps, Report } from './types';

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/**
 * №18 «Босс недели»: цепочка разных заданий подряд на нормальной скорости, с сюжетом и таймером.
 * Таймер не обрывает задание, но опоздание — это поражение в сюжете (без бонуса XP).
 */
export function BossWeek({ item, week, report, done }: ExerciseProps<'boss_week'>) {
  const boss = week.boss;
  const [phase, setPhase] = useState<'intro' | 'play' | 'end'>('intro');
  const [index, setIndex] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [left, setLeft] = useState(boss?.timeLimitSec ?? 0);
  const [score, setScore] = useState({ right: 0, total: 0 });
  const [won, setWon] = useState(false);
  const scoreRef = useRef(score);

  useEffect(() => {
    if (phase !== 'play' || !boss) return;
    const t = setInterval(() => {
      setLeft(Math.max(0, boss.timeLimitSec - Math.floor((Date.now() - startedAt) / 1000)));
    }, 500);
    return () => clearInterval(t);
  }, [phase, startedAt, boss]);

  if (!boss) return null;
  const step = item.steps[index];

  const innerReport = (r: Report) => {
    if (!step) return;
    scoreRef.current = {
      right: scoreRef.current.right + (r.correct ? 1 : 0),
      total: scoreRef.current.total + 1,
    };
    setScore(scoreRef.current);
    report({ ...r, kind: r.kind ?? step.item.kind });
  };

  const innerDone = () => {
    stop();
    window.scrollTo(0, 0);
    if (index + 1 < item.steps.length) {
      setIndex(index + 1);
      return;
    }
    const secondsLeft = boss.timeLimitSec - Math.floor((Date.now() - startedAt) / 1000);
    const win = bossWon(scoreRef.current.right, scoreRef.current.total, secondsLeft);
    setWon(win);
    setPhase('end');
    // Сам босс в точность на слух не идёт: навык «слова» здесь только для начисления XP победы
    report({ correct: win, skill: 'vocab', itemIds: [`${week.id}/${boss.id}`], kind: 'boss_week' });
  };

  if (phase === 'intro') {
    return (
      <>
        <div className="flex flex-col items-center gap-4 pt-6 text-center">
          <Mascot state="fire" size={130} />
          <p className="text-sm font-bold tracking-wide text-primary-700 uppercase">Босс недели</p>
          <h2 className="text-[28px] leading-tight font-extrabold">{boss.title}</h2>
          <p className="text-base text-muted">{boss.storyRu}</p>
          <p className="flex items-center gap-2 text-base font-bold">
            <Timer size={20} aria-hidden /> {item.steps.length} заданий · {fmt(boss.timeLimitSec)}
          </p>
          <p className="text-sm text-muted">
            Звук на обычной скорости. Для победы — успеть и ответить верно хотя бы на 60%.
          </p>
        </div>
        <AnswerBar
          status="idle"
          onNext={() => {
            setStartedAt(Date.now());
            setPhase('play');
          }}
          nextLabel="Начать"
        />
      </>
    );
  }

  if (phase === 'end') {
    return (
      <>
        <div className="flex flex-col items-center gap-4 pt-8 text-center">
          <Mascot state={won ? 'celebrate' : 'sad'} size={150} />
          <h2 className="text-[28px] leading-tight font-extrabold">
            {won ? 'Босс побеждён!' : 'В этот раз не вышло'}
          </h2>
          <p className="text-base text-muted">{won ? boss.winRu : boss.loseRu}</p>
          <p className="text-lg font-extrabold tabular-nums">
            Верно: {score.right} из {score.total}
          </p>
          {won && <p className="text-base font-bold text-primary-700">+100 XP за победу</p>}
        </div>
        <AnswerBar status="idle" onNext={done} />
      </>
    );
  }

  if (!step) return null;
  // Тип компонента определяется типом шага; TypeScript не может вывести эту связь сам
  const Inner = EXERCISES[step.item.kind] as ComponentType<ExerciseProps<typeof step.item.kind>>;
  return (
    <div>
      <div className="mb-2 rounded-tile bg-lilac-soft p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-extrabold tabular-nums">
            {index + 1} / {item.steps.length}
          </span>
          <span
            className={`flex items-center gap-1 text-sm font-extrabold tabular-nums ${
              left <= 15 ? 'text-error-ink' : ''
            }`}
            role="timer"
          >
            <Timer size={16} aria-hidden /> {fmt(left)}
          </span>
        </div>
        <p className="mt-1 text-sm font-semibold">{step.storyRu}</p>
      </div>
      {/* Новый шаг — новый компонент, чтобы состояние задания начиналось заново */}
      <Inner
        key={index}
        item={step.item}
        week={week}
        speed={week.baseSpeed}
        report={innerReport}
        done={innerDone}
      />
    </div>
  );
}
