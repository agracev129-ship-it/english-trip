// Проигрыватель звука. Одновременно звучит только одно (PROJECT.md, раздел 14):
// новый звук останавливает предыдущий. Скорость меняется через playbackRate
// с сохранением высоты голоса, поэтому файлы записаны один раз на скорости 1.0.
import { useSyncExternalStore } from 'react';
import type { WordTiming } from './karaoke.ts';

export type { WordTiming };

export type PlayerState = {
  /** id звучащего (или последнего) файла */
  id: string | null;
  playing: boolean;
  /** Текущее время в секундах записи (не зависит от скорости) */
  time: number;
};

const BASE = `${import.meta.env.BASE_URL}audio/`;
export const audioUrl = (id: string) => `${BASE}${id}.mp3`;

const audio = new Audio();
audio.preload = 'auto';
audio.preservesPitch = true;

let state: PlayerState = { id: null, playing: false, time: 0 };
const listeners = new Set<() => void>();
let finish: (() => void) | null = null;
let raf = 0;

function set(patch: Partial<PlayerState>) {
  state = { ...state, ...patch };
  for (const l of listeners) l();
}

function tick() {
  set({ time: audio.currentTime });
  if (!audio.paused) raf = requestAnimationFrame(tick);
}

/** Проиграть файл. Промис завершается, когда звук доиграл или был остановлен. */
export function play(id: string, rate = 1): Promise<void> {
  stop();
  audio.src = audioUrl(id);
  // При смене src браузер сбрасывает скорость к defaultPlaybackRate, поэтому задаём обе
  audio.defaultPlaybackRate = rate;
  audio.playbackRate = rate;
  set({ id, playing: true, time: 0 });

  return new Promise<void>((resolve) => {
    finish = () => {
      finish = null;
      cancelAnimationFrame(raf);
      audio.onended = null;
      audio.onerror = null;
      set({ playing: false, time: audio.currentTime });
      resolve();
    };
    audio.onended = () => finish?.();
    audio.onerror = () => finish?.();
    audio
      .play()
      .then(() => {
        raf = requestAnimationFrame(tick);
      })
      .catch(() => finish?.());
  });
}

export function stop() {
  if (!audio.paused) audio.pause();
  finish?.();
}

export function usePlayer(): PlayerState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
  );
}

const timingsCache = new Map<string, Promise<WordTiming[] | null>>();

/** Тайминги слов для караоке. null — разметки нет, подсвечивается вся фраза. */
export function loadTimings(id: string): Promise<WordTiming[] | null> {
  let p = timingsCache.get(id);
  if (!p) {
    p = fetch(`${BASE}${id}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<WordTiming[]>) : null))
      .catch(() => null);
    timingsCache.set(id, p);
  }
  return p;
}
