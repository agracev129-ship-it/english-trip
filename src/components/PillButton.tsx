import { motion, type HTMLMotionProps } from 'motion/react';

type Variant = 'cta' | 'primary' | 'secondary';

const VARIANTS: Record<Variant, string> = {
  cta: 'bg-cta text-white',
  primary: 'bg-primary-700 text-white',
  secondary: 'bg-surface text-ink ring-1 ring-line',
};

type PillButtonProps = HTMLMotionProps<'button'> & {
  variant?: Variant;
  fullWidth?: boolean;
};

/** Кнопка-таблетка высотой не меньше 48px. Главная (cta) — чёрная, как «Start Lessons». */
export function PillButton({
  variant = 'cta',
  fullWidth = false,
  className = '',
  type = 'button',
  ...rest
}: PillButtonProps) {
  return (
    <motion.button
      type={type}
      whileTap={rest.disabled ? undefined : { scale: 0.97 }}
      className={`inline-flex min-h-14 items-center justify-center gap-2 rounded-full px-6 text-base font-bold transition-opacity disabled:cursor-not-allowed disabled:opacity-40 ${
        VARIANTS[variant]
      } ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    />
  );
}
