import { useNavigate } from 'react-router';
import { Mascot } from './Mascot';
import type { MascotMessage } from '../lib/mascotMessage';

/** Баннер маскота на главной (как «Ты молодец!» в референсе Habitz). */
export function MascotBanner({ message }: { message: MascotMessage }) {
  const navigate = useNavigate();
  const content = (
    <>
      <Mascot state={message.state} size={84} />
      <span className="min-w-0">
        <span className="block text-lg leading-tight font-extrabold">{message.title}</span>
        <span className="mt-0.5 block text-sm font-semibold text-muted">{message.text}</span>
      </span>
    </>
  );
  const cls = 'flex w-full items-center gap-3 rounded-card bg-lilac-soft p-4 text-left';
  return message.to ? (
    <button type="button" className={cls} onClick={() => navigate(message.to!)}>
      {content}
    </button>
  ) : (
    <div className={cls}>{content}</div>
  );
}
