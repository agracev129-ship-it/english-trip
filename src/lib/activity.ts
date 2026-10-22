// Время занятий (PROJECT.md, 8.3): считается, только пока экран активен.
// Паузы больше 2 минут без касаний и звука не засчитываются.
import { addSeconds } from '../db/progress';
import { isPlaying } from './audio';

const TICK_S = 10;
const IDLE_LIMIT_MS = 2 * 60 * 1000;

let lastInteraction = Date.now();
let timer: number | undefined;

const touch = () => {
  lastInteraction = Date.now();
};

export function startActivityTracking(): () => void {
  if (timer) return () => {};
  window.addEventListener('pointerdown', touch, { passive: true });
  window.addEventListener('keydown', touch);
  timer = window.setInterval(() => {
    if (document.visibilityState !== 'visible') return;
    if (isPlaying()) touch();
    if (Date.now() - lastInteraction > IDLE_LIMIT_MS) return;
    void addSeconds(TICK_S);
  }, TICK_S * 1000);
  return () => {
    window.clearInterval(timer);
    timer = undefined;
    window.removeEventListener('pointerdown', touch);
    window.removeEventListener('keydown', touch);
  };
}
