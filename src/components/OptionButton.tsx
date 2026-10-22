import type { ReactNode } from 'react';
import { motion } from 'motion/react';

export type OptionState = 'normal' | 'selected' | 'correct' | 'wrong' | 'dim';

const STYLES: Record<OptionState, string> = {
  normal: 'bg-surface ring-line',
  selected: 'bg-primary-100 ring-primary-700',
  correct: 'bg-success-soft ring-success',
  wrong: 'bg-error-soft ring-error',
  dim: 'bg-surface ring-line opacity-50',
};

type OptionButtonProps = {
  state?: OptionState;
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
};

/** Вариант ответа: крупная белая плашка, после ответа подсвечивается зелёным или красным. */
export function OptionButton({
  state = 'normal',
  onClick,
  disabled,
  children,
  className = '',
}: OptionButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      animate={state === 'wrong' ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.35 }}
      aria-pressed={state === 'selected'}
      className={`min-h-14 w-full rounded-tile px-4 py-3 text-left text-base font-semibold ring-2 ring-inset ${STYLES[state]} ${className}`}
    >
      {children}
    </motion.button>
  );
}
