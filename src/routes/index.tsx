import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useGame } from "@/lib/game-state";
import { audio } from "@/lib/audio";
import { Scene, ToyButton } from "@/components/game/ui";
import bg from "@/assets/bg-campo.jpg";
import noe from "@/assets/noe.png";
import arca from "@/assets/arca.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "A Arca de Noé — Aventura para crianças" },
      { name: "description", content: "Jogo narrado da história de Noé para crianças de 3 a 6 anos, com minijogos, estrelas e medalhas." },
      { property: "og:title", content: "A Arca de Noé — Aventura para crianças" },
      { property: "og:description", content: "Ouça a história de Noé, supere desafios e complete o Arco da Aliança." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Start,
});

function Start() {
  const game = useGame();
  const nav = useNavigate();
  const [name, setName] = useState("");
  useEffect(() => {
    if (game.ready) setName(game.name);
  }, [game.ready, game.name]);

  const startMusic = useCallback(() => {
    audio.startWelcomeMusic();
  }, []);

  useEffect(() => {
    const startWithKeyboard = () => startMusic();
    window.addEventListener("keydown", startWithKeyboard, { once: true });
    return () => window.removeEventListener("keydown", startWithKeyboard);
  }, [startMusic]);

  return (
    <Scene bg={bg}>
      <div onPointerDownCapture={startMusic} className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center gap-2 overflow-hidden p-4 text-center sm:gap-3 sm:p-6">
        <h1 className="font-display text-outline relative z-20 text-6xl text-sky-deep sm:text-8xl">A Arca de Noé</h1>
        <div className="relative h-[43vh] min-h-72 w-full max-w-6xl">
          <img src={arca} alt="A arca" className="animate-sway absolute inset-x-0 bottom-0 z-10 mx-auto h-full w-[96%] object-contain drop-shadow-2xl sm:w-full" />
          <img src={noe} alt="Noé em pé na frente da arca" className="animate-wave-hand absolute bottom-0 left-[9%] z-20 h-[88%] max-w-[42%] object-contain drop-shadow-2xl sm:left-[16%] sm:h-[94%]" />
        </div>
        <div className="story-card relative z-30 w-full max-w-md p-4 sm:p-5">
          <label htmlFor="nome" className="font-display mb-2 block text-xl sm:text-2xl">Qual é o seu nome?</label>
          <input
            id="nome"
            value={name}
            maxLength={18}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            className="font-display mb-3 h-14 w-full rounded-2xl border-4 border-sky bg-background px-4 text-center text-2xl outline-none sm:h-16 sm:text-3xl"
          />
          <ToyButton
            color="leaf"
            className="w-full"
            onClick={() => {
               audio.startWelcomeMusic();
              game.setName(name || "Amiguinho");
              nav({ to: "/mapa" });
            }}
          >
            COMEÇAR A AVENTURA
          </ToyButton>
        </div>
        <div className="relative z-30 flex gap-3">
          <Link to="/extras" onClick={startMusic} className="toy-button font-display rounded-2xl bg-card px-5 py-3 text-lg sm:text-xl">Brincadeiras</Link>
          <Link to="/pais" onClick={startMusic} className="toy-button font-display rounded-2xl bg-card px-5 py-3 text-lg sm:text-xl">Área dos pais</Link>
        </div>
      </div>
    </Scene>
  );
}
