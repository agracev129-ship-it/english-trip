import { useState } from 'react';
import { Copy, ExternalLink } from 'lucide-react';
import { AnswerBar } from '../components/AnswerBar';
import { Card } from '../components/Card';
import { PillButton } from '../components/PillButton';
import type { ExerciseProps } from './types';

/** №19 Бонус: готовый промпт для голосового режима бесплатного Claude или ChatGPT. */
export function AiConversation({ week, done }: ExerciseProps<'ai_conversation'>) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(week.aiPrompt);
    } catch {
      // Старый способ, если clipboard API недоступен
      const ta = document.createElement('textarea');
      ta.value = week.aiPrompt;
      document.body.append(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
  };

  return (
    <>
      <div className="flex flex-col gap-4 pt-2">
        <p className="text-lg font-extrabold">Бонус: поговори с ИИ 🎤</p>
        <p className="text-base text-muted">
          Скопируй текст ниже, открой Claude или ChatGPT, включи голосовой режим и вставь этот
          текст. ИИ сыграет роль по теме недели, а в конце по-русски разберёт три главные ошибки.
          Может понадобиться VPN.
        </p>
        <Card className="p-4">
          <p className="font-mono text-sm leading-relaxed">{week.aiPrompt}</p>
        </Card>
        <PillButton variant="primary" onClick={copy}>
          <Copy size={20} aria-hidden /> {copied ? 'Скопировано!' : 'Скопировать'}
        </PillButton>
        <div className="grid grid-cols-2 gap-3">
          <a
            href="https://claude.ai/new"
            target="_blank"
            rel="noreferrer"
            className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-surface font-bold ring-1 ring-line"
          >
            Claude <ExternalLink size={16} aria-hidden />
          </a>
          <a
            href="https://chatgpt.com/"
            target="_blank"
            rel="noreferrer"
            className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-surface font-bold ring-1 ring-line"
          >
            ChatGPT <ExternalLink size={16} aria-hidden />
          </a>
        </div>
      </div>
      <AnswerBar status="idle" onNext={done} nextLabel="Готово" />
    </>
  );
}
