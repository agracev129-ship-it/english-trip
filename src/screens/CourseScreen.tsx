import { useState } from 'react';
import { ChevronRight, Lock } from 'lucide-react';
import { ComingSoonSheet } from '../components/ComingSoonSheet';
import { Icon3D, type Icon3DName } from '../components/Icon3D';
import { TONE_BG, type Tone } from '../components/tones';

// Заглушка до этапа 1: потом недели будут читаться из content/month1/*.json
const MONTH_1: { n: number; title: string; icon: Icon3DName; tone: Tone }[] = [
  { n: 1, title: 'Аэропорт и перелёт', icon: 'airplane', tone: 'sky' },
  { n: 2, title: 'Отель и город', icon: 'hotel', tone: 'lilac' },
  { n: 3, title: 'Кафе, магазины, аптека', icon: 'coffee', tone: 'peach' },
  { n: 4, title: 'Работа: знакомство, встречи, созвоны', icon: 'briefcase', tone: 'mint' },
];

export function CourseScreen() {
  const [soon, setSoon] = useState<string | null>(null);

  return (
    <div className="pt-safe px-5">
      <header className="pt-8 pb-5">
        <h1 className="text-[32px] leading-tight font-extrabold">Уроки</h1>
      </header>

      <section aria-labelledby="month-1">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="month-1" className="text-xl font-extrabold">
            Месяц 1
          </h2>
          <span className="rounded-chip bg-primary-100 px-3 py-1 text-sm font-bold text-primary-700">
            A2 · базовые ситуации
          </span>
        </div>

        <ul className="flex flex-col gap-3">
          {MONTH_1.map((week) => {
            const locked = week.n > 1;
            return (
              <li key={week.n}>
                <button
                  type="button"
                  onClick={() => setSoon(`Неделя ${week.n}: ${week.title}`)}
                  className="flex w-full items-center gap-4 rounded-card bg-surface p-4 text-left shadow-soft"
                >
                  <div
                    className={`grid size-16 shrink-0 place-items-center rounded-tile ${TONE_BG[week.tone]} ${
                      locked ? 'opacity-50 grayscale' : ''
                    }`}
                  >
                    <Icon3D name={week.icon} size={44} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-muted">Неделя {week.n}</p>
                    <p className="text-base leading-snug font-bold">{week.title}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-line" aria-hidden />
                      <span className="text-xs font-bold text-muted tabular-nums">0/7</span>
                    </div>
                  </div>
                  {locked ? (
                    <Lock size={20} className="shrink-0 text-muted" aria-label="Закрыто" />
                  ) : (
                    <ChevronRight size={22} className="shrink-0 text-muted" aria-hidden />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <ComingSoonSheet feature={soon} onClose={() => setSoon(null)} />
    </div>
  );
}
