#!/usr/bin/env python3
"""Generate the game's local narration with Microsoft Edge TTS (edge-tts).

Substitui o script Piper por vozes neurais online da Microsoft, que são
gratuitas e de alta qualidade em pt-BR. Requer apenas `edge-tts` e `ffmpeg`
— sem modelo local, sem GPU.

Instalação:
  pip install edge-tts

Uso básico (vozes padrão do projeto):
  python scripts/generate-narration-edge-tts.py

Escolher outras vozes manualmente:
  python scripts/generate-narration-edge-tts.py \
      --voice-narrador pt-BR-AntonioNeural \
      --voice-noe     pt-BR-FranciscaNeural

Listar todas as vozes pt-BR disponíveis:
  python scripts/generate-narration-edge-tts.py --list-voices

Os arquivos MP3 são gerados em public/audio/narracao/<speaker>/<clip>.mp3
e o jogo os usa automaticamente, sem chamadas a qualquer API em tempo de
execução.

Vozes pt-BR disponíveis (referência rápida):
  Masculinas : pt-BR-AntonioNeural, pt-BR-BentoNeural, pt-BR-DonatoNeural,
               pt-BR-FabioNeural, pt-BR-HumbertoNeural, pt-BR-JulioNeural,
               pt-BR-NicolasNeural
  Femininas  : pt-BR-FranciscaNeural, pt-BR-BrendaNeural, pt-BR-ElzaNeural,
               pt-BR-GiovannaNeural, pt-BR-LeticiaNeural, pt-BR-ManuelaNeural,
               pt-BR-ThalitaNeural, pt-BR-YaraNeural
"""

from pathlib import Path
import argparse
import asyncio
import re
import subprocess
import sys

try:
    import edge_tts
except ImportError:
    sys.exit(
        "edge-tts não encontrado.\n"
        "Instale com:  pip install edge-tts\n"
        "Depois rode o script novamente."
    )

ROOT = Path(__file__).resolve().parents[1]
STORY = ROOT / "src/lib/story.ts"
OUT = ROOT / "public/audio/narracao"

# Vozes padrão do projeto — Antônio (narrador adulto) e Francisca (Noé jovem).
# Altere aqui ou passe --voice-narrador / --voice-noe na linha de comando.
DEFAULT_VOICES: dict[str, str] = {
    "narrador": "pt-BR-AntonioNeural",
    "noe":      "pt-BR-FranciscaNeural",
}

# Taxas de fala por personagem (0.0 = normal, -10% = mais devagar).
# Edge TTS aceita valores como "+10%", "-5%", "+0%".
RATE: dict[str, str] = {
    "narrador": "-5%",   # narrador calmo, ligeiramente mais lento
    "noe":      "+0%",   # Noé em ritmo natural
}

# Parser para o formato atual de story.ts
PATTERN = re.compile(
    r'speaker:\s*"(narrador|noe)"\s*,\s*text:\s*"((?:\\.|[^"\\])*)"',
    re.S,
)


def js_unescape(s: str) -> str:
    return bytes(s, "utf-8").decode("unicode_escape")


def slug(s: str) -> str:
    import unicodedata
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"[^\w\s-]", "", s, flags=re.UNICODE).strip().lower()
    s = re.sub(r"\s+", "-", s)
    return s[:80]


async def generate_clip(
    text: str,
    voice: str,
    rate: str,
    out_mp3: Path,
) -> None:
    """Gera um único clipe MP3 via Edge TTS."""
    tmp_mp3 = out_mp3.with_suffix(".tmp.mp3")
    communicate = edge_tts.Communicate(text, voice, rate=rate)
    await communicate.save(str(tmp_mp3))
    # Recodifica com ffmpeg para garantir bitrate uniforme (VBR q3 ≈ 128 kbps)
    subprocess.run(
        [
            "ffmpeg", "-y", "-loglevel", "error",
            "-i", str(tmp_mp3),
            "-codec:a", "libmp3lame", "-q:a", "3",
            str(out_mp3),
        ],
        check=True,
    )
    tmp_mp3.unlink(missing_ok=True)


async def list_voices() -> None:
    voices = await edge_tts.list_voices()
    pt_voices = [v for v in voices if v["Locale"].lower().startswith("pt-br")]
    print(f"\n{'Nome':<35} {'Gênero':<10} {'Locale'}")
    print("-" * 60)
    for v in sorted(pt_voices, key=lambda x: x["ShortName"]):
        print(f"{v['ShortName']:<35} {v['Gender']:<10} {v['Locale']}")
    print()


async def main_async(args: argparse.Namespace) -> None:
    if args.list_voices:
        await list_voices()
        return

    if not STORY.exists():
        sys.exit(f"Arquivo não encontrado: {STORY}\n"
                 "Rode o script a partir da raiz do projeto.")

    voices = {
        "narrador": args.voice_narrador or DEFAULT_VOICES["narrador"],
        "noe":      args.voice_noe      or DEFAULT_VOICES["noe"],
    }

    text = STORY.read_text(encoding="utf-8")
    matches = PATTERN.findall(text)
    if not matches:
        sys.exit("Nenhuma fala encontrada em story.ts. Verifique o formato do arquivo.")

    OUT.mkdir(parents=True, exist_ok=True)
    counters: dict[str, int] = {"narrador": 0, "noe": 0}
    skipped = 0
    generated = 0

    print(f"Vozes configuradas:")
    print(f"  narrador → {voices['narrador']}  (rate {RATE['narrador']})")
    print(f"  noe      → {voices['noe']}  (rate {RATE['noe']})")
    print(f"\nTotal de falas encontradas: {len(matches)}\n")

    for speaker, raw in matches:
        counters[speaker] += 1
        phrase = js_unescape(raw)
        stem = f"{counters[speaker]:03d}-{slug(phrase)}"
        target_dir = OUT / speaker
        target_dir.mkdir(parents=True, exist_ok=True)
        mp3 = target_dir / f"{stem}.mp3"

        if mp3.exists() and not args.force:
            skipped += 1
            continue

        print(f"[{speaker}] {counters[speaker]:03d} → {mp3.name}")
        try:
            await generate_clip(phrase, voices[speaker], RATE[speaker], mp3)
            generated += 1
        except Exception as exc:
            print(f"  ERRO: {exc}", file=sys.stderr)
            # Continua gerando os demais clipes mesmo se um falhar

    print(f"\nConcluído: {generated} gerado(s), {skipped} já existia(m).")
    if skipped:
        print("Use --force para regenerar os clipes existentes.")


def main() -> None:
    ap = argparse.ArgumentParser(
        description="Gera narração do jogo usando Microsoft Edge TTS.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    ap.add_argument(
        "--voice-narrador",
        metavar="VOICE",
        help=f"Voz Edge TTS para o narrador (padrão: {DEFAULT_VOICES['narrador']})",
    )
    ap.add_argument(
        "--voice-noe",
        metavar="VOICE",
        help=f"Voz Edge TTS para Noé (padrão: {DEFAULT_VOICES['noe']})",
    )
    ap.add_argument(
        "--force",
        action="store_true",
        help="Regenera clipes mesmo que o MP3 já exista",
    )
    ap.add_argument(
        "--list-voices",
        action="store_true",
        help="Lista todas as vozes pt-BR disponíveis e sai",
    )
    args = ap.parse_args()
    asyncio.run(main_async(args))


if __name__ == "__main__":
    main()
