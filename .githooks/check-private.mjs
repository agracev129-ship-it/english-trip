// Проверка перед коммитом: в публичный репозиторий не должны попасть личные данные.
// Слова-запреты лежат в private/blocklist.txt (сам файл в git не попадает).
// Слово ищется целиком и без учёта регистра: если запрещённое имя лишь часть
// другого слова (как внутри «анализа»), это не считается.
// Ещё проверяется, что автор коммита записан анонимным адресом GitHub.
//
// node .githooks/check-private.mjs        — проверить то, что готовится к коммиту
// node .githooks/check-private.mjs --all  — проверить все файлы репозитория и историю
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });
const fail = (msg) => {
  console.error(`Коммит остановлен: ${msg}`);
  process.exit(1);
};
const scanAll = process.argv.includes('--all');

const email = git('config', 'user.email').trim();
if (!email.endsWith('@users.noreply.github.com')) {
  fail(`автор коммита должен быть с адресом @users.noreply.github.com, сейчас ${email}`);
}

const LIST = 'private/blocklist.txt';
if (!existsSync(LIST)) process.exit(0);

const words = readFileSync(LIST, 'utf8')
  .split(/\r?\n/)
  .map((s) => s.trim())
  .filter((s) => s && !s.startsWith('#'));
if (words.length === 0) process.exit(0);

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const re = new RegExp(
  `(?<![\\p{L}\\p{N}])(?:${words.map(escape).join('|')})(?![\\p{L}\\p{N}])`,
  'iu',
);

let lines;
if (scanAll) {
  const files = git('ls-files').trim().split('\n');
  lines = [
    ...files,
    ...files.flatMap((f) =>
      readFileSync(f, 'utf8')
        .split('\n')
        .map((l, i) => `${f}:${i + 1}: ${l}`),
    ),
    ...git('log', '--all', '--format=%an %ae %cn %ce%n%B').split('\n'),
  ];
} else {
  lines = [
    ...git('diff', '--cached', '--name-only', '--diff-filter=ACMR').split('\n'),
    ...git('diff', '--cached', '-U0', '--no-color', '--diff-filter=ACMR')
      .split('\n')
      .filter((l) => l.startsWith('+') && !l.startsWith('+++')),
  ];
}

const hits = lines.filter((l) => re.test(l));
if (hits.length > 0) {
  fail(`найдены слова из ${LIST}:\n${hits.slice(0, 20).join('\n')}`);
}
if (scanAll) console.log('Личных данных не найдено.');
