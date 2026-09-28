/** Local narration catalog.
 *
 * The production build can ship pre-generated voice clips in
 * /public/audio/narracao/<voice>/<clip>.mp3. No TTS API is required at runtime.
 * The manifest is optional: when a clip is missing, use-narrator falls back to
 * the browser voice only as an emergency accessibility fallback.
 */

export type LocalNarrationVoice = "narrador" | "noe";

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function narrationClipId(text: string, index?: number) {
  const base = normalize(text).slice(0, 80) || "fala";
  return index == null ? base : `${String(index).padStart(3, "0")}-${base}`;
}

export function localNarrationUrl(voice: LocalNarrationVoice, text: string, index?: number) {
  return `/audio/narracao/${voice}/${narrationClipId(text, index)}.mp3`;
}

export async function localNarrationExists(voice: LocalNarrationVoice, text: string, index?: number) {
  if (typeof window === "undefined") return false;
  try {
    const response = await fetch(localNarrationUrl(voice, text, index), { method: "HEAD", cache: "force-cache" });
    return response.ok;
  } catch {
    return false;
  }
}
