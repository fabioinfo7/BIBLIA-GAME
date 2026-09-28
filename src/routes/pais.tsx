import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CHAPTERS } from "@/lib/story";
import { useGame } from "@/lib/game-state";
import { TopBar, ToyButton } from "@/components/game/ui";

export const Route = createFileRoute("/pais")({
  head: () => ({
    meta: [
      { title: "Área dos pais — A Arca de Noé" },
      { name: "description", content: "Acompanhe o progresso da criança e ajuste som e dados." },
      { property: "og:title", content: "Área dos pais — A Arca de Noé" },
      { property: "og:description", content: "Progresso, medalhas e configurações." },
    ],
  }),
  component: Pais,
});

function Pais() {
  const game = useGame();
  const [q] = useState(() => ({ a: 3 + Math.floor(Math.random() * 5), b: 4 + Math.floor(Math.random() * 5) }));
  const [ans, setAns] = useState("");
  const unlocked = Number(ans) === q.a * q.b;
  return (
    <div className="min-h-screen bg-sky/30">
      <TopBar back="/" />
      <div className="mx-auto max-w-xl p-4">
        <div className="story-card p-6">
          <h1 className="font-display mb-4 text-3xl">Área dos pais</h1>
          {!unlocked ? (
            <>
              <label className="mb-2 block text-lg font-bold">Para entrar, responda: quanto é {q.a} × {q.b}?</label>
              <input
                inputMode="numeric"
                value={ans}
                onChange={(e) => setAns(e.target.value)}
                className="h-14 w-full rounded-2xl border-4 border-sky bg-background px-4 text-2xl"
              />
            </>
          ) : (
            <div className="space-y-4 text-lg">
              <p><b>Criança:</b> {game.name || "—"}</p>
              <p><b>Estrelas:</b> {game.stars}</p>
              <p><b>Pontuação total:</b> {game.points}</p>
              <p><b>Dificuldade:</b> {game.difficulty.replace("-", " ")}</p>
              <p><b>Capítulos:</b> {game.chaptersDone.length} de {CHAPTERS.length}</p>
              <ul className="list-disc pl-6">
                {CHAPTERS.map((c) => (
                  <li key={c.id}>{c.title} {game.chaptersDone.includes(c.id) ? `✓ ${game.chapterScores[c.id] ?? 0} pontos` : "— falta completar"}</li>
                ))}
              </ul>
              <p><b>Medalhas:</b> {game.medals.length} de 4</p>
              <p><b>Troféus:</b> {game.trophies.length} de 8</p>
              <p className="text-base text-muted-foreground">
                O progresso fica salvo apenas neste aparelho. A narração é gerada por voz de IA e precisa de internet.
                Recomendamos sessões curtas de 15 a 20 minutos.
              </p>
              <div className="flex flex-wrap gap-3">
                <ToyButton color="sky" onClick={game.toggleAudio}>Som: {game.audioOn ? "ligado" : "desligado"}</ToyButton>
                <ToyButton color="mango" onClick={() => confirm("Apagar todo o progresso?") && game.reset()}>
                  Recomeçar
                </ToyButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
