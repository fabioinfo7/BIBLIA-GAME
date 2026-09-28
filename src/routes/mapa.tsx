import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, Check, Award, Play, Trophy } from "lucide-react";
import type { Difficulty } from "@/lib/game-state";
import { CHAPTERS } from "@/lib/story";
import { useGame } from "@/lib/game-state";
import { Scene, TopBar } from "@/components/game/ui";
import { audio } from "@/lib/audio";
import { cn } from "@/lib/utils";
import bg from "@/assets/bg-arcoiris.jpg";

export const Route = createFileRoute("/mapa")({
  head: () => ({
    meta: [
      { title: "Mapa da aventura — A Arca de Noé" },
      { name: "description", content: "Escolha o próximo capítulo da história de Noé." },
      { property: "og:title", content: "Mapa da aventura — A Arca de Noé" },
      { property: "og:description", content: "Oito capítulos para ouvir e brincar." },
    ],
  }),
  component: Mapa,
});

function Mapa() {
  const game = useGame();
  const { chaptersDone, name } = game;
  const allDone = chaptersDone.length >= CHAPTERS.length;
  const nextChapter = CHAPTERS.find((chapter) => !chaptersDone.includes(chapter.id)) ?? CHAPTERS[CHAPTERS.length - 1];
  const difficulties: { id: Difficulty; label: string }[] = [
    { id: "muito-facil", label: "Muito fácil" },
    { id: "facil", label: "Fácil" },
    { id: "medio", label: "Médio" },
    { id: "dificil", label: "Difícil" },
  ];
  return (
    <Scene bg={bg}>
      <TopBar back="/" />
      <div className="mx-auto max-w-4xl p-4 pb-12">
        <h1 className="font-display text-outline mb-6 text-center text-5xl text-sky-deep">
          Olá, {name || "amiguinho"}!
        </h1>
        <div className="mb-5 flex flex-wrap justify-center gap-2" aria-label="Escolha a dificuldade">
          {difficulties.map((level) => (
            <button key={level.id} type="button" onClick={() => game.setDifficulty(level.id)} className={cn("toy-button font-display rounded-2xl px-4 py-3 text-lg", game.difficulty === level.id ? "bg-sun" : "bg-card/90")}>
              {level.label}
            </button>
          ))}
        </div>
        {nextChapter && (
          <Link to="/capitulo/$id" params={{ id: nextChapter.id }} onClick={() => { audio.unlock(); audio.sfx("tap"); }} className="toy-button font-display mx-auto mb-6 flex w-fit items-center gap-3 rounded-2xl bg-leaf px-6 py-3 text-xl text-primary-foreground">
            <Play className="size-7 fill-current" /> Continuar aventura
          </Link>
        )}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {CHAPTERS.map((c, i) => {
            const done = chaptersDone.includes(c.id);
            const open = i === 0 || chaptersDone.includes(CHAPTERS[i - 1]!.id) || done;
            const card = (
              <div
                className={cn(
                  "story-card flex h-full flex-col items-center gap-2 p-4 text-center",
                  open ? "animate-pop-in" : "opacity-60",
                  open && !done && "drop-target-glow",
                )}
              >
                <div className="font-display flex size-16 items-center justify-center rounded-full bg-sun text-3xl">
                  {done ? <Check className="size-9" /> : open ? c.number : <Lock className="size-8" />}
                </div>
                <span className="font-display text-xl leading-tight">{c.title}</span>
                <span className="flex items-center gap-1 text-sm font-extrabold"><Trophy className="size-4" /> {game.chapterScores[c.id] ?? 0} pts</span>
              </div>
            );
            return open ? (
              <Link key={c.id} to="/capitulo/$id" params={{ id: c.id }} onClick={() => { audio.unlock(); audio.sfx("tap"); }}>
                {card}
              </Link>
            ) : (
              <div key={c.id}>{card}</div>
            );
          })}
        </div>
        {allDone && (
          <Link
            to="/extras"
            className="toy-button font-display mx-auto mt-8 flex w-fit items-center gap-3 rounded-3xl bg-sun px-8 py-4 text-2xl"
          >
            <Award className="size-8" /> Ver meu certificado
          </Link>
        )}
      </div>
    </Scene>
  );
}
