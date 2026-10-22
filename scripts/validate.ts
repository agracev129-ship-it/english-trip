// npm run validate — проверить весь учебный контент.
// npm run validate -- --no-audio — не требовать готовых mp3 (пока контент пишется).
import { audioExists, iconExists, readContentFiles } from './content-files.ts';
import { validateContent } from '../src/content/validate.ts';

const checkAudio = !process.argv.includes('--no-audio');
const result = validateContent(readContentFiles(), {
  iconExists,
  audioExists: checkAudio ? audioExists : undefined,
});

for (const w of result.weeks) {
  console.log(
    `✓ ${w.id} «${w.title}»: ${w.words.length} слов, ${w.listenings.length} аудиотекстов, ` +
      `${w.minimalPairs.length} пар, ${w.numberDrills.length} чисел, ${w.lessons.length} уроков`,
  );
}

if (result.missingAudio.length) {
  result.errors.push(
    `нет озвучки для ${result.missingAudio.length} фраз — запусти npm run audio. Первые:\n  ` +
      result.missingAudio.slice(0, 10).join('\n  '),
  );
}

if (result.errors.length) {
  console.error(`\n✗ Найдено проблем: ${result.errors.length}`);
  for (const e of result.errors) console.error(`  • ${e}`);
  process.exit(1);
}
console.log('\nКонтент в порядке.');
