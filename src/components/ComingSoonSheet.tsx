import { BottomSheet } from './BottomSheet';
import { Mascot } from './Mascot';
import { PillButton } from './PillButton';

type ComingSoonSheetProps = {
  /** Что именно появится; null — панель закрыта */
  feature: string | null;
  onClose: () => void;
};

/** Временная заглушка для кнопок, которые оживут на следующих этапах. */
export function ComingSoonSheet({ feature, onClose }: ComingSoonSheetProps) {
  return (
    <BottomSheet open={feature !== null} onClose={onClose} title="Скоро здесь">
      <div className="flex flex-col items-center gap-4 pt-2 text-center">
        <div className="rounded-full bg-lilac-soft p-3">
          <Mascot state="thinking" size={96} />
        </div>
        <p className="text-base text-muted">
          <span className="font-bold text-ink">{feature}</span> — это появится в следующих
          обновлениях. Приложение пока собирается по частям.
        </p>
        <PillButton fullWidth onClick={onClose}>
          Понятно
        </PillButton>
      </div>
    </BottomSheet>
  );
}
