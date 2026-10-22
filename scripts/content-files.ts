// Чтение content/ с диска для npm-скриптов (validate, audio).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ContentFiles } from '../src/content/validate.ts';

export const ROOT = join(import.meta.dirname, '..');
export const CONTENT_DIR = join(ROOT, 'content');
export const AUDIO_DIR = join(ROOT, 'public', 'audio');

const readJson = (p: string): unknown => JSON.parse(readFileSync(p, 'utf8'));

export function readContentFiles(): ContentFiles {
  const weeks: Record<string, unknown> = {};
  for (const dir of readdirSync(CONTENT_DIR).filter((d) => /^month\d+$/.test(d))) {
    for (const f of readdirSync(join(CONTENT_DIR, dir)).filter((f) => /^week\d+\.json$/.test(f))) {
      weeks[`${dir}/${f.replace(/\.json$/, '')}`] = readJson(join(CONTENT_DIR, dir, f));
    }
  }
  return {
    course: readJson(join(CONTENT_DIR, 'course.json')),
    voices: readJson(join(CONTENT_DIR, 'voices.json')),
    weeks,
  };
}

export const iconExists = (name: string) =>
  existsSync(join(ROOT, 'public', 'icons', '3d', `${name}.png`));
export const audioExists = (id: string) => existsSync(join(AUDIO_DIR, `${id}.mp3`));
