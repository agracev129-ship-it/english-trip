import { useState } from 'react';
import { motion } from 'motion/react';
import type { Bar } from '../lib/stats';

type MinutesBarsProps = {
  bars: Bar[];
  /** Цель на столбик в минутах — пунктирная линия */
  goal: number;
  caption: string;
};

const HEIGHT = 150;
const MIN_PILL = 10;

/**
 * Столбики-таблетки минут (как «Learning Overview»): текущий — насыщенный, остальные бледные.
 * Нажатие показывает подсказку «23 мин». Для экранного диктора — скрытая таблица.
 */
export function MinutesBars({ bars, goal, caption }: MinutesBarsProps) {
  const current = bars.findIndex((b) => b.isToday);
  const [selected, setSelected] = useState<number>(current >= 0 ? current : bars.length - 1);
  const max = Math.max(goal * 1.25, ...bars.map((b) => b.minutes));
  const h = (m: number) => Math.max(MIN_PILL, (m / max) * HEIGHT);
  const goalY = HEIGHT - (goal / max) * HEIGHT;

  return (
    <figure className="m-0">
      <div className="relative" style={{ height: HEIGHT + 34 }} aria-hidden>
        {/* Цель: пунктир */}
        <div
          className="absolute inset-x-0 border-t-2 border-dashed border-primary/30"
          style={{ top: goalY + 34 }}
        />
        <span
          className="absolute right-0 rounded-full bg-surface px-1.5 text-[11px] font-bold text-muted"
          style={{ top: goalY + 34 - 9 }}
        >
          цель {goal}
        </span>
        <div
          className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2"
          style={{ height: HEIGHT }}
        >
          {bars.map((b, i) => (
            <button
              key={b.date}
              type="button"
              tabIndex={-1}
              onClick={() => setSelected(i)}
              className="relative flex h-full flex-1 items-end justify-center"
            >
              {selected === i && (
                <span
                  className="absolute z-10 rounded-full bg-ink px-2.5 py-1 text-xs font-bold whitespace-nowrap text-white tabular-nums"
                  style={{ bottom: h(b.minutes) + 8 }}
                >
                  {b.minutes} мин
                </span>
              )}
              <motion.span
                className={`block w-full max-w-11 rounded-full ${
                  b.isToday ? 'bg-primary-700' : selected === i ? 'bg-lilac' : 'bg-lilac-soft'
                }`}
                initial={{ height: MIN_PILL }}
                animate={{ height: h(b.minutes) }}
                transition={{ type: 'spring', stiffness: 140, damping: 20, delay: i * 0.03 }}
              />
            </button>
          ))}
        </div>
      </div>
      <div className="mt-2 flex justify-between gap-2" aria-hidden>
        {bars.map((b) => (
          <span
            key={b.date}
            className={`flex-1 text-center text-xs tabular-nums ${b.isToday ? 'font-extrabold text-ink' : 'font-semibold text-muted'}`}
          >
            {b.label}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>{caption}</caption>
        <tbody>
          {bars.map((b) => (
            <tr key={b.date}>
              <th scope="row">{b.label}</th>
              <td>{b.minutes} мин</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
