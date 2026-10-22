import { useState } from 'react';
import type { WeekPoint } from '../lib/stats';
import { toPercent } from '../lib/progress';

const W = 320;
const H = 150;
const PAD = { l: 34, r: 14, t: 16, b: 26 };

/**
 * «Точность на слух по неделям» — главный график прогресса. Одна линия 2px,
 * точки 8px с кольцом цвета фона, сетка 0/50/100%, подпись последнего значения.
 */
export function AccuracyLine({ points }: { points: WeekPoint[] }) {
  const [sel, setSel] = useState(points.length - 1);
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const x = (i: number) => PAD.l + (points.length === 1 ? iw / 2 : (i / (points.length - 1)) * iw);
  const y = (v: number) => PAD.t + (1 - v) * ih;
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.accuracy)}`).join(' ');
  const s = points[sel];

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Точность на слух по неделям"
      >
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--color-line)"
              strokeWidth={1}
            />
            <text
              x={PAD.l - 6}
              y={y(v) + 4}
              textAnchor="end"
              fontSize="11"
              fill="var(--color-muted)"
            >
              {v * 100}%
            </text>
          </g>
        ))}
        <path
          d={path}
          fill="none"
          stroke="var(--color-primary-700)"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <g key={p.weekStart} onClick={() => setSel(i)} className="cursor-pointer">
            {/* Зона нажатия больше самой точки */}
            <circle cx={x(i)} cy={y(p.accuracy)} r={16} fill="transparent" />
            <circle
              cx={x(i)}
              cy={y(p.accuracy)}
              r={i === sel ? 6 : 4.5}
              fill="var(--color-primary-700)"
              stroke="var(--color-surface)"
              strokeWidth={2}
            />
            <text x={x(i)} y={H - 6} textAnchor="middle" fontSize="11" fill="var(--color-muted)">
              {p.label}
            </text>
          </g>
        ))}
        {s && (
          <g>
            <rect
              x={Math.min(Math.max(x(sel) - 26, 0), W - 52)}
              y={Math.max(y(s.accuracy) - 32, 0)}
              width={52}
              height={22}
              rx={11}
              fill="var(--color-ink)"
            />
            <text
              x={Math.min(Math.max(x(sel), 26), W - 26)}
              y={Math.max(y(s.accuracy) - 32, 0) + 15}
              textAnchor="middle"
              fontSize="12"
              fontWeight="700"
              fill="#fff"
            >
              {toPercent(s.accuracy)}%
            </text>
          </g>
        )}
      </svg>
      <table className="sr-only">
        <caption>Точность на слух по неделям</caption>
        <tbody>
          {points.map((p) => (
            <tr key={p.weekStart}>
              <th scope="row">Неделя с {p.label}</th>
              <td>
                {toPercent(p.accuracy)}% ({p.answers} ответов)
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
