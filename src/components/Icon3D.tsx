/** Названия файлов в public/icons/3d (Microsoft Fluent Emoji 3D, лицензия MIT). */
export type Icon3DName =
  | 'airplane'
  | 'hotel'
  | 'coffee'
  | 'briefcase'
  | 'headphone'
  | 'book'
  | 'microphone'
  | 'pencil'
  | 'fire'
  | 'lightning'
  | 'trophy'
  | 'calendar'
  | 'gear';

type Icon3DProps = {
  name: Icon3DName;
  size?: number;
  className?: string;
};

/** Объёмная иконка. Декоративная: смысл всегда продублирован текстом рядом. */
export function Icon3D({ name, size = 40, className = '' }: Icon3DProps) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}icons/3d/${name}.png`}
      alt=""
      width={size}
      height={size}
      draggable={false}
      className={`select-none ${className}`}
    />
  );
}
