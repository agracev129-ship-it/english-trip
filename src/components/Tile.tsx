import type { ReactNode } from 'react';
import { SOLID_BG, TONE_BG, type SolidTone, type Tone } from './tones';

type TileProps = {
  /** Пастельный фон (как плитки «Lessons / Quizes / Hours») */
  tone?: Tone;
  /** Насыщенный фон (как плитки «Weekly learning time» и «Voca 80%») */
  solid?: SolidTone;
  icon?: ReactNode;
  value: ReactNode;
  label: ReactNode;
  className?: string;
};

/** Плитка: иконка, крупная цифра и подпись. */
export function Tile({ tone = 'lilac', solid, icon, value, label, className = '' }: TileProps) {
  const bg = solid ? SOLID_BG[solid] : TONE_BG[tone];
  return (
    <div className={`flex flex-col gap-3 rounded-tile p-4 ${bg} ${className}`}>
      {icon && <div className="h-9">{icon}</div>}
      <div>
        <div className="text-[28px] leading-tight font-extrabold tabular-nums">{value}</div>
        <div className={`text-sm font-semibold ${solid ? 'text-ink/80' : 'text-muted'}`}>
          {label}
        </div>
      </div>
    </div>
  );
}
