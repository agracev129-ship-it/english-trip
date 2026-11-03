// Запись голоса для шэдоуинга: проверяем, умеет ли телефон, перед использованием.

export function canRecordAudio(): boolean {
  return typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;
}

/** Подходящий формат записи: Chrome — webm, Safari — mp4. */
export function recordingMime(): string | undefined {
  return ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((m) =>
    MediaRecorder.isTypeSupported(m),
  );
}
