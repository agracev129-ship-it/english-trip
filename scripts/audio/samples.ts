// npm run audio:samples — образцы голосов Kokoro для выбора (PROJECT.md, раздел 8.2).
// Результат: private/voice-samples/index.html — страница с плеерами, звук встроен прямо в неё.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../content-files.ts';
import { runGenerator } from './generator.ts';

const VOICES: { voice: string; label: string }[] = [
  { voice: 'bf_emma', label: 'Британский, женский — Emma' },
  { voice: 'bf_isabella', label: 'Британский, женский — Isabella' },
  { voice: 'bf_alice', label: 'Британский, женский — Alice' },
  { voice: 'bf_lily', label: 'Британский, женский — Lily' },
  { voice: 'bm_george', label: 'Британский, мужской — George' },
  { voice: 'bm_lewis', label: 'Британский, мужской — Lewis' },
  { voice: 'bm_daniel', label: 'Британский, мужской — Daniel' },
  { voice: 'bm_fable', label: 'Британский, мужской — Fable' },
  { voice: 'af_heart', label: 'Для сравнения: американский, женский — Heart' },
  { voice: 'am_michael', label: 'Для сравнения: американский, мужской — Michael' },
];
const TEXT =
  'Good morning. Where are you flying today? Boarding starts at ten fifteen, at gate twelve.';

const out = join(ROOT, 'private', 'voice-samples');
mkdirSync(out, { recursive: true });
const results = runGenerator(
  VOICES.map((v, i) => ({ id: `sample-${i + 1}-${v.voice}`, voice: v.voice, text: TEXT })),
  out,
);

if (results.length < VOICES.length) {
  console.error(`Озвучено только ${results.length} из ${VOICES.length} образцов.`);
  process.exit(1);
}

const rows = results.map((r) => {
  const v = VOICES.find((x) => r.id.endsWith(x.voice))!;
  const n = r.id.split('-')[1];
  const b64 = readFileSync(join(out, `${r.id}.mp3`)).toString('base64');
  return `<section><h2>${n}. ${v.label}</h2><code>${v.voice}</code>
<audio controls preload="auto" src="data:audio/mpeg;base64,${b64}"></audio></section>`;
});

writeFileSync(
  join(out, 'index.html'),
  `<!doctype html><html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Образцы голосов</title>
<style>body{font-family:system-ui,sans-serif;max-width:640px;margin:24px auto;padding:0 16px;background:#f5f3fc;color:#1b1a23}
section{background:#fff;border-radius:16px;padding:12px 16px;margin:12px 0}h2{font-size:17px;margin:0 0 4px}
code{color:#6f6c80}audio{width:100%;margin-top:8px}</style></head><body>
<h1>Образцы голосов</h1><p>Фраза: «${TEXT}»</p>
${rows.join('\n')}
</body></html>`,
);
console.log(`\nОбразцы: ${join(out, 'index.html')}`);
