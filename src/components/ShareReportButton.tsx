import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { PillButton } from './PillButton';
import { db } from '../db/db';
import { dayKey } from '../lib/day';
import { collectReport, reportText } from '../lib/report';
import { reportImage } from '../lib/reportImage';
import { isLearned } from '../lib/srs';
import { EMPTY_STREAK, streakStatus } from '../lib/streak';

type Result = { copied: boolean; text: string } | null;

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * «Поделиться отчётом» (PROJECT.md, раздел 10): системное окно «Поделиться» с текстом и
 * картинкой. Где это не поддерживается — копируем текст, а если и это нельзя, показываем его.
 */
export function ShareReportButton({
  variant = 'secondary',
}: {
  variant?: 'secondary' | 'primary';
}) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result>(null);

  const share = async () => {
    setBusy(true);
    try {
      const [days, words, streak, profile] = await Promise.all([
        db.dailyStats.toArray(),
        db.wordStates.toArray(),
        db.streak.get('streak'),
        db.profile.get('me'),
      ]);
      const today = dayKey();
      const report = collectReport({
        days,
        today,
        name: profile?.name ?? '',
        learned: words.filter((w) => isLearned(w.card)).length,
        streak: streakStatus(streak ?? EMPTY_STREAK, today).current,
        best: streak?.best ?? 0,
      });
      const text = reportText(report);

      if (typeof navigator.share === 'function') {
        const blob = await reportImage(report);
        const files = blob
          ? [new File([blob], 'english-trip-report.png', { type: 'image/png' })]
          : [];
        const data: ShareData = { text };
        if (files.length && navigator.canShare?.({ files })) data.files = files;
        try {
          await navigator.share(data);
          return;
        } catch (e) {
          // Окно закрыли сами — это не ошибка, ничего не показываем
          if (e instanceof DOMException && e.name === 'AbortError') return;
        }
      }
      setResult({ copied: await copyText(text), text });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PillButton variant={variant} fullWidth disabled={busy} onClick={share}>
        <Share2 size={20} aria-hidden /> {busy ? 'Готовлю отчёт…' : 'Поделиться отчётом'}
      </PillButton>
      <BottomSheet
        open={!!result}
        onClose={() => setResult(null)}
        title={result?.copied ? 'Отчёт скопирован' : 'Текст отчёта'}
      >
        <p className="text-base text-muted">
          {result?.copied
            ? 'Вставь его в сообщение в Telegram.'
            : 'Выдели текст и скопируй его в сообщение.'}
        </p>
        <p className="mt-3 rounded-tile bg-bg p-3 text-sm whitespace-pre-line select-text">
          {result?.text}
        </p>
        <PillButton fullWidth className="mt-4" onClick={() => setResult(null)}>
          Понятно
        </PillButton>
      </BottomSheet>
    </>
  );
}
