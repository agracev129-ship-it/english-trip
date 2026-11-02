// Статистика в стиле «Learning Overview» (PROJECT.md, 5.8).
import { useState } from 'react';
import { Link } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { AccuracyLine } from '../components/AccuracyLine';
import { Card } from '../components/Card';
import { Icon3D } from '../components/Icon3D';
import { MinutesBars } from '../components/MinutesBars';
import { ShareReportButton } from '../components/ShareReportButton';
import { Tile } from '../components/Tile';
import { DAILY_GOAL_MINUTES } from '../config';
import { db } from '../db/db';
import { addDays, dayKey, weekStart } from '../lib/day';
import { toPercent } from '../lib/progress';
import { isLearned } from '../lib/srs';
import { EMPTY_STREAK, streakStatus } from '../lib/streak';
import {
  formatMinutes,
  listeningByWeek,
  listeningDelta,
  monthBars,
  monthCalendar,
  MONTHS_RU,
  totals,
  weekBars,
} from '../lib/stats';

const PERIODS = [
  { id: 'week', label: 'Неделя' },
  { id: 'month', label: 'Месяц' },
] as const;
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export function StatsScreen() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]['id']>('week');
  const days = useLiveQuery(() => db.dailyStats.toArray()) ?? [];
  const streak = useLiveQuery(() => db.streak.get('streak')) ?? { id: 'streak', ...EMPTY_STREAK };
  const tests = useLiveQuery(() => db.tests.orderBy('date').toArray()) ?? [];
  const learned = useLiveQuery(
    async () => (await db.wordStates.toArray()).filter((w) => isLearned(w.card)).length,
  );

  const today = dayKey();
  const from = period === 'week' ? weekStart(today) : addDays(weekStart(today), -21);
  const t = totals(days, from, today);
  const delta = listeningDelta(days, today);
  const points = listeningByWeek(days);
  const st = streakStatus(streak, today);
  const [, month] = today.split('-').map(Number);

  return (
    <div className="pt-safe flex flex-col gap-4 px-5 pb-4">
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
        <p className="mb-2 text-sm font-bold text-muted">
          {period === 'week' ? 'Минуты по дням этой недели' : 'Минуты по неделям'}
        </p>
        <MinutesBars
          key={period}
          bars={period === 'week' ? weekBars(days, today) : monthBars(days, today)}
          goal={period === 'week' ? DAILY_GOAL_MINUTES : DAILY_GOAL_MINUTES * 7}
          caption={period === 'week' ? 'Минуты по дням' : 'Минуты по неделям'}
        />
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Tile
          solid="violet"
          value={formatMinutes(t.minutes)}
          label={period === 'week' ? 'время за неделю' : 'время за 4 недели'}
        />
        <Tile
          solid="blue"
          value={t.listening === null ? '—' : `${toPercent(t.listening)}%`}
          label={
            delta === null || period === 'month'
              ? 'точность на слух'
              : `на слух · ${delta >= 0 ? '+' : ''}${delta} к прошлой нед.`
          }
        />
        <Tile
          tone="sky"
          icon={<Icon3D name="book" size={32} />}
          value={learned ?? 0}
          label="выучено слов"
        />
        <Tile
          tone="mint"
          icon={<Icon3D name="trophy" size={32} />}
          value={t.lessons}
          label="пройдено уроков"
        />
      </div>

      <Card>
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-extrabold">Точность на слух по неделям</h2>
        </div>
        <p className="mb-2 text-sm text-muted">
          Первые попытки в заданиях на слух, без «улитки». Главный показатель прогресса.
        </p>
        {points.length >= 2 ? (
          <AccuracyLine points={points} />
        ) : (
          <div className="flex items-center gap-4 rounded-tile bg-lilac-soft p-4">
            <span className="text-[40px] leading-none font-extrabold tabular-nums">
              {points[0] ? `${toPercent(points[0].accuracy)}%` : '—'}
            </span>
            <span className="text-sm font-semibold text-muted">
              {points[0]
                ? 'Это первая неделя. Через неделю здесь появится линия роста.'
                : 'Пройди первый урок — здесь появится точность на слух.'}
            </span>
          </div>
        )}
      </Card>

      <Card className="flex items-center gap-4">
        <Icon3D name="fire" size={52} />
        <div className="flex-1">
          <p className="text-lg font-extrabold">
            Стрик: {st.current} {st.doneToday ? '✓' : ''}
          </p>
          <p className="text-sm font-semibold text-muted">
            Лучший: {streak.best} · заморозки: {'🧊'.repeat(streak.freezes) || 'нет'}
          </p>
          {st.atRisk && (
            <p className="text-sm font-bold text-error-ink">Сегодня урока ещё не было</p>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-extrabold capitalize">{MONTHS_RU[month! - 1]}</h2>
        <div
          className="grid grid-cols-7 gap-1 text-center"
          role="grid"
          aria-label="Календарь занятий"
        >
          {WEEKDAYS.map((d) => (
            <span key={d} className="pb-1 text-xs font-bold text-muted">
              {d}
            </span>
          ))}
          {monthCalendar(days, today)
            .flat()
            .map((c, i) =>
              c ? (
                <span
                  key={c.date}
                  role="gridcell"
                  aria-label={`${c.day}${c.active ? ', был урок' : ''}`}
                  className={`mx-auto grid size-9 place-items-center rounded-full text-sm font-bold tabular-nums ${
                    c.active ? 'bg-primary-700 text-white' : 'text-ink'
                  } ${c.isToday ? 'ring-2 ring-primary-700 ring-offset-2' : ''}`}
                >
                  {c.day}
                </span>
              ) : (
                <span key={`e${i}`} />
              ),
            )}
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-extrabold">Тесты</h2>
          <Link to="/profile" className="text-sm font-bold text-primary-700">
            + EF SET
          </Link>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="pb-2 font-semibold">Дата</th>
              <th className="pb-2 font-semibold">Тест</th>
              <th className="pb-2 text-right font-semibold">Слух</th>
              <th className="pb-2 text-right font-semibold">Итог</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {tests.map((x) => (
              <tr key={x.id} className="border-t border-line">
                <td className="py-2">{x.date.split('-').reverse().join('.')}</td>
                <td className="py-2 font-semibold">
                  {x.kind === 'efset' ? 'EF SET' : `Контрольная ${x.month ?? ''}`}
                  {x.id === 'efset-start' && (
                    <span className="block text-xs text-muted">стартовый</span>
                  )}
                </td>
                <td className="py-2 text-right font-bold">{x.listening ?? '—'}</td>
                <td className="py-2 text-right font-bold">
                  {x.total ?? (x.score !== undefined ? `${x.score}%` : '—')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <ShareReportButton variant="primary" />
    </div>
  );
}
