import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Иконки приложения генерируются при сборке из public/logo.svg.
// Для Android (maskable) и iPhone (apple) маскот ставится на лавандовый фон.
const background = { background: '#B57BEC' };

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, padding: 0.12, resizeOptions: background },
    apple: { ...minimal2023Preset.apple, padding: 0.12, resizeOptions: background },
  },
  images: ['public/logo.svg'],
});
