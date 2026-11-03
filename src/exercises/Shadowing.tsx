import { useEffect, useRef, useState } from 'react';
import { Mic, Play, Square } from 'lucide-react';
import { AnswerBar } from '../components/AnswerBar';
import { Card } from '../components/Card';
import { PillButton } from '../components/PillButton';
import { SoundButton } from '../components/SoundButton';
import { voices } from '../content';
import { lineClip } from '../content/clips';
import { play, stop } from '../lib/audio';
import { buzz } from '../lib/haptics';
import { canRecordAudio, recordingMime } from '../lib/recording';
import type { ExerciseProps } from './types';

const MAX_RECORD_MS = 12_000;

type Phase = 'idle' | 'recording' | 'recorded' | 'comparing' | 'denied' | 'rated';

/**
 * №14 Прослушать фразу → записать себя → проиграть подряд «диктор, я» → оценить самой.
 * Запись живёт только в памяти этого экрана и никуда не отправляется.
 */
export function Shadowing({ item, week, speed, report, done }: ExerciseProps<'shadowing'>) {
  const [phase, setPhase] = useState<Phase>(canRecordAudio() ? 'idle' : 'denied');
  const [good, setGood] = useState<boolean | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const recording = useRef<string | null>(null);
  const player = useRef<HTMLAudioElement | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const listening = week.listenings.find((l) => l.id === item.listening);
  const line = listening?.lines[item.line];

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      if (recorder.current?.state === 'recording') recorder.current.stop();
      player.current?.pause();
      if (recording.current) URL.revokeObjectURL(recording.current);
    },
    [],
  );

  if (!listening || !line) return null;
  const clip = lineClip(voices, week, listening, item.line);

  const startRecording = async () => {
    stop();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = recordingMime();
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = () => {
        // Микрофон отпускаем сразу, чтобы значок записи в телефоне погас
        for (const t of stream.getTracks()) t.stop();
        if (recording.current) URL.revokeObjectURL(recording.current);
        recording.current = URL.createObjectURL(new Blob(chunks, { type: rec.mimeType }));
        setPhase('recorded');
      };
      rec.start();
      recorder.current = rec;
      setPhase('recording');
      timer.current = window.setTimeout(() => {
        if (rec.state === 'recording') rec.stop();
      }, MAX_RECORD_MS);
    } catch {
      setPhase('denied');
    }
  };

  const stopRecording = () => {
    window.clearTimeout(timer.current);
    if (recorder.current?.state === 'recording') recorder.current.stop();
  };

  const compare = async () => {
    if (!recording.current) return;
    setPhase('comparing');
    await play(clip.id, speed);
    await new Promise((r) => setTimeout(r, 300));
    await new Promise<void>((resolve) => {
      const a = new Audio(recording.current!);
      player.current = a;
      a.onended = () => resolve();
      a.onerror = () => resolve();
      a.play().catch(() => resolve());
    });
    setPhase('recorded');
  };

  const rate = (ok: boolean) => {
    setGood(ok);
    setPhase('rated');
    buzz('correct');
    report({
      correct: ok,
      skill: 'speaking',
      itemIds: [`${week.id}/${listening.id}#${item.line}`],
    });
  };

  return (
    <>
      <div className="flex flex-col items-center gap-5 pt-4 text-center">
        <p className="text-lg font-extrabold">Повтори за диктором</p>
        <Card className="flex w-full items-start gap-3 text-left">
          <SoundButton clipId={clip.id} speed={speed} label={line.text} autoPlay />
          <div>
            <p className="text-lg font-bold">{line.text}</p>
            <p className="text-sm text-muted">{line.ru}</p>
          </div>
        </Card>

        {phase === 'denied' && (
          <p className="rounded-tile bg-yellow-soft p-4 text-base font-semibold">
            Запись недоступна: нет разрешения на микрофон. Просто повтори фразу вслух несколько раз.
          </p>
        )}
        {(phase === 'idle' || phase === 'recorded') && (
          <PillButton
            variant={phase === 'idle' ? 'primary' : 'secondary'}
            fullWidth
            onClick={startRecording}
          >
            <Mic size={20} aria-hidden /> {phase === 'idle' ? 'Записать себя' : 'Записать ещё раз'}
          </PillButton>
        )}
        {phase === 'recording' && (
          <button
            type="button"
            onClick={stopRecording}
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-error-soft text-base font-bold text-error-ink"
          >
            <Square size={18} fill="currentColor" aria-hidden /> Идёт запись… Стоп
          </button>
        )}
        {phase === 'recorded' && (
          <>
            <PillButton variant="primary" fullWidth onClick={compare}>
              <Play size={20} aria-hidden /> Сравнить: диктор, потом я
            </PillButton>
            <p className="mt-1 text-base font-bold">Как получилось?</p>
            <div className="grid w-full grid-cols-2 gap-3">
              <PillButton variant="secondary" onClick={() => rate(true)}>
                Похоже
              </PillButton>
              <PillButton variant="secondary" onClick={() => rate(false)}>
                Не очень
              </PillButton>
            </div>
          </>
        )}
        {phase === 'comparing' && (
          <p className="text-base font-semibold text-muted">Сначала диктор, потом твоя запись…</p>
        )}
        {phase === 'rated' && (
          <p className="text-base font-semibold text-muted">
            {good
              ? 'Отлично! Так и тренируется произношение.'
              : 'Ничего страшного: с каждым разом будет ближе.'}
          </p>
        )}
      </div>
      {(phase === 'rated' || phase === 'denied') && <AnswerBar status="idle" onNext={done} />}
    </>
  );
}
