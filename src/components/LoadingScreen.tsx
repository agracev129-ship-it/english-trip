import { Mascot } from './Mascot';

/** Пока что-то загружается: думающий маскот вместо пустого экрана. */
export function LoadingScreen() {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg" role="status" aria-label="Загрузка">
      <Mascot state="thinking" size={120} />
    </div>
  );
}
