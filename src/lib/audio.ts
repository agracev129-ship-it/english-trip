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

// Файлы скачиваются целиком через fetch и играются из blob: так Service Worker кладёт в кеш
// полный ответ и звук работает офлайн. Если отдать <audio> прямую ссылку, браузер просит mp3
// кусками (206 Partial Content), а такие ответы не кешируются.
const MAX_BLOBS = 300;
const blobUrls = new Map<string, string>();
let token = 0;

async function sourceFor(id: string): Promise<string> {
  const hit = blobUrls.get(id);
  if (hit) return hit;
  const res = await fetch(audioUrl(id));
  if (!res.ok) throw new Error(`Нет звука ${id}`);
  const url = URL.createObjectURL(await res.blob());
  blobUrls.set(id, url);
  if (blobUrls.size > MAX_BLOBS) {
    const [oldId, oldUrl] = blobUrls.entries().next().value!;
    URL.revokeObjectURL(oldUrl);
    blobUrls.delete(oldId);
  }
  return url;
}

/** Скачать файлы заранее (они попадут в кеш Service Worker). Ошибки молча пропускаются. */
export async function preload(ids: string[]): Promise<void> {
  await Promise.all(
    ids.map((id) =>
      fetch(audioUrl(id))
        .then((r) => r.blob())
        .catch(() => undefined),
    ),
  );
}

/** Проиграть файл. Промис завершается, когда звук доиграл, был остановлен или не загрузился. */
export function play(id: string, rate = 1): Promise<void> {
  stop();
  const my = ++token;
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

    const start = (src: string) => {
      if (my !== token) return; // пока файл качался, включили другой звук или нажали «стоп»
      audio.src = src;
      // При смене src браузер сбрасывает скорость к defaultPlaybackRate, поэтому задаём обе
      audio.defaultPlaybackRate = rate;
      audio.playbackRate = rate;
      audio
        .play()
        .then(() => {
          raf = requestAnimationFrame(tick);
        })
        .catch(() => finish?.());
    };
    // Уже скачанный файл запускаем синхронно, прямо в обработчике нажатия
    const hit = blobUrls.get(id);
    if (hit) start(hit);
    else
      sourceFor(id)
        .then(start)
        .catch(() => my === token && finish?.());
  });
}

export const isPlaying = () => state.playing;

export function stop() {
  token++;
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
