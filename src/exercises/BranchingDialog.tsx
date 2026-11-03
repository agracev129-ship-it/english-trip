import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { AnswerBar } from '../components/AnswerBar';
import { Mascot } from '../components/Mascot';
import { OptionButton } from '../components/OptionButton';
import { PillButton } from '../components/PillButton';
import { SoundButton } from '../components/SoundButton';
import { voices } from '../content';
import { branchNodeClip, branchOptionClip } from '../content/clips';
import type { BranchNode, BranchOption } from '../content/schema';
import { play, stop } from '../lib/audio';
import { buzz } from '../lib/haptics';
import type { ExerciseProps } from './types';

type Said = { who: string; text: string; ru: string; mine: boolean };

/**
 * №17 Интерактивный разговор: персонаж говорит голосом, она выбирает ответ, разговор ветвится.
 * Неуместный ответ вызывает мягкую реакцию персонажа и подсказку.
 */
export function BranchingDialog({ week, speed, report, done }: ExerciseProps<'branching_dialog'>) {
  const b = week.branching;
  const [nodeId, setNodeId] = useState(b?.start ?? '');
  const [started, setStarted] = useState(false);
  const [history, setHistory] = useState<Said[]>([]);
  const [showText, setShowText] = useState(false);
  const [picked, setPicked] = useState<BranchOption | null>(null);
  const [answered, setAnswered] = useState<string[]>([]);

  useEffect(() => () => stop(), []);
  if (!b) return null;

  const node: BranchNode | undefined = b.nodes.find((n) => n.id === nodeId);
  if (!node) return null;
  const speaker = (id: string) => b.speakers.find((s) => s.id === id)?.name ?? id;
  const clip = branchNodeClip(voices, b, node);
  const finished = node.options.length === 0;

  const goNext = (opt: BranchOption) => {
    setHistory((h) => [
      ...h,
      { who: speaker(node.speaker), text: node.text, ru: node.ru, mine: false },
      { who: 'Anna', text: opt.text, ru: opt.ru, mine: true },
    ]);
    setPicked(null);
    setShowText(false);
    setNodeId(opt.next);
  };

  const choose = async (opt: BranchOption) => {
    if (picked) return;
    setPicked(opt);
    buzz(opt.ok ? 'correct' : 'wrong');
    // Узел с уже данным ответом (вернулись после неуместного) в статистику второй раз не идёт
    if (!answered.includes(node.id)) {
      setAnswered([...answered, node.id]);
      report({ correct: opt.ok, skill: 'listening', itemIds: [`${week.id}/${b.id}/${node.id}`] });
    }
    await play(branchOptionClip(voices, b, opt).id, speed);
    // Уместный ответ — разговор идёт дальше сам; после неуместного сначала подсказка
    if (opt.ok) goNext(opt);
  };

  if (!started) {
    return (
      <>
        <div className="flex flex-col items-center gap-4 pt-6 text-center">
          <Mascot size={110} />
          <h2 className="text-xl font-extrabold">{b.title}</h2>
          <p className="text-base text-muted">{b.introRu}</p>
          <p className="text-sm font-semibold text-muted">
            Слушай собеседника и выбирай, что ответить. Текст можно подсмотреть.
          </p>
        </div>
        <AnswerBar status="idle" onNext={() => setStarted(true)} nextLabel="Начать разговор" />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 pt-2">
        <div className="flex flex-col gap-2">
          {history.map((h, i) => (
            <div key={i} className={`flex ${h.mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-tile px-3 py-2 text-sm ${
                  h.mine ? 'bg-primary-100' : 'bg-surface'
                }`}
              >
                <p className="text-xs font-bold text-muted">{h.who}</p>
                <p>{h.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-2 rounded-card bg-surface p-4 text-center shadow-soft">
          <p className="text-sm font-bold text-muted">{speaker(node.speaker)}</p>
          <SoundButton key={node.id} clipId={clip.id} speed={speed} label="реплика" autoPlay />
          {showText || finished ? (
            <p className="text-base font-semibold">
              {node.text}
              <span className="block text-sm font-normal text-muted">{node.ru}</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={() => setShowText(true)}
              className="flex min-h-12 items-center gap-2 text-sm font-bold text-primary-700"
            >
              <Eye size={18} aria-hidden /> Показать текст
            </button>
          )}
        </div>

        {!finished && !picked && (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-bold text-muted">Что ответить?</p>
            {node.options.map((o) => (
              <OptionButton key={o.text} onClick={() => void choose(o)}>
                {o.text}
              </OptionButton>
            ))}
          </div>
        )}

        {picked && !picked.ok && (
          <div className="flex flex-col gap-3 rounded-tile bg-yellow-soft p-4">
            <p className="flex items-center gap-2 text-base font-bold">
              <Mascot state="thinking" size={44} /> Не очень к месту
            </p>
            <p className="text-base">{picked.hintRu}</p>
            <PillButton fullWidth onClick={() => goNext(picked)}>
              Продолжить разговор
            </PillButton>
          </div>
        )}
      </div>
      {finished && <AnswerBar status="idle" onNext={done} nextLabel="Разговор окончен · Дальше" />}
    </>
  );
}
