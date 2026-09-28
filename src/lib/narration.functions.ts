import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Compatibilidade para projetos antigos que ainda importem `narrate`.
 * A experiência atual NÃO gera voz no servidor: a narração é local e pré-gerada.
 */
const NarrateInput = z.object({
  text: z.string().min(1).max(900),
  voice: z.enum(["narrador", "noe"]).default("narrador"),
});

export const narrate = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => NarrateInput.parse(input))
  .handler(async () => {
    throw new Error("TTS remoto desativado. Use os arquivos locais em public/audio/narracao.");
  });
