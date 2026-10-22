import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, X } from 'lucide-react';
import { PillButton } from './PillButton';

export type AnswerStatus = 'idle' | 'correct' | 'wrong';

type AnswerBarProps = {
  status: AnswerStatus;
  /** Кнопка в состоянии idle. Без onCheck в idle показывается сразу «Дальше». */
  onCheck?: () => void;
  canCheck?: boolean;
  checkLabel?: string;
  onNext: () => void;
  nextLabel?: string;
  /** Пояснение после ответа */
  children?: ReactNode;
};

/** Низ экрана задания: «Проверить» → зелёная или красная плашка с объяснением → «Дальше». */
export function AnswerBar({
  status,
  onCheck,
  canCheck = true,
  checkLabel = 'Проверить',
  onNext,
  nextLabel = 'Дальше',
  children,
}: AnswerBarProps) {
  const answered = status !== 'idle';
  return (
    <div className="pb-safe fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[480px]">
      <AnimatePresence>
        {answered && (
          <motion.div
            key={status}
            role="status"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`mx-3 rounded-t-card px-5 pt-4 pb-2 ${
              status === 'correct' ? 'bg-success-soft' : 'bg-error-soft'
            }`}
          >
            <p
              className={`flex items-center gap-2 text-lg font-extrabold ${
                status === 'correct' ? 'text-success-ink' : 'text-error-ink'
              }`}
            >
              {status === 'correct' ? (
                <Check size={22} strokeWidth={3} aria-hidden />
              ) : (
                <X size={22} strokeWidth={3} aria-hidden />
              )}
              {status === 'correct' ? 'Верно!' : 'Не совсем'}
            </p>
            {children && <div className="mt-1 text-base text-ink">{children}</div>}
          </motion.div>
        )}
      </AnimatePresence>
      <div
        className={`px-5 pt-3 pb-4 ${answered ? 'mx-3 rounded-b-card' : ''} ${
          status === 'correct'
            ? 'bg-success-soft'
            : status === 'wrong'
              ? 'bg-error-soft'
              : 'bg-bg/95'
        }`}
      >
        {answered || !onCheck ? (
          <PillButton fullWidth onClick={onNext} autoFocus={answered}>
            {nextLabel}
          </PillButton>
        ) : (
          <PillButton fullWidth onClick={onCheck} disabled={!canCheck}>
            {checkLabel}
          </PillButton>
        )}
      </div>
    </div>
  );
}
