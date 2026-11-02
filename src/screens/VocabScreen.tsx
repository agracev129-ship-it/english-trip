// Словарь (PROJECT.md, 5.7): фильтры «Новые / Учу / Выучено / Мои», поиск,
// звук, перевод, прочность памяти, «Повторить сейчас».
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronLeft, Search } from 'lucide-react';
import { Mascot } from '../components/Mascot';
import { PillButton } from '../components/PillButton';
import { SoundButton } from '../components/SoundButton';
import { voices, wordByKey } from '../content';
import { wordClip } from '../content/clips';
import { db, type WordState } from '../db/db';
import { isDue, memoryStrength, wordStatus, type WordStatus } from '../lib/srs';

type Filter = 'all' | WordStatus | 'mine';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'new', label: 'Новые' },
  { id: 'learning', label: 'Учу' },
  { id: 'learned', label: 'Выучено' },
  { id: 'mine', label: 'Мои' },
];

const STATUS_RU: Record<WordStatus, string> = { new: 'новое', learning: 'учу', learned: 'выучено' };

type Row = {
  key: string;
  en: string;
  ru: string;
  clipId: string;
  status: WordStatus;
  strength: number;
  mine: boolean;
  due: boolean;
};

function toRow(w: WordState): Row | null {
  const course = wordByKey(w.key);
  const base = {
    key: w.key,
    status: wordStatus(w.card),
    strength: memoryStrength(w.card),
    mine: w.addedBy === 'user',
    due: isDue(w.card),
  };
  if (course) {
    return {
      ...base,
      en: course.word.en,
      ru: course.word.ru,
      clipId: wordClip(voices, course.word).id,
    };
  }
  if (w.user) return { ...base, en: w.user.en, ru: w.user.contextRu, clipId: w.user.clipId };
  return null;
}

/** Прочность памяти четырьмя делениями. */
function Strength({ value }: { value: number }) {
  const filled = value === 0 ? 0 : Math.max(1, Math.ceil(value * 4));
  return (
    <span className="flex gap-0.5" aria-label={`Прочность памяти: ${filled} из 4`}>
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className={`h-2 w-3 rounded-full ${i < filled ? 'bg-mint' : 'bg-line'}`} />
      ))}
    </span>
  );
}

export function VocabScreen() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const states = useLiveQuery(() => db.wordStates.toArray());

  const rows = useMemo(
    () =>
      (states ?? [])
        .map(toRow)
        .filter((r): r is Row => !!r)
        .sort((a, b) => a.en.localeCompare(b.en)),
    [states],
  );
  const count = (f: Filter) =>
    rows.filter((r) => (f === 'all' ? true : f === 'mine' ? r.mine : r.status === f)).length;
  const q = query.trim().toLowerCase();
  const shown = rows.filter(
    (r) =>
      (filter === 'all' || (filter === 'mine' ? r.mine : r.status === filter)) &&
      (!q || r.en.toLowerCase().includes(q) || r.ru.toLowerCase().includes(q)),
  );
  const due = rows.filter((r) => r.due).length;

  return (
    <div className="pt-safe flex flex-col gap-4 px-5 pb-4">
      <header className="flex items-center gap-2 pt-6">
        <Link
          to="/"
          aria-label="Назад"
          className="-ml-3 grid size-12 place-items-center rounded-full"
        >
          <ChevronLeft size={26} aria-hidden />
        </Link>
        <h1 className="text-[28px] leading-tight font-extrabold">Мой словарь</h1>
      </header>

      <div className="grid grid-cols-3 gap-2 text-center">
        {(['new', 'learning', 'learned'] as const).map((s) => (
          <div key={s} className="rounded-tile bg-surface p-3 shadow-soft">
            <p className="text-2xl font-extrabold tabular-nums">{count(s)}</p>
            <p className="text-xs font-bold text-muted">{FILTERS.find((f) => f.id === s)!.label}</p>
          </div>
        ))}
      </div>

      <PillButton fullWidth disabled={rows.length === 0} onClick={() => navigate('/review')}>
        Повторить сейчас{due ? ` · ${due}` : ''}
      </PillButton>

      <label className="flex min-h-12 items-center gap-2 rounded-full bg-surface px-4 shadow-soft">
        <Search size={20} className="text-muted" aria-hidden />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Найти слово или перевод"
          className="min-h-12 flex-1 bg-transparent text-base outline-none"
          aria-label="Поиск по словарю"
        />
      </label>

      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1" role="group" aria-label="Фильтр">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`min-h-12 shrink-0 rounded-full px-4 text-sm font-bold ${
              filter === f.id ? 'bg-ink text-white' : 'bg-surface text-muted'
            }`}
          >
            {f.label} {count(f.id)}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <Mascot size={120} />
          <p className="text-base font-semibold text-muted">
            Слова появятся здесь после первого урока.
          </p>
        </div>
      ) : shown.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <Mascot state="thinking" size={96} />
          <p className="text-base font-semibold text-muted">Ничего не нашлось.</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {shown.map((r) => (
            <li
              key={r.key}
              className="flex items-center gap-3 rounded-tile bg-surface p-3 shadow-soft"
            >
              <SoundButton clipId={r.clipId} speed={1} label={r.en} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-bold">{r.en}</p>
                <p className="truncate text-sm text-muted">{r.ru}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Strength value={r.strength} />
                <span className="text-xs font-semibold text-muted">
                  {r.mine ? 'моё · ' : ''}
                  {STATUS_RU[r.status]}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
