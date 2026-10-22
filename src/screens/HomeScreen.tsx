import { useState } from 'react';
import { Circle } from 'lucide-react';
import { Card } from '../components/Card';
import { ComingSoonSheet } from '../components/ComingSoonSheet';
import { Icon3D, type Icon3DName } from '../components/Icon3D';
import { PillButton } from '../components/PillButton';
import { ProgressRing } from '../components/ProgressRing';
import { SKILL_TONE, TONE_ACCENT_VAR } from '../components/tones';
import { LEARNER_NAME } from '../config';

const LESSON_PLAN = [
  'Разминка-повторение',
  'Новые слова',
  'Главное аудирование',
  'Тренажёр слуха',
  'Диктант',
];

const SKILLS: { key: keyof typeof SKILL_TONE; title: string; icon: Icon3DName }[] = [
  { key: 'listening', title: 'Аудирование', icon: 'headphone' },
  { key: 'vocab', title: 'Слова', icon: 'book' },
  { key: 'speaking', title: 'Речь', icon: 'microphone' },
  { key: 'grammar', title: 'Грамматика', icon: 'pencil' },
];

export function HomeScreen() {
  const [soon, setSoon] = useState<string | null>(null);
  const greeting = LEARNER_NAME ? `Привет, ${LEARNER_NAME}!` : 'Привет!';

  return (
    <>
      <header className="bg-header pt-safe rounded-b-[32px] px-5 pb-14 text-white">
        <div className="flex items-center justify-between pt-5">
          <p className="text-base font-semibold">{greeting}</p>
          <div
            className="flex items-center gap-1 rounded-full bg-white/20 py-1 pr-3 pl-1.5"
            aria-label="Стрик: 0 дней"
          >
            <Icon3D name="fire" size={28} />
            <span className="text-base font-extrabold tabular-nums">0</span>
          </div>
        </div>
        <h1 className="mt-4 text-[32px] leading-[1.1] font-extrabold">
          Слушаем английский
          <br />
          каждый день
        </h1>
      </header>

      <div className="-mt-8 flex flex-col gap-4 px-5">
        <Card>
          <div className="flex items-center gap-4">
            <div className="grid size-16 shrink-0 place-items-center rounded-tile bg-sky-soft">
              <Icon3D name="airplane" size={44} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-muted">Урок на сегодня · ~20 мин</p>
              <h2 className="text-xl font-extrabold">Аэропорт и перелёт</h2>
              <p className="text-sm font-semibold text-muted">Неделя 1 · урок 1 из 7</p>
            </div>
          </div>

          <ul className="mt-5 flex flex-col gap-3">
            {LESSON_PLAN.map((step) => (
              <li key={step} className="flex items-center gap-3 text-base font-semibold">
                <Circle size={20} className="text-line" strokeWidth={2.5} aria-hidden />
                {step}
              </li>
            ))}
          </ul>

          <PillButton fullWidth className="mt-5" onClick={() => setSoon('Первый урок')}>
            Начать
          </PillButton>
        </Card>

        <section aria-labelledby="skills-title">
          <h2 id="skills-title" className="mt-2 mb-3 text-xl font-extrabold">
            Навыки
          </h2>
          <ul className="grid grid-cols-2 gap-3">
            {SKILLS.map(({ key, title, icon }) => (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => setSoon(`Тренировка «${title}»`)}
                  className="flex w-full flex-col items-start gap-4 rounded-card bg-surface p-4 text-left shadow-soft"
                >
                  <ProgressRing value={0} color={TONE_ACCENT_VAR[SKILL_TONE[key]]} label={title}>
                    <Icon3D name={icon} size={36} />
                  </ProgressRing>
                  <span>
                    <span className="block text-base font-bold">{title}</span>
                    <span className="block text-sm font-semibold text-muted">0% пройдено</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <ComingSoonSheet feature={soon} onClose={() => setSoon(null)} />
    </>
  );
}
