import { Link } from "@tanstack/react-router";
import { Home, Star, Volume2, VolumeX, Map, Trophy } from "lucide-react";
import type { ReactNode } from "react";
import { useGame } from "@/lib/game-state";
import { audio } from "@/lib/audio";
import { cn } from "@/lib/utils";

export function ToyButton({
  children,
  onClick,
  color = "sun",
  className,
  disabled,
  label,
}: {
  children: ReactNode;
  onClick?: () => void;
  color?: "sun" | "leaf" | "sky" | "mango" | "grape";
  className?: string;
  disabled?: boolean;
  label?: string;
}) {
  const colors = {
    sun: "bg-sun text-foreground",
    leaf: "bg-leaf text-primary-foreground",
    sky: "bg-sky text-primary-foreground",
    mango: "bg-mango text-primary-foreground",
    grape: "bg-grape text-primary-foreground",
  };
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={() => {
        audio.unlock();
        audio.sfx("tap");
        onClick?.();
      }}
      className={cn(
        "toy-button font-display inline-flex min-h-16 items-center justify-center gap-3 rounded-3xl px-7 text-2xl active:scale-95 disabled:opacity-50",
        colors[color],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function TopBar({ back = "/mapa" }: { back?: "/" | "/mapa" }) {
  const { stars, points, trophies, audioOn, toggleAudio, name } = useGame();
  return (
    <div className="relative z-20 flex items-center justify-between gap-3 p-3">
      <Link
        to={back}
        aria-label="Voltar"
        onClick={() => audio.sfx("tap")}
        className="toy-button flex size-14 items-center justify-center rounded-2xl bg-card text-foreground"
      >
        {back === "/" ? <Home className="size-8" /> : <Map className="size-8" />}
      </Link>
      <div className="font-display flex items-center gap-3 rounded-2xl bg-foreground/75 px-4 py-2 text-xl text-primary-foreground shadow-lg backdrop-blur-md">
        <Star className="size-8 fill-sun text-sun-deep" />
        {stars}
        <span className="hidden sm:inline">{points} pts</span>
        <Trophy className="ml-1 size-6 text-sun" /> {trophies.length}
        {name && <span className="ml-3 hidden text-xl sm:inline">{name}</span>}
      </div>
      <button
        type="button"
        aria-label={audioOn ? "Desligar som" : "Ligar som"}
        onClick={() => { audio.unlock(); toggleAudio(); }}
        className="toy-button flex size-14 items-center justify-center rounded-2xl bg-card text-foreground"
      >
        {audioOn ? <Volume2 className="size-8" /> : <VolumeX className="size-8" />}
      </button>
    </div>
  );
}

export function Scene({ bg, children, rain }: { bg: string; children: ReactNode; rain?: boolean }) {
  return (
    <div
      className="relative min-h-screen overflow-hidden bg-sky bg-cover bg-center"
      style={{ backgroundImage: `url(${bg})` }}
    >
      {rain && (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-10">
          {Array.from({ length: 40 }).map((_, i) => (
            <span
              key={i}
              className="absolute top-[-10%] h-8 w-1 rounded-full bg-primary-foreground/60"
              style={{
                left: `${(i * 37) % 100}%`,
                animation: `rain-fall ${0.8 + (i % 5) * 0.15}s linear ${(i % 7) * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      )}
      {children}
    </div>
  );
}
