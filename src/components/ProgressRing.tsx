import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { clampProgress, toPercent } from '../lib/progress';

type ProgressRingProps = {
  /** Доля 0…1 */
  value: number;
  size?: number;
  stroke?: number;
  /** Цвет дуги, CSS-значение, например 'var(--color-lilac)' */
  color?: string;
  /** Подпись для экранного диктора, например «Аудирование» */
  label: string;
  children?: ReactNode;
};

/** Кольцо прогресса с плавной анимацией дуги. В центр можно положить иконку. */
export function ProgressRing({
  value,
  size = 72,
  stroke = 7,
  color = 'var(--color-primary)',
  label,
  children,
}: ProgressRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = clampProgress(value);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={toPercent(p)}
      className="relative inline-grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - p) }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          // Нулевой прогресс со скруглёнными концами рисует точку — прячем её
          opacity={p === 0 ? 0 : 1}
        />
      </svg>
      <div className="relative">{children}</div>
    </div>
  );
}
