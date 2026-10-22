// Экран завершения урока (PROJECT.md, 5.5): конфетти, XP, стрик, точность на слух, новые слова.
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Icon3D } from '../components/Icon3D';
import { PillButton } from '../components/PillButton';
import { Tile } from '../components/Tile';
import { lessonTitle } from '../content';
import type { Week } from '../content/schema';
import { db } from '../db/db';
import type { LessonSummary } from '../db/progress';
import { toPercent } from '../lib/progress';
import { levelInfo } from '../lib/xp';

function daysWord(n: number) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'день';
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'дня';
  return 'дней';
}

export function LessonDone({
  summary,
  week,
  day,
}: {
  summary: LessonSummary;
  week: Week;
  day: number;
}) {
  const navigate = useNavigate();
  const totalXp = useLiveQuery(async () =>
    (await db.dailyStats.toArray()).reduce((s, d) => s + d.xp, 0),
  );

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    void confetti({
      particleCount: 140,
      spread: 80,
      origin: { y: 0.35 },
      disableForReducedMotion: true,
    });
  }, []);

  const s = summary.streak.streak;
  const accuracy =
    summary.listeningTotal > 0
      ? toPercent(summary.listeningCorrect / summary.listeningTotal)
      : null;
  const level = totalXp !== undefined ? levelInfo(totalXp) : null;

  return (
    <div className="pt-safe mx-auto flex min-h-dvh max-w-[480px] flex-col gap-5 bg-bg px-5 pb-10">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14 }}
        className="mt-10 flex flex-col items-center text-center"
      >
        <img
          src={`${import.meta.env.BASE_URL}logo.svg`}
          alt=""
          width={128}
          height={128}
          className="rounded-full bg-lilac-soft p-3"
        />
        <h1 className="mt-4 text-[32px] leading-tight font-extrabold">Урок пройден!</h1>
        <p className="mt-1 text-base font-semibold text-muted">
          {week.title} · день {day}: {lessonTitle(week, day)}
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        <Tile solid="violet" value={`+${summary.xp}`} label="XP за урок" />
        <Tile
          tone="yellow"
          icon={<Icon3D name="fire" size={36} />}
          value={s.current}
          label={`${daysWord(s.current)} подряд`}
        />
        <Tile
          tone="lilac"
          icon={<Icon3D name="headphone" size={36} />}
          value={accuracy === null ? '—' : `${accuracy}%`}
          label="точность на слух"
        />
        <Tile
          tone="mint"
          icon={<Icon3D name="book" size={36} />}
          value={summary.newWords}
          label="новых слов"
        />
      </div>

      {summary.streak.freezesUsed > 0 && (
        <p className="rounded-tile bg-sky-soft p-4 text-base font-semibold">
          🧊 Заморозка спасла стрик: пропущенный день не сбросил серию.
        </p>
      )}
      {summary.streak.freezeEarned && (
        <p className="rounded-tile bg-sky-soft p-4 text-base font-semibold">
          🧊 Неделя подряд! Получена заморозка — она спасёт стрик, если пропустишь день.
        </p>
      )}
      {summary.perfectListening && (
        <p className="rounded-tile bg-success-soft p-4 text-base font-semibold">
          🎧 Ни одной ошибки на слух — бонус +20 XP!
        </p>
      )}

      {level && (
        <div className="rounded-card bg-surface p-5 shadow-soft">
          <p className="text-sm font-bold text-muted">
            Уровень {level.level} · {level.city}
          </p>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-line">
            <motion.div
              className="h-full rounded-full bg-primary-700"
              initial={{ width: 0 }}
              animate={{ width: `${(level.into / level.needed) * 100}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <p className="mt-2 text-sm font-semibold text-muted tabular-nums">
            {level.into} / {level.needed} XP до города «{level.nextCity}»
          </p>
        </div>
      )}

      <PillButton fullWidth className="mt-auto" onClick={() => navigate('/')}>
        Готово
      </PillButton>
    </div>
  );
}
