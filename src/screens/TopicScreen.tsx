// Экран темы в стиле «Lesson Details»: шапка с иллюстрацией и бейджем уровня,
// три пастельные плитки, описание, 7 уроков с галочками и чёрная кнопка «Начать урок».
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { ChevronLeft, CircleCheck, Play, RotateCcw } from 'lucide-react';
import { Icon3D, type Icon3DName } from '../components/Icon3D';
import { PillButton } from '../components/PillButton';
import { Tile } from '../components/Tile';
import { course, getWeek, lessonTitle } from '../content';
import { useCourseProgress } from '../db/courseProgress';

export function TopicScreen() {
  const { weekId = '' } = useParams();
  const navigate = useNavigate();
  const week = getWeek(weekId);
  const progress = useCourseProgress();
  if (!week) return <Navigate to="/course" replace />;

  const month = course.months.find((m) => m.weeks.includes(week.id));
  const open = progress?.isWeekUnlocked(week.id) ?? false;
  const nextLesson = week.lessons.find((l) => !progress?.finished.has(l.id));
  const minutes = week.lessons.length * 20;

  return (
    <>
      <header className="bg-header pt-safe rounded-b-[32px] px-5 pb-10 text-center text-white">
        <div className="flex items-center justify-between pt-3">
          <Link
            to="/course"
            aria-label="Назад к урокам"
            className="grid size-12 place-items-center rounded-full bg-white text-ink"
          >
            <ChevronLeft size={24} aria-hidden />
          </Link>
          <p className="text-base font-semibold">Неделя {week.n}</p>
          <span className="size-12" aria-hidden />
        </div>
        <div className="mx-auto mt-3 grid size-32 place-items-center rounded-full bg-white/90">
          <Icon3D name={week.icon as Icon3DName} size={88} />
        </div>
        {month && (
          <span className="mt-4 inline-block rounded-full bg-primary-700 px-3 py-1 text-sm font-bold ring-2 ring-white/60">
            {month.level}
          </span>
        )}
        <h1 className="mt-2 text-[28px] leading-tight font-extrabold">{week.title}</h1>
      </header>

      <div className="flex flex-col gap-5 px-5 pt-5">
        <div className="grid grid-cols-3 gap-3">
          <Tile
            tone="sky"
            icon={<Icon3D name="book" size={32} />}
            value={week.lessons.length}
            label="уроков"
          />
          <Tile
            tone="peach"
            icon={<Icon3D name="pencil" size={32} />}
            value={week.words.length}
            label="слов"
          />
          <Tile
            tone="lilac"
            icon={<Icon3D name="calendar" size={32} />}
            value={`~${minutes}`}
            label="минут"
          />
        </div>

        <p className="text-base text-muted">{week.description}</p>

        <section aria-labelledby="lessons-title">
          <h2 id="lessons-title" className="mb-3 text-xl font-extrabold">
            Уроки
          </h2>
          <ul className="flex flex-col gap-2.5">
            {week.lessons.map((l) => {
              const done = progress?.finished.has(l.id) ?? false;
              const started = progress?.inProgress.has(l.id) ?? false;
              return (
                <li key={l.id}>
                  <button
                    type="button"
                    disabled={!open}
                    onClick={() => navigate(`/lesson/${l.id}`)}
                    className="flex min-h-16 w-full items-center gap-3 rounded-tile bg-surface px-4 py-3 text-left shadow-soft disabled:opacity-50"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sky-soft text-sm font-extrabold text-sky">
                      {l.day}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-base leading-snug font-bold">
                        {lessonTitle(week, l.day)}
                      </span>
                      <span className="block text-sm text-muted">
                        {done
                          ? 'Пройден — можно перепройти'
                          : started
                            ? 'Начат — продолжить'
                            : '~20 мин'}
                      </span>
                    </span>
                    {done ? (
                      <>
                        <CircleCheck
                          size={24}
                          className="shrink-0 text-success"
                          aria-label="Пройден"
                        />
                        <RotateCcw size={18} className="shrink-0 text-muted" aria-hidden />
                      </>
                    ) : (
                      <Play size={20} className="shrink-0 text-primary-700" aria-hidden />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <PillButton
          fullWidth
          disabled={!open || !nextLesson}
          onClick={() => nextLesson && navigate(`/lesson/${nextLesson.id}`)}
        >
          {!open
            ? 'Тема пока закрыта'
            : nextLesson
              ? `Начать урок ${nextLesson.day}`
              : 'Все уроки пройдены'}
        </PillButton>
      </div>
    </>
  );
}
