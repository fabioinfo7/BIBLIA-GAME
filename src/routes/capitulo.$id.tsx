import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Play, RotateCcw, ArrowRight, Star, HeartCrack, Trophy } from "lucide-react";
import { chapterById, CHAPTERS } from "@/lib/story";
import { useGame } from "@/lib/game-state";
import { useNarrator } from "@/lib/use-narrator";
import { audio } from "@/lib/audio";
import { Scene, TopBar, ToyButton } from "@/components/game/ui";
import { ActivityView } from "@/components/game/activities";
import type { GameResult } from "@/components/game/activities";
import noe from "@/assets/noe.png";

export const Route = createFileRoute("/capitulo/$id")({
  loader: ({ params }) => {
    const c = chapterById(params.id);
    if (!c) throw notFound();
    return { title: c.title };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — A Arca de Noé` },
          { name: "description", content: `Capítulo narrado: ${loaderData.title}.` },
          { property: "og:title", content: `${loaderData.title} — A Arca de Noé` },
          { property: "og:description", content: `Ouça e brinque: ${loaderData.title}.` },
        ]
      : [{ title: "Não encontrado" }, { name: "robots", content: "noindex" }],
  }),
  component: Chapter,
});

function Chapter() {
  const { id } = Route.useParams();
  const c = chapterById(id);
  if (!c) return null;
  const game = useGame();
  const nav = useNavigate();
  const narrator = useNarrator();
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<"story" | "play" | "win" | "lose">("story");
  const [runScore, setRunScore] = useState(0);
  const [result, setResult] = useState<GameResult | null>(null);

  useEffect(() => {
    setStep(0);
    setPhase("story");
    setRunScore(0);
    setResult(null);
    audio.setAmbience(c.ambience);
    return () => {
      narrator.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const beat = c.beats[step];
  const personal = (t: string) => (step === 0 && game.name ? `${game.name}, ${t.charAt(0).toLowerCase()}${t.slice(1)}` : t);

  useEffect(() => {
    if (phase !== "story" || !beat) return;
    void narrator.speak(personal(beat.text), beat.speaker === "noe" ? "noe" : "narrator");
    const next = c.beats[step + 1];
    if (next) narrator.prefetch(next.text, next.speaker === "noe" ? "noe" : "narrator");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, phase, id]);

  const finish = (gameResult: GameResult = { score: c.stars * 100, mistakes: 0 }) => {
    narrator.stop();
    const score = Math.max(gameResult.score, runScore);
    const earnedStars = score >= 700 ? 3 : score >= 400 ? 2 : 1;
    game.finishChapter(c.id, score, earnedStars, gameResult.trophy, c.medal);
    setResult({ ...gameResult, score });
    audio.sfx("success");
    setPhase("win");
  };

  const nextBeat = () => {
    if (step < c.beats.length - 1) setStep(step + 1);
    else if (c.activity) {
      narrator.stop();
      setPhase("play");
    } else finish({ score: c.stars * 150, mistakes: 0 });
  };

  const idx = CHAPTERS.findIndex((x) => x.id === c.id);
  const nextCh = CHAPTERS[idx + 1];

  return (
    <Scene bg={c.bg} rain={c.weather === "chuva"}>
      <TopBar />
      <div className="relative z-20 mx-auto flex max-w-3xl flex-col items-center gap-4 p-4 pb-10">
        <h1 className="font-display text-outline text-center text-4xl text-sky-deep">
          {c.number}. {c.title}
        </h1>

        {phase === "story" && beat && (
          <>
            <img
              src={noe}
              alt="Noé"
              className={`h-52 object-contain ${narrator.speaking ? "animate-bounce-soft" : "animate-float-soft"}`}
            />
            <div key={step} className="story-card animate-pop-in w-full p-6">
              <p className="font-display mb-1 text-lg text-mango-deep">
                {beat.speaker === "noe" ? "Noé" : "Narradora"}
              </p>
              <p className="text-2xl leading-relaxed font-bold">{personal(beat.text)}</p>
              {narrator.failed && (
                <p className="mt-2 text-base text-muted-foreground">A voz não carregou agora — peça a um adulto para ler.</p>
              )}
            </div>
            <div className="flex gap-4">
              <ToyButton
                color="sky"
                label="Ouvir de novo"
                onClick={() => narrator.speak(personal(beat.text), beat.speaker === "noe" ? "noe" : "narrator")}
              >
                <RotateCcw className="size-8" />
              </ToyButton>
              <ToyButton color="leaf" onClick={nextBeat}>
                {step < c.beats.length - 1 ? "Continuar" : c.activity ? "Vamos brincar!" : "Terminar"}
                <ArrowRight className="size-8" />
              </ToyButton>
            </div>
            <div className="flex gap-2">
              {c.beats.map((_, i) => (
                <span key={i} className={`size-3 rounded-full ${i <= step ? "bg-sun" : "bg-card"}`} />
              ))}
            </div>
          </>
        )}

        {phase === "play" && c.activity && (
          <div className="animate-pop-in relative w-full overflow-hidden rounded-3xl border-4 border-primary-foreground/40 bg-foreground/10 shadow-2xl backdrop-blur-[2px]">
            <ActivityView
              key={`${c.id}-${game.difficulty}`}
              activity={c.activity}
              difficulty={game.difficulty}
              onScore={(points) => setRunScore((score) => score + points)}
              onWin={finish}
              onLose={() => { narrator.stop(); audio.sfx("again"); setPhase("lose"); }}
            />
          </div>
        )}

        {phase === "lose" && (
          <div className="animate-pop-in rounded-3xl bg-foreground/80 p-8 text-center text-primary-foreground shadow-2xl backdrop-blur-md">
            <HeartCrack className="mx-auto mb-3 size-20 text-destructive" />
            <p className="font-display text-5xl">Vamos tentar de novo!</p>
            <p className="mt-2 text-xl font-bold">Você fez {runScore} pontos. Treine e complete a missão para avançar.</p>
            <ToyButton color="mango" className="mt-6" onClick={() => { setRunScore(0); setPhase("play"); }}>
              <RotateCcw className="size-7" /> Recomeçar fase
            </ToyButton>
          </div>
        )}

        {phase === "win" && (
          <div className="story-card animate-pop-in w-full p-8 text-center">
            <Trophy className="mx-auto mb-2 size-20 text-sun-deep" />
            <p className="font-display mb-2 text-5xl">Vitória, {game.name || "amiguinho"}!</p>
            <p className="font-display mb-4 text-2xl text-sky-deep">{result?.score ?? runScore} pontos • novo recorde salvo</p>
            <div className="mb-6 flex justify-center gap-2">
              {Array.from({ length: (result?.score ?? runScore) >= 700 ? 3 : (result?.score ?? runScore) >= 400 ? 2 : 1 }).map((_, i) => (
                <Star key={i} className="animate-bounce-soft size-16 fill-sun text-sun-deep" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
            {c.medal && <p className="font-display mb-4 text-2xl text-grape">Você ganhou uma medalha! 🏅</p>}
            <div className="flex flex-wrap justify-center gap-4">
              <ToyButton color="sky" onClick={() => { setStep(0); setRunScore(0); setResult(null); setPhase("story"); }}>
                <Play className="size-7" /> De novo
              </ToyButton>
              {nextCh ? (
                <ToyButton color="leaf" onClick={() => nav({ to: "/capitulo/$id", params: { id: nextCh.id } })}>
                  Próximo <ArrowRight className="size-7" />
                </ToyButton>
              ) : (
                <ToyButton color="sun" onClick={() => nav({ to: "/extras" })}>
                  Meu certificado
                </ToyButton>
              )}
            </div>
          </div>
        )}
      </div>
    </Scene>
  );
}
