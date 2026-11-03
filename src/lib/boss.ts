// Условие победы над боссом недели: успеть и ответить верно хотя бы на 60%.
export const BOSS_PASS = 0.6;

export function bossWon(right: number, total: number, secondsLeft: number): boolean {
  return total > 0 && secondsLeft >= 0 && right / total >= BOSS_PASS;
}
