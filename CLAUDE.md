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

| Команда           | Что делает                                                |
| ----------------- | --------------------------------------------------------- |
| `npm run dev`     | Локальный сервер для разработки                           |
| `npm run build`   | Проверка типов + сборка в `dist/` (вместе с иконками PWA) |
| `npm run preview` | Посмотреть собранную версию                               |
| `npm run lint`    | ESLint                                                    |
| `npm run format`  | Prettier                                                  |
| `npm test`        | Vitest                                                    |

Деплой автоматический: push в `main` → GitHub Actions (`.github/workflows/deploy.yml`) → GitHub Pages.

## Стек и версии

Vite 8, React 19, TypeScript 6.0 (strict; TS 7 пока не поддерживается typescript-eslint), Tailwind CSS 4,
Motion (`motion/react`), React Router 8 (`HashRouter`, импорт из `react-router`), lucide-react, vite-plugin-pwa,
Manrope через `@fontsource/manrope` (только latin + cyrillic, веса 500–800).
Будущие этапы: Zustand, Dexie, ts-fsrs, zod, canvas-confetti — ставить, когда понадобятся.

## Структура

```txt
src/
  app/          App (роутинг), AppLayout, BottomNav
  screens/      экраны по одному файлу
  components/   Card, Tile, PillButton, ProgressRing, BottomSheet, Icon3D, tones.ts
  lib/          чистая логика + тесты рядом (*.test.ts)
  config.ts     имя ученицы, стартовый EF SET, константы
public/
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
- Перед коммитом: `npm run lint && npm test && npm run build`.
