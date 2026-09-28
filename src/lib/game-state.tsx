import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { audio } from "./audio";

export type MedalId = "amigo-animais" | "ajudante-noe" | "amigo-arco-iris" | "guardiao-historia";
export type Difficulty = "muito-facil" | "facil" | "medio" | "dificil";
export type TrophyId =
  | "primeira-vitoria"
  | "sem-erros"
  | "mestre-palavras"
  | "guia-animais"
  | "cuidador-arca"
  | "mensageiro-pomba"
  | "guardiao-alianca"
  | "historia-completa";

export type Progress = {
  name: string;
  stars: number;
  chaptersDone: string[];
  medals: MedalId[];
  audioOn: boolean;
  difficulty: Difficulty;
  points: number;
  chapterScores: Record<string, number>;
  chapterStars: Record<string, number>;
  trophies: TrophyId[];
};

const STORAGE_KEY = "arca:progresso";

const EMPTY: Progress = {
  name: "",
  stars: 0,
  chaptersDone: [],
  medals: [],
  audioOn: true,
  difficulty: "facil",
  points: 0,
  chapterScores: {},
  chapterStars: {},
  trophies: [],
};

type Ctx = Progress & {
  ready: boolean;
  setName: (name: string) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  finishChapter: (id: string, points: number, stars: number, trophy?: TrophyId, medal?: MedalId) => void;
  awardMedal: (id: MedalId) => void;
  awardTrophy: (id: TrophyId) => void;
  toggleAudio: () => void;
  reset: () => void;
};

const GameContext = createContext<Ctx | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Progress>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...EMPTY, ...(JSON.parse(raw) as Partial<Progress>) });
    } catch {
      /* começa do zero */
    }
    setReady(true);
  }, []);

  const persist = useCallback((next: Progress) => {
    setState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* sem armazenamento: o jogo continua na sessão */
    }
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      ready,
      setName: (name) => persist({ ...state, name: name.trim().slice(0, 18) }),
      setDifficulty: (difficulty) => persist({ ...state, difficulty }),
      finishChapter: (id, points, stars, trophy, medal) => {
        const previousScore = state.chapterScores[id] ?? 0;
        const previousStars = state.chapterStars[id] ?? 0;
        const nextTrophies = [...state.trophies];
        if (!nextTrophies.includes("primeira-vitoria")) nextTrophies.push("primeira-vitoria");
        if (trophy && !nextTrophies.includes(trophy)) nextTrophies.push(trophy);
        const nextMedals = medal && !state.medals.includes(medal) ? [...state.medals, medal] : state.medals;
        persist({
          ...state,
          points: state.points + Math.max(0, points - previousScore),
          stars: state.stars + Math.max(0, stars - previousStars),
          chapterScores: { ...state.chapterScores, [id]: Math.max(points, previousScore) },
          chapterStars: { ...state.chapterStars, [id]: Math.max(stars, previousStars) },
          chaptersDone: state.chaptersDone.includes(id) ? state.chaptersDone : [...state.chaptersDone, id],
          trophies: nextTrophies,
          medals: nextMedals,
        });
        if (trophy || medal) audio.sfx("medal");
      },
      awardMedal: (id) => {
        if (state.medals.includes(id)) return;
        audio.sfx("medal");
        persist({ ...state, medals: [...state.medals, id] });
      },
      awardTrophy: (id) => {
        if (state.trophies.includes(id)) return;
        audio.sfx("medal");
        persist({ ...state, trophies: [...state.trophies, id] });
      },
      toggleAudio: () => {
        const next = !state.audioOn;
        audio.setEnabled(next);
        persist({ ...state, audioOn: next });
      },
      reset: () => persist({ ...EMPTY, name: state.name }),
    }),
    [state, ready, persist],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame precisa estar dentro de GameProvider");
  return ctx;
}
