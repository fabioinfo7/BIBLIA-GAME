import { useCallback, useRef, useState } from "react";
import { audio } from "./audio";
import { localNarrationExists, localNarrationUrl, type LocalNarrationVoice } from "./local-narration";

type VoiceKind = LocalNarrationVoice;

/** Local-first narrator: production audio is shipped with the game itself.
 * No API call is made while the child is playing. */
const localCache = new Map<string, boolean>();
const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

function splitForNaturalFallback(text: string) {
  return text.replace(/([!?])\s+/g, "$1|PAUSE| ").replace(/\.\s+/g, ".|PAUSE| ").split("|PAUSE|").map((part) => part.trim()).filter(Boolean);
}

function chooseBrowserVoice(kind: VoiceKind) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  const pt = voices.filter((v) => v.lang.toLowerCase().startsWith("pt-br"));
  const allPt = pt.length ? pt : voices.filter((v) => v.lang.toLowerCase().startsWith("pt"));
  if (!allPt.length) return null;
  const preferred = kind === "noe"
    ? /(male|homem|brasil|brasileiro|daniel|felipe|ricardo|jorge|lucas|antonio)/i
    : /(female|mulher|brasil|brasileira|luciana|fernanda|vitoria|camila|heloisa)/i;
  return allPt.find((v) => preferred.test(`${v.name} ${v.voiceURI}`)) ?? allPt[0];
}

export function useNarrator() {
  const [speaking, setSpeaking] = useState(false);
  const [failed, setFailed] = useState(false);
  const token = useRef(0);

  const speakFallback = useCallback(async (text: string, voice: VoiceKind) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
    window.speechSynthesis.cancel();
    const parts = splitForNaturalFallback(text);
    const selected = chooseBrowserVoice(voice);
    const speakPart = (part: string) => new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(part);
      utterance.lang = "pt-BR";
      utterance.voice = selected;
      utterance.rate = voice === "noe" ? 0.86 : 0.91;
      utterance.pitch = voice === "noe" ? 0.86 : 1.04;
      utterance.volume = 1;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
    for (let i = 0; i < parts.length; i += 1) {
      await speakPart(parts[i]);
      if (i < parts.length - 1) await wait(260);
    }
    return true;
  }, []);

  const stop = useCallback(() => {
    token.current += 1;
    audio.stopNarration();
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const playLocal = useCallback(async (text: string, voice: VoiceKind) => {
    const key = `${voice}:${text}`;
    let exists = localCache.get(key);
    if (exists === undefined) {
      exists = await localNarrationExists(voice, text);
      localCache.set(key, exists);
    }
    if (!exists) return false;
    await new Promise<void>((resolve) => audio.playNarration(localNarrationUrl(voice, text), "audio/mpeg", resolve));
    return true;
  }, []);

  const speak = useCallback(async (text: string, voice: VoiceKind = "narrador") => {
    token.current += 1;
    const mine = token.current;
    audio.stopNarration();
    setSpeaking(true);
    try {
      const played = await playLocal(text, voice);
      if (mine !== token.current) return;
      if (!played) {
        const fallbackStarted = await speakFallback(text, voice);
        setFailed(!fallbackStarted);
      } else {
        setFailed(false);
      }
    } finally {
      if (mine === token.current) setSpeaking(false);
    }
  }, [playLocal, speakFallback]);

  const prefetch = useCallback(async (text: string, voice: VoiceKind = "narrador") => {
    const key = `${voice}:${text}`;
    if (localCache.has(key)) return;
    localCache.set(key, await localNarrationExists(voice, text));
  }, []);

  return { speak, stop, prefetch, speaking, failed };
}
