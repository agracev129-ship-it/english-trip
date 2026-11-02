// Картинка-карточка отчёта для отправки в Telegram. Рисуется на месте, никуда не загружается.
import { reportTitleLines, type ReportData } from './report';

const SIZE = 1080;
const HEIGHT = 996;

/** Цвет из токенов темы (src/index.css), чтобы карточка не расходилась с дизайном. */
function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--color-${name}`).trim();
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function tile(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  bg: string,
  value: string,
  label: string,
) {
  c.fillStyle = bg;
  c.beginPath();
  c.roundRect(x, y, w, h, 44);
  c.fill();
  c.fillStyle = token('ink');
  c.font = '800 84px Manrope, sans-serif';
  c.fillText(value, x + 40, y + 118, w - 80);
  c.fillStyle = token('muted');
  c.font = '600 36px Manrope, sans-serif';
  c.fillText(label, x + 40, y + 176, w - 80);
}

/** PNG-карточка отчёта; null, если браузер не умеет рисовать (тогда отправим только текст). */
export async function reportImage(r: ReportData): Promise<Blob | null> {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = HEIGHT;
    const c = canvas.getContext('2d');
    if (!c) return null;

    // Шрифт лежит в приложении; кириллица и цифры подгружаются по требованию
    await Promise.all(
      [800, 600].map((w) => document.fonts.load(`${w} 40px Manrope`, 'Привет English 123')),
    );

    c.fillStyle = token('bg');
    c.fillRect(0, 0, SIZE, HEIGHT);

    const g = c.createLinearGradient(0, 0, SIZE, 400);
    g.addColorStop(0, '#8e50de'); // тот же градиент, что у шапки приложения
    g.addColorStop(1, token('primary-700'));
    c.fillStyle = g;
    c.beginPath();
    c.roundRect(0, 0, SIZE, 400, [0, 0, 72, 72]);
    c.fill();

    const [title, subtitle] = reportTitleLines(r);
    c.fillStyle = '#fff';
    c.font = '800 76px Manrope, sans-serif';
    c.fillText(title, 64, 150, 720);
    c.font = '600 42px Manrope, sans-serif';
    c.fillText(subtitle, 64, 225, 720);
    c.font = '600 36px Manrope, sans-serif';
    c.fillText(`Уровень ${r.level} · ${r.city}`, 64, 300, 720);

    const logo = await loadImage(`${import.meta.env.BASE_URL}logo.svg`);
    if (logo) c.drawImage(logo, SIZE - 300, 70, 250, 250);

    const w = (SIZE - 64 * 2 - 32) / 2;
    const h = 230;
    const y1 = 440;
    const y2 = y1 + h + 32;
    tile(c, 64, y1, w, h, token('lilac-soft'), r.minutes, `занятия, уроков: ${r.lessons}`);
    tile(
      c,
      64 + w + 32,
      y1,
      w,
      h,
      token('sky-soft'),
      r.listening === null ? '—' : `${r.listening}%`,
      r.delta === null
        ? 'точность на слух'
        : `на слух, ${r.delta >= 0 ? '+' : ''}${r.delta} за неделю`,
    );
    tile(c, 64, y2, w, h, token('mint-soft'), String(r.learned), 'выучено слов');
    tile(
      c,
      64 + w + 32,
      y2,
      w,
      h,
      token('yellow-soft'),
      String(r.streak),
      `стрик, лучший: ${r.best}`,
    );

    return await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  } catch {
    return null;
  }
}
