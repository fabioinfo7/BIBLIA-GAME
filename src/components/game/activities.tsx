import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Apple, Axe, Car, Carrot, Cloud, Fish, Hammer, Heart, Home, Leaf, Ruler, Ship, Star, Wheat, X } from "lucide-react";
import type { Activity } from "@/lib/story";
import type { Difficulty, TrophyId } from "@/lib/game-state";
import { ANIMALS } from "@/lib/animals";
import { audio } from "@/lib/audio";
import { useDragItem } from "@/lib/use-drag";
import arca from "@/assets/arca.png";
import pomba from "@/assets/pomba.png";
import { cn } from "@/lib/utils";

export type GameResult = { score: number; mistakes: number; trophy?: TrophyId };
type Props = {
  difficulty: Difficulty;
  onWin: (result: GameResult) => void;
  onLose: () => void;
  onScore: (points: number) => void;
};

type Rules = { lives: number; rounds: number; speed: number; target: number; options: number };
const RULES: Record<Difficulty, Rules> = {
  "muito-facil": { lives: 5, rounds: 2, speed: 2600, target: 10, options: 3 },
  facil: { lives: 4, rounds: 3, speed: 2200, target: 10, options: 4 },
  medio: { lives: 3, rounds: 4, speed: 1750, target: 10, options: 5 },
  dificil: { lives: 2, rounds: 5, speed: 1350, target: 10, options: 6 },
};

const ICONS: Record<string, typeof Ship> = { arca: Ship, casa: Home, carro: Car, aquario: Fish };

function MissionHud({ title, progress, lives }: { title: string; progress: string; lives: number }) {
  return (
    <div className="absolute inset-x-3 top-3 z-30 flex items-center justify-between gap-2 rounded-2xl bg-foreground/75 px-4 py-2 text-primary-foreground shadow-lg backdrop-blur-md">
      <strong className="font-display truncate text-lg sm:text-2xl">{title}</strong>
      <span className="font-display whitespace-nowrap text-lg">{progress}</span>
      <span className="flex items-center gap-1" aria-label={`${lives} vidas`}>
        {Array.from({ length: Math.max(lives, 0) }).map((_, i) => <Heart key={i} className="size-5 fill-destructive text-destructive" />)}
      </span>
    </div>
  );
}

function Quiz({ a, difficulty, onWin, onLose, onScore }: Props & { a: Extract<Activity, { kind: "quiz" }> }) {
  const rules = RULES[difficulty];
  const [lives, setLives] = useState(rules.lives);
  const [round, setRound] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const questions = [
    a,
    { ...a, question: "Quem obedeceu a Deus?", options: [{ id: "noe", label: "Noé", icon: "arca" }, { id: "rei", label: "Um rei", icon: "casa" }, { id: "soldado", label: "Soldado", icon: "carro" }], correct: "noe" },
    { ...a, question: "Quem ficaria seguro na arca?", options: [{ id: "familia", label: "Família e animais", icon: "arca" }, { id: "carros", label: "Carros", icon: "carro" }, { id: "peixes", label: "Só peixes", icon: "aquario" }], correct: "familia" },
  ];
  const q = questions[round % questions.length] ?? a;
  return (
    <div className="relative min-h-[520px] pt-20 text-center">
      <MissionHud title={q.question} progress={`${round}/${rules.rounds}`} lives={lives} />
      <div className="grid grid-cols-2 gap-4 px-3 pt-10 sm:px-12">
        {q.options.slice(0, Math.min(rules.options, q.options.length)).map((o) => {
          const Icon = ICONS[o.icon] ?? Ship;
          return (
            <button key={o.id} type="button" onClick={() => {
              if (o.id === q.correct) {
                audio.sfx("success"); onScore(120);
                const next = round + 1;
                if (next >= rules.rounds) onWin(mistakes === 0
                  ? { score: next * 120 + lives * 40, mistakes, trophy: "sem-erros" }
                  : { score: next * 120 + lives * 40, mistakes });
                else setRound(next);
              } else {
                audio.sfx("again"); setMistakes((v) => v + 1); const next = lives - 1; setLives(next); if (next <= 0) onLose();
              }
            }} className="toy-button flex min-h-40 flex-col items-center justify-center gap-2 rounded-3xl bg-card/90 p-4 active:scale-95">
              {o.id === "arca" || o.id === "noe" || o.id === "familia" ? <img src={arca} alt="" className="h-24 object-contain" /> : <Icon className="size-20 text-sky-deep" />}
              <span className="font-display text-xl sm:text-2xl">{o.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const WORDS = [
  { word: "NOÉ", missing: 1, hint: "Homem que obedeceu a Deus" },
  { word: "DEUS", missing: 1, hint: "Falou com Noé" },
  { word: "FÉ", missing: 0, hint: "Confiar em Deus" },
  { word: "BEM", missing: 1, hint: "Noé procurava fazer o..." },
];
function Palavras({ difficulty, onWin, onLose, onScore }: Props) {
  const rules = RULES[difficulty];
  const [round, setRound] = useState(0);
  const [lives, setLives] = useState(rules.lives);
  const [mistakes, setMistakes] = useState(0);
  const item = WORDS[round % WORDS.length] ?? WORDS[0];
  if (!item) return null;
  const answer = item.word[item.missing];
  const letters = Array.from(new Set([answer, "A", "O", "E", "U", "M"])).slice(0, rules.options);
  return (
    <div className="relative flex min-h-[520px] flex-col items-center justify-center pt-20 text-center">
      <MissionHud title={item.hint} progress={`${round}/${rules.rounds}`} lives={lives} />
      <div className="font-display mb-10 flex gap-3 text-7xl text-primary-foreground drop-shadow-lg">
        {[...item.word].map((letter, i) => <span key={i} className="border-b-8 border-sun px-2">{i === item.missing ? "_" : letter}</span>)}
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        {letters.sort(() => Math.random() - 0.5).map((letter) => <button key={letter} type="button" className="toy-button font-display size-20 rounded-2xl bg-sun text-4xl" onClick={() => {
          if (letter === answer) { audio.sfx("star"); onScore(150); const next = round + 1; if (next >= rules.rounds) onWin({ score: next * 150 + lives * 50, mistakes, trophy: "mestre-palavras" }); else setRound(next); }
          else { audio.sfx("again"); setMistakes((v) => v + 1); const next = lives - 1; setLives(next); if (next <= 0) onLose(); }
        }}>{letter}</button>)}
      </div>
    </div>
  );
}

type SortItem = { id: string; label: string; basket: string; node: React.ReactNode };
function SortPiece({ item, targets, onDrop }: { item: SortItem; targets: () => Record<string, HTMLElement | null>; onDrop: (target: string) => void }) {
  const drag = useDragItem({ targets, onDrop: (id) => { onDrop(id); return id === item.basket; } });
  return <div {...drag.handlers} style={drag.style} className="toy-button flex size-20 cursor-grab items-center justify-center rounded-2xl bg-card/90" aria-label={item.label}>{item.node}</div>;
}

function Construir({ difficulty, onWin, onLose, onScore }: Props) {
  const rules = RULES[difficulty];
  const [lives, setLives] = useState(rules.lives);
  const [mistakes, setMistakes] = useState(0);
  const [done, setDone] = useState<string[]>([]);
  const correct = [
    { id: "madeira", label: "Madeira", Icon: Ruler }, { id: "martelo", label: "Martelo", Icon: Hammer }, { id: "machado", label: "Machado", Icon: Axe },
  ].slice(0, Math.min(3, rules.rounds));
  const wrong = [{ id: "maca", label: "Maçã", Icon: Apple }, { id: "carro", label: "Carro", Icon: Car }];
  return (
    <div className="relative min-h-[520px] pt-20 text-center">
      <MissionHud title="Escolha o que ajuda a construir a arca" progress={`${done.length}/${correct.length}`} lives={lives} />
      <img src={arca} alt="Arca sendo construída" className={cn("mx-auto mt-4 w-3/4 max-w-xl object-contain transition-all", done.length ? "animate-sway" : "opacity-70")} />
      <div className="absolute inset-x-3 bottom-5 flex flex-wrap justify-center gap-3">
        {[...correct, ...wrong].filter((x) => !done.includes(x.id)).map(({ id, label, Icon }) => <button key={id} type="button" className="toy-button flex size-20 items-center justify-center rounded-2xl bg-card/90" aria-label={label} onClick={() => {
          if (correct.some((x) => x.id === id)) { audio.sfx(id === "madeira" ? "wood" : "hammer"); onScore(120); const next = [...done, id]; setDone(next); if (next.length === correct.length) onWin({ score: next.length * 120 + lives * 40, mistakes }); }
          else { audio.sfx("again"); setMistakes((v) => v + 1); const next = lives - 1; setLives(next); if (next <= 0) onLose(); }
        }}><Icon className="size-12 text-wood" /></button>)}
      </div>
    </div>
  );
}

const MAZE_WALLS = [
  { x: 22, y: 12, w: 8, h: 54 }, { x: 46, y: 35, w: 8, h: 55 }, { x: 68, y: 8, w: 8, h: 52 },
];
function Labirinto({ difficulty, onWin, onLose, onScore }: Props) {
  const rules = RULES[difficulty];
  const board = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 5, y: 76 });
  const [animalIndex, setAnimalIndex] = useState(0);
  const [lives, setLives] = useState(rules.lives);
  const needed = Math.min(rules.rounds, ANIMALS.length - 1);
  const animal = ANIMALS[animalIndex] ?? ANIMALS[0];
  const move = (clientX: number, clientY: number) => {
    const rect = board.current?.getBoundingClientRect(); if (!rect) return;
    const x = Math.max(2, Math.min(90, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(12, Math.min(82, ((clientY - rect.top) / rect.height) * 100));
    const hit = MAZE_WALLS.some((w) => x + 7 > w.x && x < w.x + w.w && y + 10 > w.y && y < w.y + w.h);
    if (hit) { audio.sfx("again"); const next = lives - 1; setLives(next); setPos({ x: 5, y: 76 }); if (next <= 0) onLose(); return; }
    setPos({ x, y });
    if (x > 80 && y < 30) { audio.sfx(animal?.sound ?? "success"); onScore(200); const next = animalIndex + 1; if (next >= needed) onWin({ score: needed * 200 + lives * 60, mistakes: rules.lives - lives, trophy: "guia-animais" }); else { setAnimalIndex(next); setPos({ x: 5, y: 76 }); } }
  };
  return (
    <div ref={board} className="relative min-h-[560px] touch-none overflow-hidden" onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); move(e.clientX, e.clientY); }} onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) move(e.clientX, e.clientY); }}>
      <MissionHud title="Leve o animal pelo caminho até a arca" progress={`${animalIndex}/${needed}`} lives={lives} />
      <img src={arca} alt="Entrada da arca" className="absolute right-0 top-14 w-40 animate-sway sm:w-56" />
      {MAZE_WALLS.map((wall, i) => <div key={i} className="absolute rounded-xl border-4 border-leaf-deep bg-leaf/90 shadow-lg" style={{ left: `${wall.x}%`, top: `${wall.y}%`, width: `${wall.w}%`, height: `${wall.h}%` }} />)}
      {animal && <img src={animal.image} alt={animal.name} draggable={false} className="absolute z-20 w-20 select-none object-contain drop-shadow-xl transition-[left,top] duration-75" style={{ left: `${pos.x}%`, top: `${pos.y}%` }} />}
      <div className="absolute bottom-4 left-4 rounded-xl bg-foreground/70 px-3 py-2 font-bold text-primary-foreground">Arraste com o dedo</div>
    </div>
  );
}

function Comida({ difficulty, onWin, onLose, onScore }: Props) {
  const rules = RULES[difficulty];
  const refs = { frutas: useRef<HTMLDivElement>(null), legumes: useRef<HTMLDivElement>(null), graos: useRef<HTMLDivElement>(null) };
  const source = [
    { id: "maca1", label: "Maçã", basket: "frutas", node: <Apple className="size-12 fill-destructive text-destructive" /> },
    { id: "maca2", label: "Maçã", basket: "frutas", node: <Apple className="size-12 fill-destructive text-destructive" /> },
    { id: "cenoura1", label: "Cenoura", basket: "legumes", node: <Carrot className="size-12 text-mango-deep" /> },
    { id: "cenoura2", label: "Cenoura", basket: "legumes", node: <Carrot className="size-12 text-mango-deep" /> },
    { id: "trigo1", label: "Trigo", basket: "graos", node: <Wheat className="size-12 text-sun-deep" /> },
    { id: "trigo2", label: "Trigo", basket: "graos", node: <Wheat className="size-12 text-sun-deep" /> },
  ].slice(0, rules.options);
  const [items, setItems] = useState(source);
  const [lives, setLives] = useState(rules.lives);
  const [mistakes, setMistakes] = useState(0);
  const targets = () => ({ frutas: refs.frutas.current, legumes: refs.legumes.current, graos: refs.graos.current });
  return (
    <div className="relative min-h-[560px] pt-20 text-center">
      <MissionHud title="Organize a comida dentro da arca" progress={`${source.length - items.length}/${source.length}`} lives={lives} />
      <div className="mt-10 flex min-h-48 flex-wrap items-center justify-center gap-4">{items.map((item) => <SortPiece key={item.id} item={item} targets={targets} onDrop={(target) => {
        if (target === item.basket) { audio.sfx("pop"); onScore(100); const next = items.filter((x) => x.id !== item.id); setItems(next); if (!next.length) onWin({ score: source.length * 100 + lives * 40, mistakes, trophy: "cuidador-arca" }); }
        else { audio.sfx("again"); setMistakes((v) => v + 1); const next = lives - 1; setLives(next); if (next <= 0) onLose(); }
      }} />)}</div>
      <div className="absolute inset-x-2 bottom-4 grid grid-cols-3 gap-2">
        {([ ["frutas", "Frutas", Apple], ["legumes", "Legumes", Carrot], ["graos", "Grãos", Wheat] ] as const).map(([id, label, Icon]) => <div key={id} ref={refs[id]} className="flex min-h-28 flex-col items-center justify-center rounded-t-3xl border-4 border-wood bg-wood/75 font-display text-xl text-primary-foreground"><Icon className="size-8" />{label}</div>)}
      </div>
    </div>
  );
}

function Quantidades({ difficulty, onWin, onLose, onScore }: Props) {
  const rules = RULES[difficulty]; const [round, setRound] = useState(0); const [lives, setLives] = useState(rules.lives); const [mistakes, setMistakes] = useState(0);
  const max = 2 + rules.options; const n = 1 + ((round * 3 + 2) % max); const animal = ANIMALS[round % (ANIMALS.length - 1)] ?? ANIMALS[0];
  useEffect(() => { if (animal) audio.sfx(animal.sound); }, [round, animal]);
  return <div className="relative min-h-[540px] pt-20 text-center"><MissionHud title="Ouça e conte os animais" progress={`${round}/${rules.rounds}`} lives={lives} /><div className="flex min-h-72 flex-wrap items-center justify-center gap-1 px-8">{Array.from({ length: n }).map((_, i) => animal && <img key={i} src={animal.image} alt={animal.name} className="h-24 object-contain drop-shadow-lg" />)}</div><div className="flex flex-wrap justify-center gap-2">{Array.from({ length: max }, (_, i) => i + 1).map((v) => <button key={v} type="button" className="toy-button font-display size-16 rounded-2xl bg-sun text-3xl" onClick={() => { if (v === n) { audio.sfx("success"); onScore(140); const next = round + 1; if (next >= rules.rounds) onWin({ score: next * 140 + lives * 40, mistakes }); else setRound(next); } else { audio.sfx("again"); setMistakes((x) => x + 1); const next = lives - 1; setLives(next); if (next <= 0) onLose(); } }}>{v}</button>)}</div></div>;
}

type Falling = { id: number; kind: "leaf" | "apple" | "cloud" | "drop"; x: number; y: number };
function Pomba({ difficulty, onWin, onLose, onScore }: Props) {
  const rules = RULES[difficulty]; const [birdX, setBirdX] = useState(45); const [items, setItems] = useState<Falling[]>([]); const [got, setGot] = useState(0); const [missed, setMissed] = useState(0); const [mistakes, setMistakes] = useState(0); const id = useRef(0); const board = useRef<HTMLDivElement>(null);
  const reset = useCallback(() => { setItems([]); setGot(0); setMissed(0); setMistakes(0); setBirdX(45); }, []);
  useEffect(() => { reset(); }, [difficulty, reset]);
  useEffect(() => {
    const timer = window.setInterval(() => {
      setItems((current) => {
        const moved = current.map((item) => ({ ...item, y: item.y + 5 }));
        const fallenLeaves = moved.filter((item) => item.y >= 88 && item.kind === "leaf").length;
        if (fallenLeaves) setMissed((value) => { const next = value + fallenLeaves; if (next >= 3) window.setTimeout(onLose, 0); return next; });
        const kept = moved.filter((item) => item.y < 88);
        const kinds: Falling["kind"][] = ["leaf", "apple", "cloud", "drop", "leaf"];
        const kind = kinds[Math.floor(Math.random() * kinds.length)] ?? "leaf";
        return [...kept, { id: id.current++, kind, x: 4 + Math.random() * 88, y: 8 }];
      });
    }, rules.speed / 4);
    return () => window.clearInterval(timer);
  }, [rules.speed, onLose]);
  useEffect(() => {
    const collisions = items.filter((item) => item.y > 68 && item.y < 88 && Math.abs(item.x - birdX) < 11);
    if (!collisions.length) return;
    setItems((current) => current.filter((item) => !collisions.some((hit) => hit.id === item.id)));
    collisions.forEach((item) => {
      if (item.kind === "leaf") { audio.sfx("star"); onScore(100); setGot((value) => { const next = value + 1; if (next >= rules.target) window.setTimeout(() => onWin({ score: rules.target * 100 + (3 - missed) * 100, mistakes, trophy: "mensageiro-pomba" }), 0); return next; }); }
      else { audio.sfx("again"); setMistakes((value) => value + 1); }
    });
  }, [items, birdX, missed, mistakes, onScore, onWin, rules.target]);
  const move = (clientX: number) => { const rect = board.current?.getBoundingClientRect(); if (rect) setBirdX(Math.max(2, Math.min(86, ((clientX - rect.left) / rect.width) * 100 - 7))); };
  return <div ref={board} className="relative min-h-[590px] touch-none overflow-hidden" onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); move(e.clientX); }} onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) move(e.clientX); }}><MissionHud title="Pegue somente as folhas verdes" progress={`${got}/10 • caíram ${missed}/3`} lives={3 - missed} />{items.map((item) => <div key={item.id} className="absolute z-10 transition-[top] duration-500 ease-linear" style={{ left: `${item.x}%`, top: `${item.y}%` }}>{item.kind === "leaf" ? <Leaf className="size-12 fill-leaf text-leaf-deep drop-shadow-lg" /> : item.kind === "apple" ? <Apple className="size-11 fill-destructive text-destructive" /> : item.kind === "cloud" ? <Cloud className="size-12 fill-card text-muted-foreground" /> : <Star className="size-10 fill-sky text-sky-deep" />}</div>)}<img src={pomba} alt="Pomba controlada pela criança" draggable={false} className="absolute bottom-6 z-20 w-28 select-none object-contain drop-shadow-xl transition-[left] duration-75" style={{ left: `${birdX}%` }} /><div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-xl bg-foreground/70 px-4 py-2 font-bold text-primary-foreground">Arraste a pomba</div></div>;
}

const COVENANT_COLORS = ["bg-destructive", "bg-mango", "bg-sun", "bg-leaf", "bg-sky-deep", "bg-grape"];
function ArcoAlianca({ difficulty, onWin, onLose, onScore }: Props) {
  const rules = RULES[difficulty]; const [n, setN] = useState(0); const [lives, setLives] = useState(rules.lives); const [mistakes, setMistakes] = useState(0);
  const choices = useMemo(() => COVENANT_COLORS.map((color, i) => ({ color, i })).sort(() => Math.random() - 0.5), []);
  return <div className="relative min-h-[590px] pt-20 text-center"><MissionHud title="Pinte o Arco da Aliança na ordem" progress={`${n}/6`} lives={lives} /><div className="absolute inset-x-0 top-24 mx-auto h-[340px] max-w-3xl overflow-hidden">{COVENANT_COLORS.map((color, i) => <div key={color} className={cn("absolute left-1/2 -translate-x-1/2 rounded-t-full border-[22px] border-b-0 transition-all duration-700", i < n ? color.replace("bg-", "border-") : "border-card/20")} style={{ width: `${95 - i * 11}%`, height: `${310 - i * 34}px`, bottom: 0 }} />)}</div><div className="absolute inset-x-0 bottom-6 flex justify-center gap-3">{choices.map(({ color, i }) => <button key={color} type="button" aria-label={`Cor ${i + 1}`} className={cn("toy-button size-16 rounded-full border-4 border-card", color)} onClick={() => { if (i === n) { audio.sfx("star"); onScore(120); const next = n + 1; setN(next); if (next === 6) { audio.sfx("rainbow"); onWin({ score: 720 + lives * 60, mistakes, trophy: "guardiao-alianca" }); } } else { audio.sfx("again"); setMistakes((v) => v + 1); const next = lives - 1; setLives(next); if (next <= 0) onLose(); } }} />)}</div></div>;
}

export function ActivityView({ activity, ...props }: { activity: Activity } & Props) {
  switch (activity.kind) {
    case "palavras": return <Palavras {...props} />;
    case "quiz": return <Quiz a={activity} {...props} />;
    case "construir": return <Construir {...props} />;
    case "animais": return <Labirinto {...props} />;
    case "comida": return <Comida {...props} />;
    case "encontrar": return <Quantidades {...props} />;
    case "pomba": return <Pomba {...props} />;
    case "arcoiris": return <ArcoAlianca {...props} />;
  }
}
