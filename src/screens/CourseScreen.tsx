import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronRight, CircleCheck, Lock } from 'lucide-react';
import { BottomSheet } from '../components/BottomSheet';
import { Icon3D, type Icon3DName } from '../components/Icon3D';
import { PillButton } from '../components/PillButton';
import { TONE_BG, type Tone } from '../components/tones';
import { course, weeks } from '../content';
import { useCourseProgress } from '../db/courseProgress';

const WEEK_TONES: Tone[] = ['sky', 'lilac', 'peach', 'mint'];

export function CourseScreen() {
  const navigate = useNavigate();
  const progress = useCourseProgress();
  const [locked, setLocked] = useState<string | null>(null);

  return (
    <div className="pt-safe px-5">
      <header className="pt-8 pb-5">
        <h1 className="text-[32px] leading-tight font-extrabold">Уроки</h1>
      </header>

      {course.months.map((month) => (
        <section key={month.id} aria-labelledby={`month-${month.id}`} className="mb-6">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 id={`month-${month.id}`} className="text-xl font-extrabold">
              Месяц {month.n}
            </h2>
            <span className="rounded-chip bg-primary-100 px-3 py-1 text-sm font-bold text-primary-700">
              {month.level} · {month.title.toLowerCase()}
            </span>
          </div>

          <ul className="flex flex-col gap-3">
            {month.weeks.map((wid, i) => {
              const week = weeks.find((w) => w.id === wid)!;
              const open = progress?.isWeekUnlocked(wid) ?? i === 0;
              const done = progress?.weekDone(wid) ?? 0;
              const total = week.lessons.length;
              return (
                <li key={wid}>
                  <button
                    type="button"
                    onClick={() =>
                      open
                        ? navigate(`/course/${wid}`)
                        : setLocked(weeks[weeks.indexOf(week) - 1]?.title ?? null)
                    }
                    className="flex w-full items-center gap-4 rounded-card bg-surface p-4 text-left shadow-soft"
                  >
                    <div
                      className={`grid size-16 shrink-0 place-items-center rounded-tile ${TONE_BG[WEEK_TONES[i % 4]!]} ${
                        open ? '' : 'opacity-50 grayscale'
                      }`}
                    >
                      <Icon3D name={week.icon as Icon3DName} size={44} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-muted">Неделя {week.n}</p>
                      <p className="text-base leading-snug font-bold">{week.title}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div
                          className="h-1.5 flex-1 overflow-hidden rounded-full bg-line"
                          aria-hidden
                        >
                          <div
                            className="h-full rounded-full bg-primary-700"
                            style={{ width: `${(done / total) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-muted tabular-nums">
                          {done}/{total}
                        </span>
                      </div>
                    </div>
                    {!open ? (
                      <Lock size={20} className="shrink-0 text-muted" aria-label="Закрыто" />
                    ) : done === total ? (
                      <CircleCheck
                        size={22}
                        className="shrink-0 text-success"
                        aria-label="Пройдено"
                      />
                    ) : (
                      <ChevronRight size={22} className="shrink-0 text-muted" aria-hidden />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <BottomSheet open={locked !== null} onClose={() => setLocked(null)} title="Тема пока закрыта">
        <p className="text-base text-muted">
          Она откроется, когда пройдены все 7 уроков темы «{locked}». Так слова и звуки ложатся по
          порядку.
        </p>
        <PillButton fullWidth className="mt-5" onClick={() => setLocked(null)}>
          Понятно
        </PillButton>
      </BottomSheet>
    </div>
  );
}
