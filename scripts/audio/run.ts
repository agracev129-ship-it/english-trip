// npm run audio — озвучить весь контент, которому ещё не хватает звука.
//   --force   переозвучить всё заново (например, после смены голосов)
//   --prune   удалить файлы, которые больше не нужны ни одной фразе
// Результат: public/audio/{id}.mp3, {id}.json (тайминги слов) и public/audio/manifest.json.
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { AUDIO_DIR, iconExists, readContentFiles } from '../content-files.ts';
import { uniqueClips, weekClips, type Clip } from '../../src/content/clips.ts';
import { validateContent } from '../../src/content/validate.ts';
import { runGenerator } from './generator.ts';

type ManifestEntry = { voice: string; text: string; duration: number; timings: boolean };
type Manifest = Record<string, ManifestEntry>;

const force = process.argv.includes('--force');
const prune = process.argv.includes('--prune');
const MANIFEST = join(AUDIO_DIR, 'manifest.json');

const content = validateContent(readContentFiles(), { iconExists });
if (content.errors.length || !content.voices) {
  console.error('Сначала исправь контент (npm run validate):');
  for (const e of content.errors) console.error(`  • ${e}`);
  process.exit(1);
}

const clips: Clip[] = uniqueClips(content.weeks.flatMap((w) => weekClips(content.voices!, w)));
mkdirSync(AUDIO_DIR, { recursive: true });
const manifest: Manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};

const todo = clips.filter(
  (c) => force || !existsSync(join(AUDIO_DIR, `${c.id}.mp3`)) || !manifest[c.id],
);
console.log(`Фраз в контенте: ${clips.length}, нужно озвучить: ${todo.length}`);

if (todo.length) {
  for (const c of todo) rmSync(join(AUDIO_DIR, `${c.id}.json`), { force: true });
  const results = runGenerator(
    todo.map(({ id, voice, text }) => ({ id, voice, text })),
    AUDIO_DIR,
  );
  const byId = new Map(todo.map((c) => [c.id, c]));
  for (const r of results) {
    const c = byId.get(r.id)!;
    manifest[r.id] = { voice: c.voice, text: c.text, duration: r.duration, timings: r.timings };
  }
  const failed = todo.length - results.length;
  if (failed) console.error(`Не удалось озвучить: ${failed}`);
}

// Файлы, на которые больше не ссылается ни одна фраза
const used = new Set(clips.map((c) => c.id));
const orphans = readdirSync(AUDIO_DIR)
  .filter((f) => /^[0-9a-f]{12}\.(mp3|json)$/.test(f))
  .filter((f) => !used.has(f.slice(0, 12)));
if (orphans.length) {
  if (prune) {
    for (const f of orphans) rmSync(join(AUDIO_DIR, f));
    console.log(`Удалено лишних файлов: ${orphans.length}`);
  } else {
    console.log(`Лишних файлов: ${orphans.length} (удалить: npm run audio -- --prune)`);
  }
}
for (const id of Object.keys(manifest)) {
  if (!used.has(id) && (prune || !existsSync(join(AUDIO_DIR, `${id}.mp3`)))) delete manifest[id];
}

const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(MANIFEST, JSON.stringify(sorted, null, 1) + '\n');

let bytes = 0;
let files = 0;
for (const f of readdirSync(AUDIO_DIR)) {
  bytes += statSync(join(AUDIO_DIR, f)).size;
  files++;
}
const withTimings = Object.values(sorted).filter((m) => m.timings).length;
console.log(
  `\nИтого в public/audio: ${files} файлов, ${(bytes / 1024 / 1024).toFixed(1)} МБ. ` +
    `Фраз с разметкой слов: ${withTimings}.`,
);
if (todo.length && Object.keys(sorted).length < clips.length) process.exit(1);
