// Профиль (PROJECT.md, 5.9): имя, уровень-город, тесты EF SET, настройки,
// резервная копия, сброс прогресса с двойным подтверждением на странице.
import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  BookOpen,
  ChevronRight,
  Download,
  Headphones,
  Pencil,
  RotateCcw,
  Share2,
  Upload,
} from 'lucide-react';
import { BottomSheet } from '../components/BottomSheet';
import { Card } from '../components/Card';
import { PillButton } from '../components/PillButton';
import { db, type Settings } from '../db/db';
import {
  backupFileName,
  BackupError,
  exportBackup,
  importBackup,
  markBackupDone,
  parseBackup,
  resetProgress,
  type BackupFile,
} from '../db/backup';
import { setName } from '../db/progress';
import { dayKey } from '../lib/day';
import { levelInfo } from '../lib/xp';

const SLOW_SPEEDS = [0.6, 0.75, 0.9];

const fmtDate = (key: string) => key.split('-').reverse().join('.');

function Toggle({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${on ? 'bg-primary-700' : 'bg-line'}`}
    >
      <span
        className={`absolute top-1 size-6 rounded-full bg-white shadow transition-all ${on ? 'left-7' : 'left-1'}`}
      />
    </button>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-bold text-muted">
      {label}
      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 3))}
        placeholder="0–100"
        className="min-h-14 rounded-tile bg-bg px-3 text-center text-xl font-extrabold text-ink ring-2 ring-line outline-none ring-inset focus:ring-primary-700"
      />
    </label>
  );
}

export function ProfileScreen() {
  const profile = useLiveQuery(() => db.profile.get('me'));
  const tests = useLiveQuery(() => db.tests.where('kind').equals('efset').sortBy('date')) ?? [];
  const totalXp =
    useLiveQuery(async () => (await db.dailyStats.toArray()).reduce((s, d) => s + d.xp, 0)) ?? 0;

  const [nameOpen, setNameOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [efsetOpen, setEfsetOpen] = useState(false);
  const [ef, setEf] = useState({ date: dayKey(), total: '', listening: '', reading: '' });
  const [restore, setRestore] = useState<BackupFile | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0);
  const fileInput = useRef<HTMLInputElement>(null);

  const level = levelInfo(totalXp);
  const settings = profile?.settings;
  const updateSettings = (patch: Partial<Settings>) =>
    settings && db.profile.update('me', { settings: { ...settings, ...patch } });

  const backupBlob = async () =>
    new Blob([JSON.stringify(await exportBackup())], { type: 'application/json' });

  const download = async () => {
    const url = URL.createObjectURL(await backupBlob());
    const a = document.createElement('a');
    a.href = url;
    a.download = backupFileName();
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    await markBackupDone();
    setMessage('Файл сохранён в «Загрузки». Его можно переслать себе в Telegram.');
  };

  const canShareFiles =
    typeof navigator !== 'undefined' &&
    !!navigator.canShare?.({ files: [new File([], 'x.json', { type: 'application/json' })] });
  const share = async () => {
    const file = new File([await backupBlob()], backupFileName(), { type: 'application/json' });
    try {
      await navigator.share({ files: [file], title: 'Резервная копия English Trip' });
      await markBackupDone();
      setMessage('Копия отправлена.');
    } catch {
      // Окно «Поделиться» закрыли — ничего не делаем
    }
  };

  const pickFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      setRestore(parseBackup(await f.text()));
    } catch (e) {
      console.error('Не удалось прочитать файл копии', e);
      setMessage(e instanceof BackupError ? e.message : 'Не удалось прочитать файл.');
    }
    if (fileInput.current) fileInput.current.value = '';
  };

  const saveEfset = async () => {
    const n = (v: string) => (v === '' ? undefined : Math.min(100, Number(v)));
    await db.tests.put({
      id: `efset-${Date.now()}`,
      kind: 'efset',
      date: ef.date,
      total: n(ef.total),
      listening: n(ef.listening),
      reading: n(ef.reading),
    });
    setEfsetOpen(false);
    setEf({ date: dayKey(), total: '', listening: '', reading: '' });
  };

  const lastBackup = profile?.lastBackupAt
    ? fmtDate(dayKey(new Date(profile.lastBackupAt)))
    : 'ещё не было';

  return (
    <div className="pt-safe flex flex-col gap-4 px-5 pb-4">
      <header className="flex flex-col items-center pt-10 pb-2 text-center">
        <img
          src={`${import.meta.env.BASE_URL}logo.svg`}
          alt=""
          width={112}
          height={112}
          className="rounded-full bg-lilac-soft p-3 ring-4 ring-surface"
        />
        <button
          type="button"
          onClick={() => {
            setNameDraft(profile?.name ?? '');
            setNameOpen(true);
          }}
          className="mt-3 flex min-h-12 items-center gap-2 text-2xl font-extrabold"
        >
          {profile?.name || 'Как тебя зовут?'}
          <Pencil size={18} className="text-muted" aria-label="Изменить имя" />
        </button>
        <p className="text-sm font-semibold text-muted">
          Уровень {level.level} · {level.city}
        </p>
        <div className="mt-2 h-2.5 w-48 overflow-hidden rounded-full bg-line" aria-hidden>
          <div
            className="h-full rounded-full bg-primary-700"
            style={{ width: `${(level.into / level.needed) * 100}%` }}
          />
        </div>
        <p className="mt-1 text-xs font-semibold text-muted tabular-nums">
          {level.into} / {level.needed} XP до города «{level.nextCity}»
        </p>
      </header>

      <Card className="p-2">
        <Link
          to="/vocab"
          className="flex min-h-14 items-center gap-3 rounded-tile px-3 text-base font-semibold"
        >
          <BookOpen size={22} className="text-primary-700" aria-hidden />
          <span className="flex-1">Мой словарь</span>
          <ChevronRight size={20} className="text-muted" aria-hidden />
        </Link>
        <Link
          to="/dev/audio"
          className="flex min-h-14 items-center gap-3 rounded-tile px-3 text-base font-semibold"
        >
          <Headphones size={22} className="text-primary-700" aria-hidden />
          <span className="flex-1">Проверка звука</span>
          <ChevronRight size={20} className="text-muted" aria-hidden />
        </Link>
      </Card>

      <Card>
        <h2 className="text-lg font-extrabold">Результаты EF SET</h2>
        <ul className="mt-2 flex flex-col divide-y divide-line">
          {tests.map((t) => (
            <li key={t.id} className="flex flex-col gap-0.5 py-2.5">
              <span className="text-sm">
                <b>{fmtDate(t.date)}</b>
                {t.id === 'efset-start' && <span className="text-muted"> · стартовый</span>}
              </span>
              <span className="text-sm text-muted tabular-nums">
                общий <b className="text-ink">{t.total ?? '—'}</b> · слух{' '}
                <b className="text-ink">{t.listening ?? '—'}</b> · чтение{' '}
                <b className="text-ink">{t.reading ?? '—'}</b>
              </span>
            </li>
          ))}
        </ul>
        <PillButton
          variant="secondary"
          fullWidth
          className="mt-3"
          onClick={() => setEfsetOpen(true)}
        >
          Добавить результат EF SET
        </PillButton>
        <p className="mt-2 text-center text-xs text-muted">
          Пересдавать каждые 3 месяца на efset.org — бесплатно, 50 минут.
        </p>
      </Card>

      {settings && (
        <Card>
          <h2 className="text-lg font-extrabold">Настройки</h2>
          <p className="mt-3 text-sm font-bold text-muted">Скорость «улитки»</p>
          <div className="mt-2 grid grid-cols-3 gap-2" role="group" aria-label="Скорость улитки">
            {SLOW_SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={settings.slowSpeed === s}
                onClick={() => updateSettings({ slowSpeed: s })}
                className={`min-h-12 rounded-full text-sm font-bold tabular-nums ${
                  settings.slowSpeed === s ? 'bg-ink text-white' : 'bg-bg text-muted'
                }`}
              >
                {s}×
              </button>
            ))}
          </div>
          <div className="mt-4 flex min-h-12 items-center justify-between gap-3">
            <span className="text-base font-semibold">Вибрация при ответе</span>
            <Toggle
              on={settings.haptics}
              onChange={(v) => updateSettings({ haptics: v })}
              label="Вибрация"
            />
          </div>
          <p className="mt-1 text-xs text-muted">
            Звуки интерфейса и напоминания появятся на следующих этапах.
          </p>
        </Card>
      )}

      <Card id="backup">
        <h2 className="text-lg font-extrabold">Резервная копия</h2>
        <p className="mt-1 text-sm text-muted">
          Весь прогресс хранится только в этом телефоне. Копия — это файл, из которого его можно
          вернуть на новом телефоне или после сброса. Последняя копия:{' '}
          <b className="text-ink">{lastBackup}</b>.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {canShareFiles && (
            <PillButton variant="primary" fullWidth onClick={share}>
              <Share2 size={20} aria-hidden /> Отправить копию (Telegram и др.)
            </PillButton>
          )}
          <PillButton
            variant={canShareFiles ? 'secondary' : 'primary'}
            fullWidth
            onClick={download}
          >
            <Download size={20} aria-hidden /> Сохранить в файл
          </PillButton>
          <PillButton variant="secondary" fullWidth onClick={() => fileInput.current?.click()}>
            <Upload size={20} aria-hidden /> Восстановить из файла
          </PillButton>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => void pickFile(e.target.files?.[0])}
          />
        </div>
      </Card>

      <button
        type="button"
        onClick={() => setResetStep(1)}
        className="flex min-h-14 items-center justify-center gap-2 rounded-card text-base font-semibold text-error-ink"
      >
        <RotateCcw size={20} aria-hidden /> Сбросить прогресс
      </button>

      <p className="pb-4 text-center text-xs font-semibold text-muted">
        English Trip · версия 0.4 · этап 2, часть 2
      </p>

      {/* Имя */}
      <BottomSheet open={nameOpen} onClose={() => setNameOpen(false)} title="Как тебя зовут?">
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            void setName(nameDraft).then(() => setNameOpen(false));
          }}
        >
          <input
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            maxLength={30}
            autoComplete="given-name"
            placeholder="Имя"
            className="min-h-14 rounded-tile bg-bg px-4 text-lg font-semibold ring-2 ring-line outline-none ring-inset focus:ring-primary-700"
          />
          <PillButton type="submit" fullWidth>
            Сохранить
          </PillButton>
        </form>
      </BottomSheet>

      {/* EF SET */}
      <BottomSheet open={efsetOpen} onClose={() => setEfsetOpen(false)} title="Результат EF SET">
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-bold text-muted">
            Дата теста
            <input
              type="date"
              value={ef.date}
              max={dayKey()}
              onChange={(e) => setEf((p) => ({ ...p, date: e.target.value }))}
              className="min-h-14 rounded-tile bg-bg px-3 text-base font-semibold text-ink ring-2 ring-line outline-none ring-inset"
            />
          </label>
          <div className="grid grid-cols-3 gap-2">
            <NumberField
              label="Общий"
              value={ef.total}
              onChange={(v) => setEf((p) => ({ ...p, total: v }))}
            />
            <NumberField
              label="Слух"
              value={ef.listening}
              onChange={(v) => setEf((p) => ({ ...p, listening: v }))}
            />
            <NumberField
              label="Чтение"
              value={ef.reading}
              onChange={(v) => setEf((p) => ({ ...p, reading: v }))}
            />
          </div>
          <PillButton
            fullWidth
            disabled={!ef.date || (!ef.total && !ef.listening)}
            onClick={saveEfset}
          >
            Сохранить результат
          </PillButton>
        </div>
      </BottomSheet>

      {/* Восстановление */}
      <BottomSheet open={!!restore} onClose={() => setRestore(null)} title="Восстановить прогресс?">
        {restore && (
          <div className="flex flex-col gap-3">
            <p className="text-base text-muted">
              Копия от{' '}
              <b className="text-ink">{new Date(restore.exportedAt).toLocaleDateString('ru-RU')}</b>
              : слов — {restore.tables.wordStates?.length ?? 0}, уроков —{' '}
              {restore.tables.lessonRuns?.length ?? 0}. Текущий прогресс в телефоне будет заменён
              этой копией.
            </p>
            <PillButton
              fullWidth
              onClick={async () => {
                await importBackup(restore);
                setRestore(null);
                setMessage('Прогресс восстановлен из копии.');
              }}
            >
              Заменить прогресс
            </PillButton>
            <PillButton variant="secondary" fullWidth onClick={() => setRestore(null)}>
              Отмена
            </PillButton>
          </div>
        )}
      </BottomSheet>

      {/* Сброс: два шага подтверждения */}
      <BottomSheet
        open={resetStep > 0}
        onClose={() => setResetStep(0)}
        title={resetStep === 1 ? 'Сбросить весь прогресс?' : 'Точно удалить?'}
      >
        {resetStep === 1 ? (
          <div className="flex flex-col gap-3">
            <p className="text-base text-muted">
              Удалятся уроки, слова, стрик и статистика. Если хочешь их сохранить — сначала сделай
              резервную копию.
            </p>
            <PillButton fullWidth onClick={() => setResetStep(0)}>
              Не сбрасывать
            </PillButton>
            <PillButton variant="secondary" fullWidth onClick={() => setResetStep(2)}>
              Да, сбросить
            </PillButton>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-base font-semibold text-error-ink">
              Это нельзя отменить. Прогресс вернуть можно только из резервной копии.
            </p>
            <PillButton fullWidth onClick={() => setResetStep(0)}>
              Отмена
            </PillButton>
            <button
              type="button"
              onClick={async () => {
                await resetProgress();
                setResetStep(0);
                setMessage('Прогресс сброшен.');
              }}
              className="min-h-14 rounded-full bg-error-soft text-base font-bold text-error-ink"
            >
              Удалить навсегда
            </button>
          </div>
        )}
      </BottomSheet>

      <BottomSheet open={!!message} onClose={() => setMessage(null)} title="Готово">
        <p className="text-base text-muted">{message}</p>
        <PillButton fullWidth className="mt-4" onClick={() => setMessage(null)}>
          Понятно
        </PillButton>
      </BottomSheet>
    </div>
  );
}
