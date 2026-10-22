# English Trip — правила для Claude Code

Полное описание проекта: `PROJECT.md` в корне. Прочитай его перед работой; этот файл — короткая выжимка.
`PROJECT.md` лежит только на компьютере владельца (в `.gitignore`), потому что в нём личные подробности.

## Главное

- **Владелец не программист.** Объясняй по-русски, просто, без жаргона. Ручные шаги — пошагово, с точными командами.
- **Бюджет 0 ₽.** Только бесплатные сервисы, библиотеки, шрифты, иконки и звуки.
- **Работаем по этапам** (PROJECT.md, раздел 13). В начале этапа — короткий план и подтверждение, в конце — чек-лист для проверки на телефоне.
- **Не ломать прогресс ученицы.** Любое изменение схемы IndexedDB — только через новую версию Dexie с `upgrade()`.
- **Не выдумывать английский.** Контент грамотный, естественный, по уровню; переводы на русский точные.
- **Секреты** (токены и т.п.) — только в GitHub Secrets / Cloudflare Secrets, никогда в репозитории.
- **Репозиторий публичный** (GitHub Pages бесплатно только так), поэтому **никаких личных данных**
  ни в коде, ни в контенте, ни в сообщениях коммитов:
  - имя ученицы, её фамилия, имена и почта владельца — нельзя. Героиню диалогов зовут нейтрально (например, Anna);
  - личное хранится только локально в папках из `.gitignore`: `PROJECT.md`, `private/` (черновики,
    `private/blocklist.txt`), `docs/design-refs/` (чужие скриншоты);
  - перед каждым коммитом `.githooks/pre-commit` ищет слова из `private/blocklist.txt` и проверяет,
    что автор коммита — анонимный адрес `@users.noreply.github.com`. Хук включается командой
    `git config core.hooksPath .githooks` (уже включён). Не обходить его через `--no-verify`;
  - контент из черновика `private/english-dlya-*.html` переносить только с заменой имён.
- Приложение обязано работать **без VPN** из России и **офлайн** после первой загрузки.

## Команды

| Команда                 | Что делает                                                                      |
| ----------------------- | ------------------------------------------------------------------------------- |
| `npm run dev`           | Локальный сервер для разработки                                                 |
| `npm run build`         | Проверка типов + сборка в `dist/` (вместе с иконками PWA)                       |
| `npm run preview`       | Посмотреть собранную версию                                                     |
| `npm run lint`          | ESLint                                                                          |
| `npm run format`        | Prettier                                                                        |
| `npm test`              | Vitest                                                                          |
| `npm run validate`      | Проверка всего контента и наличия озвучки (`-- --no-audio` — без звука)         |
| `npm run audio`         | Озвучить недостающее (`-- --force` — всё заново, `-- --prune` — удалить лишнее) |
| `npm run audio:setup`   | Один раз: Python-окружение для озвучки                                          |
| `npm run audio:samples` | Образцы голосов → `private/voice-samples/index.html`                            |

Деплой автоматический: push в `main` → GitHub Actions (`.github/workflows/deploy.yml`) → GitHub Pages.

## Стек и версии

Vite 8, React 19, TypeScript 6.0 (strict; TS 7 пока не поддерживается typescript-eslint), Tailwind CSS 4,
Motion (`motion/react`), React Router 8 (`HashRouter`, импорт из `react-router`), lucide-react, vite-plugin-pwa,
Manrope через `@fontsource/manrope` (только latin + cyrillic, веса 500–800).
zod — только для проверки контента (в бандл не попадает). Будущие этапы: Zustand, Dexie, ts-fsrs,
canvas-confetti — ставить, когда понадобятся.
Озвучка: Python 3.12, kokoro 0.9.4, faster-whisper 1.2.1, ffmpeg, eSpeak NG (`scripts/audio/requirements.txt`).

## Структура

```txt
src/
  app/          App (роутинг; урок — вне AppLayout, без нижнего меню), AppLayout, BottomNav
  screens/      экраны по одному файлу; LessonScreen — движок урока, LessonDone — завершение
  exercises/    по компоненту на тип задания, общий интерфейс ExerciseProps (exercises/types.ts)
  components/   Card, Tile, PillButton, ProgressRing, BottomSheet, Icon3D, SoundButton, AnswerBar,
                OptionButton, KaraokeText, ListeningPlayer, WordSheet, tones.ts
  content/      схема контента (zod), audioId, clips (что озвучивается), validate, загрузка
  db/           Dexie-схема (db.ts), все изменения прогресса (progress.ts), useCourseProgress
  lib/          чистая логика + тесты рядом (*.test.ts): audio, karaoke, day (граница 03:00), streak,
                xp, srs (ts-fsrs), check, lessonBuilder, lessonBlocks, vocabMatch, random, activity
  config.ts     имя ученицы, стартовый EF SET, константы
content/
  course.json   месяцы и порядок недель
  voices.json   роль → голос Kokoro (narrator — слова, примеры, пары, числа)
  month1/week1…4.json
scripts/
  validate.ts, content-files.ts
  audio/        run.ts (npm run audio) → generate.py (Kokoro → ffmpeg → Whisper), samples.ts, setup.ts
public/
  audio/        {id}.mp3, {id}.json (тайминги слов), manifest.json — коммитятся, CI не озвучивает
  logo.svg      маскот; из него при сборке генерируются иконки PWA (pwa-assets.config.ts)
  icons/3d/     Fluent Emoji 3D (MIT, LICENSE.txt рядом)
docs/design-refs/  скриншоты-референсы (только локально, в .gitignore)
```

## Соглашения

- **Цвета, скругления, тени** — только токены из `src/index.css` (`@theme`): `bg-surface`, `text-muted`,
  `rounded-card`, `shadow-soft`, `bg-lilac-soft` и т.д. Без «магических» hex в компонентах.
  Пастельные классы брать из `components/tones.ts` (Tailwind видит только целые имена классов).
- Часть токенов затемнена относительно PROJECT.md ради контраста AA: `--muted`, градиент шапки;
  на насыщенных плитках (violet/blue) текст тёмный.
- Mobile-first, ширина 360–412px, контейнер `max-w-[480px]`, боковые отступы `px-5`, цели касания ≥ 48px.
- Анимации — Motion; `MotionConfig reducedMotion="user"` уже включён в `App`.
- Пути к файлам из `public/` — через `import.meta.env.BASE_URL` (сайт живёт в подпапке, `base: './'`).
- Без `confirm()`/`alert()`: подтверждения — на странице или в `BottomSheet`.
- Логику выносить в `src/lib/` и покрывать тестами Vitest.
- Перед коммитом: `npm run lint && npm run validate && npm test && npm run build`.
- В Bash не передавать текст с обратными кавычками внутри `"…"` (например, `node -e "…"`): оболочка
  выполнит их как команды. Файлы правь через Edit/Write.

## Уроки и прогресс

- Урок собирается `buildLesson` из плана дня один раз (с «зерном») и целиком сохраняется в `lessonRuns`:
  при выходе и возвращении задания те же. Новое задание = компонент в `src/exercises/` + запись в
  `EXERCISES` (LessonScreen) + `SUPPORTED` и ветка в `buildLesson`. Типы этапа 3 в планах уроков
  пока пропускаются.
- Задание сообщает ответы через `report()` (можно несколько раз) и заканчивает `done()`.
  Ошибка в `word_listen_choice` повторяется в конце урока один раз (`isRetryable`).
- Точность на слух = первые попытки заданий с навыком `listening` без «улитки» (`normalSpeed`).
- Звук играет через fetch → blob (иначе mp3 не кешируется для офлайна); звук текущей недели
  предзагружается с главной.
- Схема Dexie — версия 1. Любое изменение — только `db.version(2).stores(...).upgrade(...)`.
- Слова: ключ `m1w1/boarding-pass`; свои слова из диалогов — `user/<слово>` с репликой как контекстом.
- Имя ученицы вводится на телефоне и хранится только в IndexedDB (в коде его нет).
- Проверка урока целиком: робот на puppeteer-core + Edge проходит урок по тексту на экране
  (в репозиторий не входит; при необходимости написать заново).

## Контент и звук

- Схема — `src/content/schema.ts`. Неделя: 24–28 слов, 3 диалога + 1 объявление/монолог, 8 минимальных пар,
  8 упражнений с числами, 7 планов уроков, промпт для ИИ. Ветвящийся диалог и босс — на этапе 3 (поля уже есть).
- **id аудио в контенте не пишутся.** id = первые 12 символов sha1(`голос|текст`), считается автоматически
  (`src/content/audioId.ts`, то же самое в Python не нужно — список фраз собирает Node). Поменял текст →
  `npm run audio` озвучит новую версию, `npm run audio -- --prune` уберёт старую.
  Если произносить нужно иначе, чем написано, — поле `say`.
- Голоса выбраны владельцем по образцам: британский акцент основной, диктор `bf_emma`, Anna — `bf_isabella`.
  Американский — вторым голосом со 2-го месяца.
- Героиня диалогов — **Anna** (Anna Sokolova), вымышленная. Имя ученицы в контенте не использовать.
- Британский английский: the bill, take away, ground floor, at the weekend, hand luggage. Месяц 1: реплика ≤ 12 слов,
  диалог 6–9 реплик. Вопросы проверяют смысл, неверные варианты правдоподобны (fifteen/fifty, twelve/twenty).
- Python-окружение озвучки лежит вне OneDrive: `%LOCALAPPDATA%\english-trip\venv` (переопределяется
  `ENGLISH_TRIP_VENV`). faster-whisper получает звук, декодированный ffmpeg: его встроенный декодер
  несовместим со свежим `av`.
- Неделя озвучивается ~5 минут на процессоре и весит ~1,5 МБ.
