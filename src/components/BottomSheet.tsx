import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
};

/**
 * Панель, выезжающая снизу. Закрывается крестиком, тапом по фону,
 * свайпом вниз и клавишей Esc.
 */
export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-ink/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="pb-safe absolute inset-x-0 bottom-0 mx-auto max-h-[85dvh] max-w-[480px] overflow-y-auto rounded-t-card bg-surface outline-none"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 340 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) onClose();
            }}
          >
            <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-line" aria-hidden />
            <div className="flex items-center justify-between gap-4 px-5 pt-2">
              <h2 id={titleId} className="text-xl font-extrabold">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Закрыть"
                className="-mr-2 grid size-12 place-items-center rounded-full text-muted"
              >
                <X size={24} aria-hidden />
              </button>
            </div>
            <div className="px-5 pt-2 pb-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
