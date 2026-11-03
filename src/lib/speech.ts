// Распознавание речи для «Скажи фразу»: проверяем, умеет ли телефон, перед использованием.

type Recognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  abort(): void;
};
type RecognitionCtor = new () => Recognition;

function ctor(): RecognitionCtor | undefined {
  const w = globalThis as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

/** Нужны и сам API, и сеть: распознавание идёт на серверах Google. */
export function speechRecognitionAvailable(): boolean {
  const nav = (globalThis as { navigator?: { onLine?: boolean } }).navigator;
  return !!ctor() && nav?.onLine !== false;
}

/** Один раз послушать фразу. Возвращает варианты услышанного; пустой список — ничего не вышло. */
export function listenOnce(lang = 'en-GB'): { result: Promise<string[]>; cancel: () => void } {
  const Ctor = ctor();
  if (!Ctor) return { result: Promise.resolve([]), cancel: () => {} };
  const rec = new Ctor();
  rec.lang = lang;
  rec.interimResults = false;
  rec.maxAlternatives = 3;
  const result = new Promise<string[]>((resolve) => {
    let got: string[] = [];
    rec.onresult = (e) => {
      const first = e.results[0];
      got = first ? Array.from({ length: first.length }, (_, i) => first[i]!.transcript) : [];
    };
    rec.onerror = () => resolve([]);
    rec.onend = () => resolve(got);
    try {
      rec.start();
    } catch {
      resolve([]);
    }
  });
  return { result, cancel: () => rec.abort() };
}
