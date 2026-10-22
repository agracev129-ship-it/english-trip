// Всё, что звучит в неделе: слова, примеры, реплики, минимальные пары, числа.
// Отсюда берут список и генератор аудио (npm run audio), и проверка (npm run validate),
// и приложение — чтобы найти файл для конкретного текста.
import { audioId } from './audioId.ts';
import type { Line, Listening, MinimalPair, NumberDrill, Voices, Week, Word } from './schema.ts';

export type ClipKind = 'word' | 'example' | 'line' | 'pair' | 'number';

export type Clip = {
  id: string;
  voice: string;
  /** Текст, который озвучивается (поле say, если оно есть) */
  text: string;
  kind: ClipKind;
  /** Откуда клип: «m1w1/boarding-pass», «m1w1/d1#3» */
  source: string;
};

export function voiceForRole(voices: Voices, role: string): string {
  const v = voices.roles[role];
  if (!v) throw new Error(`Нет голоса для роли «${role}» в content/voices.json`);
  return v;
}

export function clip(voice: string, text: string, kind: ClipKind, source: string): Clip {
  return { id: audioId(voice, text), voice, text, kind, source };
}

export function lineClip(voices: Voices, week: Week, listening: Listening, index: number): Clip {
  const line: Line | undefined = listening.lines[index];
  if (!line) throw new Error(`${week.id}/${listening.id}: нет реплики #${index}`);
  const speaker = listening.speakers.find((s) => s.id === line.speaker);
  if (!speaker) throw new Error(`${week.id}/${listening.id}: нет говорящего «${line.speaker}»`);
  return clip(
    voiceForRole(voices, speaker.voice),
    line.say ?? line.text,
    'line',
    `${week.id}/${listening.id}#${index}`,
  );
}

export function wordClip(voices: Voices, w: Word): Clip {
  return clip(voices.narrator, w.say ?? w.en, 'word', w.id);
}

export function exampleClip(voices: Voices, w: Word): Clip {
  return clip(voices.narrator, w.exampleSay ?? w.example, 'example', `${w.id}:example`);
}

export function pairClips(voices: Voices, p: MinimalPair): { a: Clip; b: Clip } {
  return {
    a: clip(voices.narrator, p.aSay ?? p.a, 'pair', `${p.id}:a`),
    b: clip(voices.narrator, p.bSay ?? p.b, 'pair', `${p.id}:b`),
  };
}

export function drillClip(voices: Voices, d: NumberDrill): Clip {
  return clip(voices.narrator, d.say ?? d.text, 'number', d.id);
}

export function weekClips(voices: Voices, week: Week): Clip[] {
  const at = (c: Clip): Clip => ({ ...c, source: `${week.id}/${c.source}` });
  const out: Clip[] = [];
  for (const w of week.words) out.push(at(wordClip(voices, w)), at(exampleClip(voices, w)));
  for (const l of week.listenings) {
    l.lines.forEach((_, i) => out.push(lineClip(voices, week, l, i)));
  }
  for (const p of week.minimalPairs) {
    const { a, b } = pairClips(voices, p);
    out.push(at(a), at(b));
  }
  for (const d of week.numberDrills) out.push(at(drillClip(voices, d)));
  return out;
}

/** Убирает повторы: одинаковый текст тем же голосом — один файл. */
export function uniqueClips(clips: Clip[]): Clip[] {
  const seen = new Map<string, Clip>();
  for (const c of clips) if (!seen.has(c.id)) seen.set(c.id, c);
  return [...seen.values()];
}
