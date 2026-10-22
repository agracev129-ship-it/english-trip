import { useEffect } from 'react';
import { motion } from 'motion/react';
import { Volume2 } from 'lucide-react';
import { play, stop, usePlayer } from '../lib/audio';

type SoundButtonProps = {
  clipId: string;
  speed: number;
  /** Подпись для экранного диктора */
  label: string;
  size?: 'lg' | 'md' | 'sm';
  /** Сыграть сразу при появлении (задание началось по нажатию «Дальше») */
  autoPlay?: boolean;
};

const SIZES = {
  lg: { box: 'size-36', icon: 52 },
  md: { box: 'size-16', icon: 28 },
  sm: { box: 'size-12', icon: 20 },
} as const;

/** Круглая кнопка звука со свечением, как в референсе «Conversation». */
export function SoundButton({ clipId, speed, label, size = 'md', autoPlay }: SoundButtonProps) {
  const { id, playing } = usePlayer();
  const active = playing && id === clipId;

  useEffect(() => {
    if (autoPlay) void play(clipId, speed);
    // Только при появлении задания: смена скорости не должна запускать звук заново
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clipId]);

  const s = SIZES[size];
  return (
    <motion.button
      type="button"
      aria-label={`${active ? 'Остановить' : 'Слушать'}: ${label}`}
      onClick={() => (active ? stop() : play(clipId, speed))}
      whileTap={{ scale: 0.94 }}
      className={`relative grid shrink-0 place-items-center rounded-full bg-surface text-primary-700 ${s.box} ${
        size === 'lg' ? 'shadow-[0_12px_40px_rgba(124,58,237,0.25)]' : 'shadow-soft'
      }`}
    >
      {active && (
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full bg-primary/20"
          initial={{ scale: 1, opacity: 0.7 }}
          animate={{ scale: 1.35, opacity: 0 }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
      <Volume2 size={s.icon} strokeWidth={2.2} aria-hidden />
    </motion.button>
  );
}
