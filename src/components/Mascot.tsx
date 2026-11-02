// Маскот «Эхо» (PROJECT.md, раздел 4): мягкая круглая фигурка с большими глазами и наушниками.
// Одна картинка на все настроения: меняются глаза, рот и детали вокруг.
// Анимации трансформаций сами отключаются при «уменьшить движение» (MotionConfig в App).
import { motion, type TargetAndTransition, type Transition } from 'motion/react';
import type { MascotState } from '../lib/mascotMessage';

type MascotProps = {
  state?: MascotState;
  size?: number;
  className?: string;
};

const INK = 'var(--color-ink)';
const CENTER = { transformBox: 'fill-box', transformOrigin: 'center' } as const;
const EYES = [78, 122] as const;

/** Движение всей фигурки. */
const BODY: Record<MascotState, { animate: TargetAndTransition; transition: Transition }> = {
  idle: {
    animate: { y: [0, -2, 0] },
    transition: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
  },
  happy: {
    animate: { y: [0, -12, 0, -5, 0] },
    transition: { duration: 0.7, ease: 'easeOut' },
  },
  sad: { animate: { rotate: [0, -5, -3] }, transition: { duration: 0.5, ease: 'easeOut' } },
  fire: {
    animate: { y: [0, -3, 0] },
    transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
  },
  sleepy: {
    animate: { rotate: [-3, 2, -3] },
    transition: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' },
  },
  celebrate: {
    animate: { y: [0, -14, 0], rotate: [-4, 4, -4] },
    transition: { duration: 0.9, repeat: Infinity, ease: 'easeInOut' },
  },
  thinking: {
    animate: { rotate: [0, 3, 0] },
    transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
  },
};

function OpenEyes({
  look = { x: 0, y: 0 },
  blink = false,
}: {
  look?: { x: number; y: number };
  blink?: boolean;
}) {
  return (
    <>
      {EYES.map((cx) => (
        <motion.g
          key={cx}
          style={CENTER}
          animate={blink ? { scaleY: [1, 1, 0.08, 1, 1] } : undefined}
          transition={
            blink ? { duration: 4, times: [0, 0.92, 0.95, 0.98, 1], repeat: Infinity } : undefined
          }
        >
          <ellipse cx={cx} cy={108} rx={10} ry={14} fill={INK} />
          <circle cx={cx + 3 + look.x} cy={102 + look.y} r={3.5} fill="#fff" />
        </motion.g>
      ))}
    </>
  );
}

/** Глаза-дуги: радость (вверх) или сон (вниз). */
function ArcEyes({ up }: { up: boolean }) {
  return (
    <>
      {EYES.map((cx) => (
        <path
          key={cx}
          d={`M${cx - 11} 110 Q${cx} ${up ? 94 : 118} ${cx + 11} 110`}
          fill="none"
          stroke={INK}
          strokeWidth={5.5}
          strokeLinecap="round"
        />
      ))}
    </>
  );
}

function Brows({ inner }: { inner: 'up' | 'down' }) {
  const [a, b] = inner === 'up' ? [93, 86] : [86, 92];
  return (
    <g stroke={INK} strokeWidth={5} strokeLinecap="round">
      <line x1={66} y1={a} x2={88} y2={b} />
      <line x1={134} y1={a} x2={112} y2={b} />
    </g>
  );
}

function Face({ state }: { state: MascotState }) {
  const smile = (
    <path
      d="M88 131 Q100 143 112 131"
      fill="none"
      stroke={INK}
      strokeWidth={5}
      strokeLinecap="round"
    />
  );
  const bigSmile = (
    <g>
      <path d="M82 127 Q100 133 118 127 Q116 152 100 152 Q84 152 82 127 Z" fill={INK} />
      <ellipse cx={100} cy={146} rx={9} ry={5} fill="var(--color-pink)" />
    </g>
  );
  switch (state) {
    case 'idle':
      return (
        <>
          <OpenEyes blink />
          {smile}
        </>
      );
    case 'happy':
      return (
        <>
          <ArcEyes up />
          {bigSmile}
        </>
      );
    case 'sad':
      return (
        <>
          <OpenEyes look={{ x: -2, y: 6 }} />
          <Brows inner="up" />
          <path
            d="M90 141 Q100 132 110 141"
            fill="none"
            stroke={INK}
            strokeWidth={5}
            strokeLinecap="round"
          />
        </>
      );
    case 'fire':
      return (
        <>
          <OpenEyes />
          <Brows inner="down" />
          {smile}
        </>
      );
    case 'sleepy':
      return (
        <>
          <ArcEyes up={false} />
          <ellipse cx={100} cy={136} rx={5} ry={4} fill={INK} />
        </>
      );
    case 'celebrate':
      return (
        <>
          <ArcEyes up />
          {bigSmile}
        </>
      );
    case 'thinking':
      return (
        <>
          <OpenEyes look={{ x: 2, y: -2 }} />
          <path
            d="M92 136 Q102 131 110 136"
            fill="none"
            stroke={INK}
            strokeWidth={5}
            strokeLinecap="round"
          />
        </>
      );
  }
}

/** Детали вокруг фигурки. */
function Extras({ state }: { state: MascotState }) {
  if (state === 'fire') {
    return (
      <motion.g
        style={{ transformBox: 'fill-box', transformOrigin: 'bottom center' }}
        animate={{ scaleY: [1, 1.12, 0.96, 1], scaleX: [1, 0.95, 1.04, 1] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path
          d="M100 2 C113 17 123 26 118 40 C114 50 86 50 82 40 C78 29 88 24 91 15 C94 22 98 21 100 2 Z"
          fill="var(--color-peach)"
        />
        <path
          d="M100 22 C106 29 111 33 108 40 C106 45 94 45 92 40 C90 34 97 31 100 22 Z"
          fill="var(--color-yellow)"
        />
      </motion.g>
    );
  }
  if (state === 'sleepy') {
    return (
      <g fill="var(--color-primary-700)" fontWeight={800} fontFamily="inherit">
        {[
          { x: 156, y: 42, s: 26, d: 0 },
          { x: 176, y: 22, s: 18, d: 0.7 },
        ].map((z) => (
          <motion.text
            key={z.x}
            x={z.x}
            y={z.y}
            fontSize={z.s}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: z.d }}
          >
            z
          </motion.text>
        ))}
      </g>
    );
  }
  if (state === 'thinking') {
    return (
      <g fill="var(--color-primary-700)">
        {[150, 166, 182].map((cx, i) => (
          <motion.circle
            key={cx}
            cx={cx}
            cy={30}
            r={5}
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </g>
    );
  }
  if (state === 'celebrate') {
    const bits = [
      { x: 14, y: 40, c: 'var(--color-yellow)' },
      { x: 180, y: 34, c: 'var(--color-pink)' },
      { x: 30, y: 14, c: 'var(--color-sky)' },
      { x: 160, y: 10, c: 'var(--color-mint)' },
      { x: 8, y: 92, c: 'var(--color-peach)' },
      { x: 186, y: 88, c: 'var(--color-primary)' },
    ];
    return (
      <g>
        {bits.map((b, i) => (
          <motion.rect
            key={i}
            x={b.x}
            y={b.y}
            width={9}
            height={9}
            rx={2}
            fill={b.c}
            style={CENTER}
            animate={{ scale: [0.6, 1.15, 0.6], rotate: [0, 90, 180] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.12 }}
          />
        ))}
      </g>
    );
  }
  return null;
}

export function Mascot({ state = 'idle', size = 96, className = '' }: MascotProps) {
  const body = BODY[state];
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={`shrink-0 overflow-visible ${className}`}
      aria-hidden
    >
      <Extras state={state} />
      <motion.g key={state} style={CENTER} animate={body.animate} transition={body.transition}>
        <path
          d="M36 112 A64 64 0 0 1 164 112"
          fill="none"
          stroke={INK}
          strokeWidth={12}
          strokeLinecap="round"
        />
        <circle
          cx={100}
          cy={118}
          r={62}
          fill="var(--color-surface)"
          stroke="var(--color-primary-100)"
          strokeWidth={3}
        />
        <rect x={22} y={92} width={28} height={52} rx={14} fill={INK} />
        <rect x={150} y={92} width={28} height={52} rx={14} fill={INK} />
        <rect x={29} y={102} width={10} height={22} rx={5} fill="var(--color-primary)" />
        <rect x={161} y={102} width={10} height={22} rx={5} fill="var(--color-primary)" />
        <circle cx={62} cy={132} r={8} fill="var(--color-pink-soft)" />
        <circle cx={138} cy={132} r={8} fill="var(--color-pink-soft)" />
        <Face state={state} />
      </motion.g>
    </svg>
  );
}
