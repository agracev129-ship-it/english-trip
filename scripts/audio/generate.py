"""Озвучка списка фраз (PROJECT.md, раздел 8.2). Запускается из run.ts, вручную не нужен.

Для каждой фразы:
  1. Kokoro генерирует WAV на скорости 1.0 (скорость меняется уже в приложении).
  2. ffmpeg обрезает тишину по краям, выравнивает громкость, кодирует mp3 mono 64 kbps.
  3. faster-whisper размечает время каждого слова → {id}.json: [{"w", "start", "end"}].
     Если разметка ненадёжна, файл таймингов не пишется — приложение подсветит реплику целиком.
"""

import argparse
import difflib
import json
import os
import re
import subprocess
import sys
import tempfile
import time
import warnings

warnings.filterwarnings("ignore")
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")

import numpy as np  # noqa: E402
import soundfile as sf  # noqa: E402

SAMPLE_RATE = 24000
FFMPEG_FILTER = ",".join(
    [
        # Тишина в начале и в конце (через разворот), затем нормализация громкости
        "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03",
        "areverse",
        "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03",
        "areverse",
        "loudnorm=I=-18:TP=-1.5:LRA=11",
        # Небольшие поля, чтобы начало не съедалось при старте воспроизведения на телефоне
        "adelay=60",
        "apad=pad_dur=0.15",
    ]
)


def log(msg: str) -> None:
    print(msg, flush=True)


def norm(word: str) -> str:
    return re.sub(r"[^a-z0-9']", "", word.lower().replace("’", "'"))


def spread(tokens, start, end):
    """Делит отрезок времени между словами пропорционально их длине."""
    weights = [max(len(norm(t)), 1) for t in tokens]
    total = sum(weights)
    out, t = [], start
    for w in weights:
        d = (end - start) * w / total
        out.append((t, t + d))
        t += d
    return out


def align(text: str, words, duration: float):
    """Сопоставляет слова исходного текста со словами, которые распознал Whisper."""
    tokens = text.split()
    heard = [(w.word.strip(), w.start, w.end) for w in words]
    if not tokens or not heard:
        return None, 0.0
    a = [norm(t) for t in tokens]
    b = [norm(w[0]) for w in heard]
    times = [None] * len(tokens)
    equal = 0
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes():
        if tag == "equal":
            for k in range(i2 - i1):
                times[i1 + k] = (heard[j1 + k][1], heard[j1 + k][2])
            equal += i2 - i1
        elif tag == "replace":
            # Например, «ten fifteen» ↔ «10:15»: делим время распознанного куска между словами
            for k, span in enumerate(spread(tokens[i1:i2], heard[j1][1], heard[j2 - 1][2])):
                times[i1 + k] = span
    # Слова, которых Whisper не услышал, — между соседями
    i = 0
    while i < len(times):
        if times[i] is not None:
            i += 1
            continue
        j = i
        while j < len(times) and times[j] is None:
            j += 1
        start = times[i - 1][1] if i > 0 else 0.0
        end = times[j][0] if j < len(times) else duration
        if end <= start:
            end = start + 0.05 * (j - i)
        for k, span in enumerate(spread(tokens[i:j], start, end)):
            times[i + k] = span
        i = j
    out = [
        {"w": t, "start": round(s, 2), "end": round(max(e, s + 0.05), 2)}
        for t, (s, e) in zip(tokens, times)
    ]
    return out, equal / len(tokens)


def ffmpeg_mp3(wav_path: str, mp3_path: str) -> None:
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", wav_path, "-af", FFMPEG_FILTER,
         "-ac", "1", "-ar", str(SAMPLE_RATE), "-c:a", "libmp3lame", "-b:a", "64k", mp3_path],
        check=True,
    )


def decode_16k(path: str) -> np.ndarray:
    """mp3 → float32 mono 16 кГц для Whisper. Декодируем сами через ffmpeg:
    встроенный декодер faster-whisper (PyAV) несовместим со свежими версиями av."""
    out = subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", "16000", "-"],
        check=True, capture_output=True,
    )
    return np.frombuffer(out.stdout, dtype=np.float32)


def probe_duration(path: str) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
        check=True, capture_output=True, text=True,
    )
    return round(float(out.stdout.strip()), 2)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--jobs", required=True, help="JSON: [{id, voice, text}]")
    ap.add_argument("--out", required=True, help="папка для mp3 и json")
    ap.add_argument("--results", required=True, help="куда записать итоги")
    ap.add_argument("--whisper", default="small.en", help="модель faster-whisper")
    args = ap.parse_args()

    with open(args.jobs, encoding="utf-8") as f:
        jobs = json.load(f)
    os.makedirs(args.out, exist_ok=True)

    log("Загружаю Kokoro и Whisper (первый раз скачиваются модели, это несколько минут)...")
    from kokoro import KPipeline
    from faster_whisper import WhisperModel

    pipelines = {}

    def pipeline_for(voice: str):
        lang = voice[0]  # a — американский, b — британский
        if lang not in pipelines:
            pipelines[lang] = KPipeline(lang_code=lang, repo_id="hexgrad/Kokoro-82M")
        return pipelines[lang]

    whisper = WhisperModel(args.whisper, device="cpu", compute_type="int8")

    results, started = [], time.time()
    with tempfile.TemporaryDirectory() as tmp:
        for n, job in enumerate(jobs, 1):
            jid, voice, text = job["id"], job["voice"], job["text"]
            parts = [r.audio.numpy() for r in pipeline_for(voice)(text, voice=voice, speed=1.0)
                     if r.audio is not None]
            if not parts:
                log(f"  ✗ {jid}: Kokoro не вернул звук для «{text}»")
                continue
            wav = os.path.join(tmp, f"{jid}.wav")
            sf.write(wav, np.concatenate(parts), SAMPLE_RATE)
            mp3 = os.path.join(args.out, f"{jid}.mp3")
            ffmpeg_mp3(wav, mp3)
            duration = probe_duration(mp3)

            timings, quality = None, 1.0
            if len(text.split()) > 1:
                segments, _ = whisper.transcribe(
                    decode_16k(mp3), language="en", word_timestamps=True, initial_prompt=text,
                    beam_size=5, condition_on_previous_text=False, vad_filter=False,
                )
                words = [w for s in segments for w in (s.words or [])]
                timings, quality = align(text, words, duration)
                if timings and quality >= 0.5:
                    with open(os.path.join(args.out, f"{jid}.json"), "w", encoding="utf-8") as f:
                        json.dump(timings, f, ensure_ascii=False, separators=(",", ":"))
                else:
                    log(f"  ! {jid}: разметка слов ненадёжна ({quality:.0%}), будет подсветка всей фразы")
                    timings = None

            results.append({"id": jid, "duration": duration, "timings": timings is not None,
                            "quality": round(quality, 2)})
            log(f"  [{n}/{len(jobs)}] {jid} {duration:.1f}s «{text[:60]}»")

    with open(args.results, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False)
    log(f"Готово за {time.time() - started:.0f} с: {len(results)} из {len(jobs)}")
    return 0 if len(results) == len(jobs) else 1


if __name__ == "__main__":
    sys.exit(main())
