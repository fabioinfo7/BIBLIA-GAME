#!/usr/bin/env python3
"""Generate the game's local narration with Piper.

This script is intentionally offline-first: it reads the story source and calls
an already-installed Piper binary. It never sends story text to an API.

Example:
  python scripts/generate-narration-piper.py --piper ./piper --model ./models/pt_BR-model.onnx

Place the generated MP3 files under public/audio/narracao/<voice>/.
The game will automatically use them and never request a TTS service at runtime.
"""
from pathlib import Path
import argparse, re, subprocess

ROOT = Path(__file__).resolve().parents[1]
STORY = ROOT / "src/lib/story.ts"
OUT = ROOT / "public/audio/narracao"

# Conservative parser for the current story format.
PATTERN = re.compile(r'speaker:\s*"(narrador|noe)"\s*,\s*text:\s*"((?:\\.|[^"\\])*)"', re.S)

def js_unescape(s: str) -> str:
    return bytes(s, "utf-8").decode("unicode_escape")

def slug(s: str) -> str:
    s = re.sub(r"[^\w\s-]", "", s, flags=re.UNICODE).strip().lower()
    s = re.sub(r"\s+", "-", s)
    return s[:80]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--piper", default="piper")
    ap.add_argument("--model", required=True)
    ap.add_argument("--length-scale", default="1.0")
    args = ap.parse_args()
    text = STORY.read_text(encoding="utf-8")
    matches = PATTERN.findall(text)
    if not matches:
        raise SystemExit("Nenhuma fala encontrada em story.ts")
    OUT.mkdir(parents=True, exist_ok=True)
    counters = {"narrador": 0, "noe": 0}
    for speaker, raw in matches:
        counters[speaker] += 1
        phrase = js_unescape(raw)
        stem = f"{counters[speaker]:03d}-{slug(phrase)}"
        target_dir = OUT / speaker
        target_dir.mkdir(parents=True, exist_ok=True)
        wav = target_dir / f"{stem}.wav"
        mp3 = target_dir / f"{stem}.mp3"
        if mp3.exists():
            continue
        subprocess.run([args.piper, "--model", args.model, "--output_file", str(wav), "--length_scale", str(args.length_scale)], input=phrase.encode("utf-8"), check=True)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-codec:a", "libmp3lame", "-q:a", "3", str(mp3)], check=True)
        wav.unlink(missing_ok=True)
        print(mp3)

if __name__ == "__main__":
    main()
