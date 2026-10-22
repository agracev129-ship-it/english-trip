import type { HTMLAttributes } from 'react';

/** Белая карточка со скруглением 24px и мягкой тенью. */
export function Card({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-card bg-surface p-5 shadow-soft ${className}`} {...rest} />;
}
