import { useState } from 'react';
import { Card } from '../components/Card';
import { Icon3D } from '../components/Icon3D';
import { Tile } from '../components/Tile';
import { DAILY_GOAL_MINUTES, STARTING_EFSET } from '../config';

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const PERIODS = [
  { id: 'week', label: 'Неделя' },
  { id: 'month', label: 'Месяц' },
] as const;

/** Индекс сегодняшнего дня, где понедельник = 0 */
function todayIndex() {
  return (new Date().getDay() + 6) % 7;
}

export function StatsScreen() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]['id']>('week');
  const today = todayIndex();
  const efsetDate = new Date(STARTING_EFSET.date).toLocaleDateString('ru-RU');

  return (
    <div className="pt-safe flex flex-col gap-4 px-5">
      <header className="flex flex-wrap items-end justify-between gap-3 pt-8 pb-1">
        <h1 className="text-[32px] leading-tight font-extrabold">Статистика</h1>
        <div
          className="flex rounded-full bg-surface p-1 shadow-soft"
          role="group"
          aria-label="Период"
        >
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={period === p.id}
              onClick={() => setPeriod(p.id)}
              className={`min-h-12 rounded-full px-4 text-sm font-bold ${
                period === p.id ? 'bg-ink text-white' : 'text-muted'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      <Card className="px-4">
        <div className="flex h-40 items-end justify-between gap-2" aria-hidden>
          {DAYS.map((d, i) => (
            <div key={d} className="flex flex-1 flex-col items-center gap-2">
              <div
                className={`w-full max-w-10 rounded-full ${i === today ? 'bg-primary/35' : 'bg-lilac-soft'}`}
                style={{ height: 28 }}
              />
              <span
                className={`text-xs tabular-nums ${i === today ? 'font-extrabold text-ink' : 'font-semibold text-muted'}`}
              >
                {d}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-sm font-semibold text-muted">
          Здесь появятся минуты по дням. Цель — {DAILY_GOAL_MINUTES} мин в день
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Tile solid="violet" value="0 мин" label="Время за неделю" />
        <Tile solid="blue" value="—" label="Точность на слух" />
        <Tile tone="sky" value="0" label="Выучено слов" />
        <Tile tone="mint" value="0" label="Пройдено уроков" />
      </div>

      <Card className="flex items-center gap-4">
        <Icon3D name="lightning" size={44} />
        <div>
          <p className="text-sm font-semibold text-muted">Стрик</p>
          <p className="text-base font-bold">Пройди первый урок, чтобы начать серию</p>
        </div>
      </Card>

      <section aria-labelledby="efset-title">
        <h2 id="efset-title" className="mt-2 mb-3 text-xl font-extrabold">
          Стартовый тест EF SET
        </h2>
        <p className="-mt-2 mb-3 text-sm font-semibold text-muted">{efsetDate}</p>
        <div className="grid grid-cols-3 gap-3">
          <Tile tone="lilac" value={STARTING_EFSET.total} label="Общий" />
          <Tile tone="sky" value={STARTING_EFSET.reading} label="Чтение" />
          <Tile tone="pink" value={STARTING_EFSET.listening} label="Слух" />
        </div>
      </section>
    </div>
  );
}
