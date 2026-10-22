import { useState } from 'react';
import {
  Bell,
  ChevronRight,
  Gauge,
  HardDriveDownload,
  RotateCcw,
  Volume2,
  type LucideIcon,
} from 'lucide-react';
import { Card } from '../components/Card';
import { ComingSoonSheet } from '../components/ComingSoonSheet';
import { LEARNER_NAME } from '../config';

const SETTINGS: { label: string; icon: LucideIcon; danger?: boolean }[] = [
  { label: 'Скорость речи по умолчанию', icon: Gauge },
  { label: 'Звуки и вибрация', icon: Volume2 },
  { label: 'Время напоминания', icon: Bell },
  { label: 'Резервная копия', icon: HardDriveDownload },
  { label: 'Сбросить прогресс', icon: RotateCcw, danger: true },
];

export function ProfileScreen() {
  const [soon, setSoon] = useState<string | null>(null);

  return (
    <div className="pt-safe flex flex-col gap-4 px-5">
      <header className="flex flex-col items-center pt-10 pb-2 text-center">
        <img
          src={`${import.meta.env.BASE_URL}logo.svg`}
          alt=""
          width={112}
          height={112}
          className="rounded-full bg-lilac-soft p-3 ring-4 ring-surface"
        />
        <h1 className="mt-3 text-2xl font-extrabold">{LEARNER_NAME || 'Мой профиль'}</h1>
        <p className="text-sm font-semibold text-muted">Цель: понимать английский на слух</p>
      </header>

      <Card className="p-2">
        <h2 className="px-3 pt-2 pb-1 text-sm font-bold text-muted">Настройки</h2>
        <ul>
          {SETTINGS.map(({ label, icon: Icon, danger }) => (
            <li key={label}>
              <button
                type="button"
                onClick={() => setSoon(label)}
                className={`flex min-h-14 w-full items-center gap-3 rounded-tile px-3 text-left text-base font-semibold ${
                  danger ? 'text-error' : 'text-ink'
                }`}
              >
                <Icon size={22} aria-hidden className={danger ? '' : 'text-primary-700'} />
                <span className="flex-1">{label}</span>
                <ChevronRight size={20} className="text-muted" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <p className="pt-2 pb-4 text-center text-xs font-semibold text-muted">
        English Trip · версия 0.1 · этап 0
      </p>

      <ComingSoonSheet feature={soon} onClose={() => setSoon(null)} />
    </div>
  );
}
