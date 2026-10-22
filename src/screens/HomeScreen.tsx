import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { CircleCheck, Circle } from 'lucide-react';
import { BottomSheet } from '../components/BottomSheet';
import { Card } from '../components/Card';
import { ComingSoonSheet } from '../components/ComingSoonSheet';
import { Icon3D, type Icon3DName } from '../components/Icon3D';
import { PillButton } from '../components/PillButton';
import { ProgressRing } from '../components/ProgressRing';
import { SKILL_TONE, TONE_ACCENT_VAR } from '../components/tones';
import { lessonTitle, voices, weeks } from '../content';
import { uniqueClips, weekClips } from '../content/clips';
import { db } from '../db/db';
import { useCourseProgress } from '../db/courseProgress';
import { markNameAsked, setName } from '../db/progress';
import { preload } from '../lib/audio';
import { dayKey } from '../lib/day';
import { lessonBlocks } from '../lib/lessonBlocks';
import { toPercent } from '../lib/progress';
import { isLearned } from '../lib/srs';
import { streakStatus, EMPTY_STREAK } from '../lib/streak';

const SKILLS: { key: keyof typeof SKILL_TONE; title: string; icon: Icon3DName }[] = [
  { key: 'listening', title: 'Аудирование', icon: 'headphone' },
  { key: 'vocab', title: 'Слова', icon: 'book' },
  { key: 'speaking', title: 'Речь', icon: 'microphone' },
  { key: 'grammar', title: 'Грамматика', icon: 'pencil' },
];

const TOTAL_WORDS = weeks.reduce((n, w) => n + w.words.length, 0);
const preloaded = new Set<string>();

export function HomeScreen() {
  const navigate = useNavigate();
  const [soon, setSoon] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState('');
  const profile = useLiveQuery(() => db.profile.get('me'));
  const streak = useLiveQuery(() => db.streak.get('streak'));
  const days = useLiveQuery(() => db.dailyStats.toArray());
  const learned = useLiveQuery(
    async () =>
      (await db.wordStates.where('addedBy').equals('course').toArray()).filter((w) =>
        isLearned(w.card),
      ).length,
  );
  const progress = useCourseProgress();

  const next = progress?.next;
  const run = next ? progress?.inProgress.get(next.plan.id) : undefined;

  // Звук текущей недели заранее — чтобы урок шёл и без интернета
  useEffect(() => {
    if (!next || preloaded.has(next.week.id) || !navigator.onLine) return;
    preloaded.add(next.week.id);
    const ids = uniqueClips(weekClips(voices, next.week)).map((c) => c.id);
    const t = setTimeout(() => void preload(ids), 1500);
    return () => clearTimeout(t);
  }, [next]);

  const st = streakStatus(streak ?? EMPTY_STREAK, dayKey());
  const name = profile?.name;
  const listen = (days ?? []).reduce(
    (a, d) => ({ t: a.t + d.listenTotalNormal, c: a.c + d.listenCorrectNormal }),
    { t: 0, c: 0 },
  );
  const skillValue = {
    listening: listen.t ? listen.c / listen.t : 0,
    vocab: TOTAL_WORDS ? (learned ?? 0) / TOTAL_WORDS : 0,
    speaking: 0,
    grammar: 0,
  };
  const skillLabel = {
    listening: listen.t ? `точность ${toPercent(skillValue.listening)}%` : 'ещё нет ответов',
    vocab: `выучено ${learned ?? 0} из ${TOTAL_WORDS}`,
    speaking: 'с этапа 3',
    grammar: 'с этапа 3',
  };

  return (
    <>
      <header className="bg-header pt-safe rounded-b-[32px] px-5 pb-14 text-white">
        <div className="flex items-center justify-between pt-5">
          <p className="text-base font-semibold">{name ? `Привет, ${name}!` : 'Привет!'}</p>
          <div
            className={`flex items-center gap-1 rounded-full py-1 pr-3 pl-1.5 ${
              st.atRisk ? 'bg-yellow text-ink' : 'bg-white/20'
            }`}
            aria-label={`Стрик: ${st.current}`}
          >
            <Icon3D name="fire" size={28} />
            <span className="text-base font-extrabold tabular-nums">{st.current}</span>
          </div>
        </div>
        <h1 className="mt-4 text-[32px] leading-[1.1] font-extrabold">
          {st.doneToday ? 'Сегодня ты молодец!' : 'Слушаем английский каждый день'}
        </h1>
        {st.atRisk && (
          <p className="mt-2 text-base font-semibold">🔥 Стрик под угрозой — пройди урок сегодня</p>
        )}
      </header>

      <div className="-mt-8 flex flex-col gap-4 px-5">
        {progress && next && (
          <Card>
            {progress.doneToday && (
              <p className="mb-3 flex items-center gap-2 rounded-chip bg-success-soft px-3 py-2 text-sm font-bold text-success-ink">
                <CircleCheck size={18} aria-hidden /> Урок на сегодня пройден. Можно ещё один!
              </p>
            )}
            <div className="flex items-center gap-4">
              <div className="grid size-16 shrink-0 place-items-center rounded-tile bg-sky-soft">
                <Icon3D name={next.week.icon as Icon3DName} size={44} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-muted">
                  {progress.doneToday ? 'Следующий урок' : 'Урок на сегодня'} · ~20 мин
                </p>
                <h2 className="text-xl leading-tight font-extrabold">
                  {lessonTitle(next.week, next.plan.day)}
                </h2>
                <p className="text-sm font-semibold text-muted">
                  {next.week.title} · день {next.plan.day} из 7
                </p>
              </div>
            </div>

            <ul className="mt-5 flex flex-col gap-3">
              {lessonBlocks(next.plan, run).map((b) => (
                <li key={b.id} className="flex items-center gap-3 text-base font-semibold">
                  {b.done ? (
                    <CircleCheck size={20} className="text-success" aria-label="пройдено" />
                  ) : (
                    <Circle size={20} className="text-line" strokeWidth={2.5} aria-hidden />
                  )}
                  <span className={b.done ? 'text-muted line-through' : ''}>{b.label}</span>
                </li>
              ))}
            </ul>

            <PillButton
              fullWidth
              className="mt-5"
              onClick={() => navigate(`/lesson/${next.plan.id}`)}
            >
              {run ? 'Продолжить' : 'Начать'}
            </PillButton>
          </Card>
        )}
        {progress && !next && (
          <Card className="text-center">
            <Icon3D name="trophy" size={64} className="mx-auto" />
            <h2 className="mt-2 text-xl font-extrabold">Месяц пройден целиком!</h2>
            <p className="text-muted">Скоро здесь появится контрольная и следующий месяц.</p>
          </Card>
        )}

        <section aria-labelledby="skills-title">
          <h2 id="skills-title" className="mt-2 mb-3 text-xl font-extrabold">
            Навыки
          </h2>
          <ul className="grid grid-cols-2 gap-3">
            {SKILLS.map(({ key, title, icon }) => (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => setSoon(`Тренировка «${title}»`)}
                  className="flex w-full flex-col items-start gap-4 rounded-card bg-surface p-4 text-left shadow-soft"
                >
                  <ProgressRing
                    value={skillValue[key]}
                    color={TONE_ACCENT_VAR[SKILL_TONE[key]]}
                    label={title}
                  >
                    <Icon3D name={icon} size={36} />
                  </ProgressRing>
                  <span>
                    <span className="block text-base font-bold">{title}</span>
                    <span className="block text-sm font-semibold text-muted">
                      {skillLabel[key]}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <ComingSoonSheet feature={soon} onClose={() => setSoon(null)} />

      <BottomSheet
        open={!!profile && !profile.askedName}
        onClose={() => void markNameAsked()}
        title="Как тебя зовут?"
      >
        <p className="text-base text-muted">
          Имя нужно только для приветствия и хранится лишь в этом телефоне.
        </p>
        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (nameDraft.trim()) void setName(nameDraft);
          }}
        >
          <input
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            placeholder="Имя"
            autoComplete="given-name"
            maxLength={30}
            className="min-h-14 rounded-tile bg-bg px-4 text-lg font-semibold ring-2 outline-none ring-line ring-inset focus:ring-primary-700"
          />
          <PillButton type="submit" fullWidth disabled={!nameDraft.trim()}>
            Сохранить
          </PillButton>
          <PillButton variant="secondary" fullWidth onClick={() => void markNameAsked()}>
            Пропустить
          </PillButton>
        </form>
      </BottomSheet>
    </>
  );
}
