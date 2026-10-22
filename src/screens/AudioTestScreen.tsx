// Тестовая страница этапа 1: любое слово, пример и реплика на скоростях 0.75–1.25
// с караоке-подсветкой. Открывается из профиля → «Проверка звука».
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ChevronLeft, Pause, Play } from 'lucide-react';
import { Card } from '../components/Card';
import { drillClip, exampleClip, lineClip, pairClips, wordClip, type Clip } from '../content/clips';
import { voices, weeks } from '../content';
import type { Listening, Week } from '../content/schema';
import { loadTimings, play, stop, usePlayer } from '../lib/audio';
import { activeWordIndex, type WordTiming } from '../lib/karaoke';

const SPEEDS = [0.75, 0.9, 1, 1.15, 1.25];

function PlayButton({ c, rate, label }: { c: Clip; rate: number; label: string }) {
  const { id, playing } = usePlayer();
  const active = playing && id === c.id;
  return (
    <button
      type="button"
      onClick={() => (active ? stop() : play(c.id, rate))}
      aria-label={`${active ? 'Остановить' : 'Слушать'}: ${label}`}
      className={`grid size-12 shrink-0 place-items-center rounded-full ${
        active ? 'bg-primary-700 text-white' : 'bg-primary-100 text-primary-700'
      }`}
    >
      {active ? <Pause size={20} aria-hidden /> : <Play size={20} aria-hidden />}
    </button>
  );
}

/** Реплика с подсветкой слова, которое звучит прямо сейчас. */
function KaraokeText({ c, text }: { c: Clip; text: string }) {
  const { id, playing, time } = usePlayer();
  const [timings, setTimings] = useState<WordTiming[] | null>(null);
  useEffect(() => {
    let alive = true;
    loadTimings(c.id).then((t) => alive && setTimings(t));
    return () => {
      alive = false;
    };
  }, [c.id]);

  const active = playing && id === c.id;
  if (!timings) {
    return <span className={active ? 'rounded bg-yellow-soft' : ''}>{text}</span>;
  }
  const current = active ? activeWordIndex(timings, time) : -1;
  return (
    <span>
      {timings.map((t, i) => (
        <span
          key={i}
          className={`-mx-0.5 rounded px-0.5 transition-colors ${i === current ? 'bg-yellow text-ink' : ''}`}
        >
          {t.w}{' '}
        </span>
      ))}
    </span>
  );
}

function ListeningBlock({ week, l, rate }: { week: Week; l: Listening; rate: number }) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <h3 className="text-base font-extrabold">{l.title}</h3>
      {l.lines.map((line, i) => {
        const c = lineClip(voices, week, l, i);
        const name = l.speakers.find((s) => s.id === line.speaker)?.name ?? line.speaker;
        return (
          <div key={i} className="flex items-start gap-3">
            <PlayButton c={c} rate={rate} label={line.text} />
            <div className="min-w-0 pt-1">
              <p className="text-xs font-bold text-muted">
                {name} · <code>{c.voice}</code>
              </p>
              <p className="text-base leading-snug">
                <KaraokeText c={c} text={line.text} />
              </p>
              <p className="text-sm text-muted">{line.ru}</p>
            </div>
          </div>
        );
      })}
    </Card>
  );
}

export function AudioTestScreen() {
  const [weekId, setWeekId] = useState(weeks[0]?.id ?? '');
  const [rate, setRate] = useState(1);
  const week = weeks.find((w) => w.id === weekId);

  useEffect(() => stop, []);

  if (!week) return null;

  return (
    <div className="pt-safe flex flex-col gap-4 px-5">
      <header className="flex items-center gap-2 pt-6">
        <Link
          to="/profile"
          aria-label="Назад"
          className="-ml-3 grid size-12 place-items-center rounded-full"
        >
          <ChevronLeft size={26} aria-hidden />
        </Link>
        <h1 className="text-2xl font-extrabold">Проверка звука</h1>
      </header>

      <div className="sticky top-0 z-10 -mx-5 flex flex-col gap-2 bg-bg/95 px-5 py-2 backdrop-blur">
        <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="Неделя">
          {weeks.map((w) => (
            <button
              key={w.id}
              type="button"
              aria-pressed={w.id === weekId}
              onClick={() => setWeekId(w.id)}
              className={`min-h-12 rounded-full text-sm font-bold ${
                w.id === weekId ? 'bg-ink text-white' : 'bg-surface text-muted'
              }`}
            >
              Нед. {w.n}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5" role="group" aria-label="Скорость">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={s === rate}
              onClick={() => setRate(s)}
              className={`min-h-12 flex-1 rounded-full text-sm font-bold tabular-nums ${
                s === rate ? 'bg-primary-700 text-white' : 'bg-surface text-muted'
              }`}
            >
              {s.toFixed(2).replace(/0$/, '')}×
            </button>
          ))}
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-extrabold">Аудиотексты</h2>
        {week.listenings.map((l) => (
          <ListeningBlock key={l.id} week={week} l={l} rate={rate} />
        ))}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-extrabold">Слова и примеры</h2>
        <Card className="flex flex-col gap-4 p-4">
          {week.words.map((w) => {
            const wc = wordClip(voices, w);
            const ec = exampleClip(voices, w);
            return (
              <div key={w.id} className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <PlayButton c={wc} rate={rate} label={w.en} />
                  <p>
                    <span className="font-bold">{w.en}</span>{' '}
                    <span className="text-muted">— {w.ru}</span>
                  </p>
                </div>
                <div className="flex items-start gap-3 pl-4">
                  <PlayButton c={ec} rate={rate} label={w.example} />
                  <div className="pt-1 text-sm">
                    <p className="text-base">
                      <KaraokeText c={ec} text={w.example} />
                    </p>
                    <p className="text-muted">{w.exampleRu}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </Card>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-extrabold">Минимальные пары</h2>
        <Card className="grid grid-cols-2 gap-3 p-4">
          {week.minimalPairs.flatMap((p) => {
            const { a, b } = pairClips(voices, p);
            return [
              { word: p.a, ruText: p.aRu, c: a },
              { word: p.b, ruText: p.bRu, c: b },
            ].map(({ word, ruText, c }) => (
              <div key={`${p.id}-${word}`} className="flex items-center gap-2">
                <PlayButton c={c} rate={rate} label={word} />
                <p className="min-w-0 leading-tight">
                  <span className="block font-bold">{word}</span>
                  <span className="block text-sm text-muted">{ruText}</span>
                </p>
              </div>
            ));
          })}
        </Card>
      </section>

      <section className="flex flex-col gap-3 pb-6">
        <h2 className="text-xl font-extrabold">Числа</h2>
        <Card className="flex flex-col gap-3 p-4">
          {week.numberDrills.map((d) => {
            const c = drillClip(voices, d);
            return (
              <div key={d.id} className="flex items-start gap-3">
                <PlayButton c={c} rate={rate} label={d.text} />
                <div className="pt-1">
                  <p className="text-base">
                    <KaraokeText c={c} text={d.text} />
                  </p>
                  <p className="text-sm text-muted">
                    {d.promptRu}: <b className="text-ink">{d.answers.join(', ')}</b>
                  </p>
                </div>
              </div>
            );
          })}
        </Card>
      </section>
    </div>
  );
}
