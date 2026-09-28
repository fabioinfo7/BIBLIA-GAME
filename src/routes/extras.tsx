import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Award, Medal } from "lucide-react";
import { ANIMALS } from "@/lib/animals";
import { CHAPTERS } from "@/lib/story";
import { useGame, type MedalId } from "@/lib/game-state";
import { audio } from "@/lib/audio";
import { Scene, TopBar, ToyButton } from "@/components/game/ui";
import { cn } from "@/lib/utils";
import bg from "@/assets/bg-arca-interior.jpg";

export const Route = createFileRoute("/extras")({
  head: () => ({
    meta: [
      { title: "Brincadeiras e certificado — A Arca de Noé" },
      { name: "description", content: "Jogo da memória, sons dos animais, contagem, medalhas e certificado." },
      { property: "og:title", content: "Brincadeiras — A Arca de Noé" },
      { property: "og:description", content: "Memória, sons, contagem e certificado de Guardião da História." },
    ],
  }),
  component: Extras,
});

const MEDALS: { id: MedalId; label: string }[] = [
  { id: "ajudante-noe", label: "Ajudante do Noé" },
  { id: "amigo-animais", label: "Amigo dos Animais" },
  { id: "amigo-arco-iris", label: "Guardião da Aliança" },
  { id: "guardiao-historia", label: "Guardião da História" },
];

type Tab = "memoria" | "sons" | "contar" | "premios";

function Extras() {
  const [tab, setTab] = useState<Tab>("memoria");
  return (
    <Scene bg={bg}>
      <TopBar back="/" />
      <div className="mx-auto max-w-3xl p-4 pb-10">
        <div className="mb-4 flex flex-wrap justify-center gap-3">
          {(
            [
              ["memoria", "Memória"],
              ["sons", "Sons"],
              ["contar", "Contar"],
              ["premios", "Prêmios"],
            ] as const
          ).map(([t, l]) => (
            <ToyButton key={t} color={tab === t ? "sun" : "sky"} onClick={() => setTab(t)} className="min-h-14 text-xl">
              {l}
            </ToyButton>
          ))}
        </div>
        <div className="rounded-3xl bg-foreground/70 p-6 text-primary-foreground shadow-2xl backdrop-blur-md">
          {tab === "memoria" && <Memory />}
          {tab === "sons" && <Sounds />}
          {tab === "contar" && <Count />}
          {tab === "premios" && <Prizes />}
        </div>
      </div>
    </Scene>
  );
}

function Memory() {
  const [seed, setSeed] = useState(0);
  const cards = useMemo(
    () => [...ANIMALS.slice(0, 4), ...ANIMALS.slice(0, 4)].map((a, i) => ({ k: i, a })).sort(() => Math.random() - 0.5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seed],
  );
  const [open, setOpen] = useState<number[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const flip = (k: number) => {
    if (open.length === 2 || open.includes(k)) return;
    audio.sfx("pop");
    const next = [...open, k];
    setOpen(next);
    if (next.length === 2) {
      const x = cards.find((c) => c.k === next[0])!.a;
      const y = cards.find((c) => c.k === next[1])!.a;
      setTimeout(() => {
        if (x.id === y.id) {
          audio.sfx(x.sound);
          setFound((f) => [...f, x.id]);
        } else audio.sfx("again");
        setOpen([]);
      }, 800);
    }
  };
  const done = found.length === 4;
  return (
    <div className="text-center">
      <p className="font-display mb-4 text-2xl">{done ? "Você achou todos os pares!" : "Ache os pares de animais"}</p>
      <div className="grid grid-cols-4 gap-3">
        {cards.map(({ k, a }) => {
          const show = open.includes(k) || found.includes(a.id);
          return (
            <button
              key={k}
              type="button"
              aria-label={show ? a.name : "Carta virada"}
              onClick={() => flip(k)}
              className={cn("toy-button flex aspect-square items-center justify-center rounded-2xl", show ? "bg-card" : "bg-sky")}
            >
              {show ? <img src={a.image} alt="" className="h-4/5 object-contain" /> : <span className="font-display text-4xl text-primary-foreground">?</span>}
            </button>
          );
        })}
      </div>
      {done && (
        <ToyButton className="mt-4" color="leaf" onClick={() => { setFound([]); setSeed((s) => s + 1); }}>
          Jogar de novo
        </ToyButton>
      )}
    </div>
  );
}

function Sounds() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {ANIMALS.map((a) => (
        <button key={a.id} type="button" onClick={() => audio.sfx(a.sound)} className="toy-button rounded-3xl bg-card p-3">
          <img src={a.image} alt={a.name} className={cn("mx-auto h-24 object-contain", a.motion)} />
          <span className="font-display text-xl">{a.name}</span>
        </button>
      ))}
    </div>
  );
}

function Count() {
  const [round, setRound] = useState(0);
  const [n, setN] = useState(3);
  useEffect(() => setN(1 + Math.floor(Math.random() * 5)), [round]);
  const a = ANIMALS[round % ANIMALS.length]!;
  return (
    <div className="text-center">
      <p className="font-display mb-4 text-2xl">Quantos animais você vê?</p>
      <div className="mb-6 flex min-h-24 flex-wrap justify-center gap-2">
        {Array.from({ length: n }).map((_, i) => (
          <img key={i} src={a.image} alt={a.name} className="h-20 object-contain" />
        ))}
      </div>
      <div className="flex justify-center gap-3">
        {[1, 2, 3, 4, 5].map((v) => (
          <ToyButton
            key={v}
            color="mango"
            className="size-16 px-0 text-3xl"
            onClick={() => {
              if (v === n) {
                audio.sfx("success");
                setRound((r) => r + 1);
              } else audio.sfx("again");
            }}
          >
            {v}
          </ToyButton>
        ))}
      </div>
    </div>
  );
}

function Prizes() {
  const game = useGame();
  const all = game.chaptersDone.length >= CHAPTERS.length;
  useEffect(() => {
    if (all && !game.medals.includes("guardiao-historia")) game.awardMedal("guardiao-historia");
  }, [all, game]);
  return (
    <div className="text-center">
      <div className="mb-6 grid grid-cols-2 gap-3">
        {MEDALS.map((m) => {
          const has = game.medals.includes(m.id);
          return (
            <div key={m.id} className={cn("rounded-3xl bg-card p-4", !has && "opacity-40")}>
              <Medal className={cn("mx-auto size-14", has ? "text-sun-deep" : "text-muted-foreground")} />
              <p className="font-display text-lg">{m.label}</p>
            </div>
          );
        })}
      </div>
      {all ? (
        <div className="rounded-3xl border-8 border-sun bg-background p-6">
          <Award className="mx-auto size-16 text-sun-deep" />
          <p className="font-display text-2xl">Certificado</p>
          <p className="font-display text-4xl text-sky-deep">{game.name || "Amiguinho"}</p>
          <p className="text-xl font-bold">é Guardião da História de Noé!</p>
          <p className="mt-2 text-lg">{game.stars} estrelas • {game.points} pontos • {game.trophies.length} troféus</p>
          <ToyButton className="mt-4" color="leaf" onClick={() => window.print()}>Imprimir</ToyButton>
        </div>
      ) : (
        <p className="font-display text-xl">
          Termine os {CHAPTERS.length} capítulos para ganhar o certificado! ({game.chaptersDone.length}/{CHAPTERS.length})
        </p>
      )}
    </div>
  );
}
