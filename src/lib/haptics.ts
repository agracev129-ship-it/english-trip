// Вибрация на правильный и неправильный ответ (только Android; на iOS API нет — молча пропускаем).
let enabled = true;

export function setHaptics(on: boolean) {
  enabled = on;
}

export function buzz(kind: 'correct' | 'wrong') {
  if (!enabled || typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  try {
    navigator.vibrate(kind === 'correct' ? 30 : [60, 60, 60]);
  } catch {
    // некоторые браузеры бросают ошибку без жеста пользователя
  }
}
