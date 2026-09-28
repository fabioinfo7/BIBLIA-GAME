import bgCampo from "@/assets/bg-campo.jpg";
import bgChuva from "@/assets/bg-chuva.jpg";
import bgInterior from "@/assets/bg-arca-interior.jpg";
import bgArcoIris from "@/assets/bg-arcoiris.jpg";
import type { Ambience } from "./audio";
import type { MedalId } from "./game-state";

export type Beat = {
  speaker: "narrador" | "noe";
  text: string;
};

export type Activity =
  | { kind: "palavras" }
  | {
      kind: "quiz";
      question: string;
      options: { id: string; label: string; icon: string }[];
      correct: string;
    }
  | { kind: "construir" }
  | { kind: "animais" }
  | { kind: "comida" }
  | { kind: "encontrar" }
  | { kind: "pomba" }
  | { kind: "arcoiris" };

export type Chapter = {
  id: string;
  number: number;
  title: string;
  mapIcon: string;
  bg: string;
  ambience: Ambience;
  weather?: "chuva";
  beats: Beat[];
  activity?: Activity;
  medal?: MedalId;
  stars: number;
};

export const CHAPTERS: Chapter[] = [
  {
    id: "campo",
    number: 1,
    title: "Noé e sua família",
    mapIcon: "campo",
    bg: bgCampo,
    ambience: "campo",
    stars: 1,
    beats: [
      {
        speaker: "noe",
        text: "Olá! Eu sou o Noé. Quer conhecer a minha história? Vem comigo!",
      },
      {
        speaker: "narrador",
        text: "Há muito tempo, Noé vivia num campo bonito com a sua família. Ele amava a Deus e procurava sempre fazer o que era certo.",
      },
      {
        speaker: "narrador",
        text: "Noé cuidava dos animais, plantava, colhia frutas e ensinava os seus filhos a serem bondosos com todos.",
      },
      {
        speaker: "narrador",
        text: "Naquele tempo, muitas pessoas estavam fazendo coisas ruins. Elas brigavam, machucavam umas às outras e não queriam ouvir a Deus.",
      },
      {
        speaker: "narrador",
        text: "Deus viu tudo o que estava acontecendo e ficou triste. Então decidiu cuidar de Noé, da família dele e dos animais.",
      },
    ],
    activity: { kind: "palavras" },
  },
  {
    id: "chamado",
    number: 2,
    title: "Deus fala com Noé",
    mapIcon: "arca",
    bg: bgCampo,
    ambience: "campo",
    stars: 2,
    beats: [
      {
        speaker: "narrador",
        text: "Num dia calmo, Noé olhou para o céu. Uma luz suave apareceu e Deus falou com ele.",
      },
      {
        speaker: "narrador",
        text: "Deus pediu que Noé construísse uma arca. Uma arca é um barco muito, muito grande, feito de madeira.",
      },
      {
        speaker: "narrador",
        text: "Deus avisou que viria uma chuva muito grande, e que a arca seria um lugar seguro para Noé, para a família dele e para os animais.",
      },
      {
        speaker: "noe",
        text: "Eu confiei em Deus e comecei a trabalhar no mesmo dia. Você sabe o que eu precisava construir?",
      },
    ],
    activity: {
      kind: "quiz",
      question: "O que Noé deveria construir?",
      options: [
        { id: "arca", label: "Arca", icon: "arca" },
        { id: "casa", label: "Casa", icon: "casa" },
        { id: "carro", label: "Carro", icon: "carro" },
        { id: "aquario", label: "Aquário", icon: "aquario" },
      ],
      correct: "arca",
    },
  },
  {
    id: "construcao",
    number: 3,
    title: "Construindo a arca",
    mapIcon: "martelo",
    bg: bgCampo,
    ambience: "construcao",
    stars: 3,
    medal: "ajudante-noe",
    beats: [
      {
        speaker: "narrador",
        text: "Noé e seus filhos trabalharam por muitos e muitos dias. Cortaram madeira, serraram tábuas e pregaram cada pedacinho com cuidado.",
      },
      {
        speaker: "narrador",
        text: "A arca ficou enorme, com três andares, uma porta grande e uma janela lá no alto.",
      },
      { speaker: "noe", text: "Ajude Noé! Leve a madeira e as ferramentas até a arca." },
    ],
    activity: { kind: "construir" },
  },
  {
    id: "animais",
    number: 4,
    title: "Os animais chegam",
    mapIcon: "animais",
    bg: bgCampo,
    ambience: "animais",
    stars: 3,
    medal: "amigo-animais",
    beats: [
      {
        speaker: "narrador",
        text: "Quando a arca ficou pronta, aconteceu uma coisa incrível: os animais começaram a chegar sozinhos, de dois em dois.",
      },
      {
        speaker: "narrador",
        text: "Vieram elefantes, leões, girafas, macacos, zebras, ovelhas e muitos passarinhos. Deus mandou todos eles para dentro da arca.",
      },
      { speaker: "noe", text: "Vamos ajudar os animais a encontrar a arca!" },
    ],
    activity: { kind: "animais" },
  },
  {
    id: "chuva",
    number: 5,
    title: "A chuva começa",
    mapIcon: "chuva",
    bg: bgChuva,
    ambience: "chuva",
    weather: "chuva",
    stars: 2,
    beats: [
      {
        speaker: "narrador",
        text: "Quando todos estavam dentro, Deus fechou a porta da arca. Então caíram as primeiras gotinhas de chuva.",
      },
      {
        speaker: "noe",
        text: "A chuva começou! Mas não precisa ter medo: aqui dentro estamos bem quentinhos e seguros.",
      },
      {
        speaker: "narrador",
        text: "Choveu por muitos dias. A água subiu e a arca começou a flutuar, balançando devagarinho como um berço.",
      },
      { speaker: "noe", text: "Vamos guardar comida para os animais!" },
    ],
    activity: { kind: "comida" },
  },
  {
    id: "dentro",
    number: 6,
    title: "Dentro da arca",
    mapIcon: "lanterna",
    bg: bgInterior,
    ambience: "arca",
    stars: 2,
    beats: [
      {
        speaker: "narrador",
        text: "Dentro da arca havia lanternas acesas, montes de palha e cestos cheios de comida.",
      },
      {
        speaker: "narrador",
        text: "Noé cuidou de todos os animais: deu comida, deu água e fez carinho. A família dele ajudava todos os dias.",
      },
      { speaker: "noe", text: "Toque nos animais para ouvir o som de cada um!" },
    ],
    activity: { kind: "encontrar" },
  },
  {
    id: "pomba",
    number: 7,
    title: "A pomba",
    mapIcon: "pomba",
    bg: bgChuva,
    ambience: "arca",
    stars: 2,
    beats: [
      {
        speaker: "narrador",
        text: "Um dia a chuva parou. Ficou tudo bem quietinho. Noé abriu a janela e olhou para fora.",
      },
      {
        speaker: "narrador",
        text: "Noé enviou uma pomba para descobrir se a água já estava baixando.",
      },
      {
        speaker: "narrador",
        text: "Quando a pomba voltou com uma folhinha verde no biquinho, Noé entendeu que a água estava baixando e que as plantas já estavam crescendo.",
      },
      { speaker: "noe", text: "Ajude a pombinha a pegar as folhinhas e voltar para a arca!" },
    ],
    activity: { kind: "pomba" },
  },
  {
    id: "arcoiris",
    number: 8,
    title: "O Arco da Aliança",
    mapIcon: "arcoiris",
    bg: bgArcoIris,
    ambience: "final",
    stars: 3,
    medal: "amigo-arco-iris",
    beats: [
      {
        speaker: "narrador",
        text: "A água baixou e a arca chegou em terra firme. Noé abriu a porta grande e todos saíram devagarinho.",
      },
      {
        speaker: "narrador",
        text: "Os animais correram pela grama, os passarinhos voaram e a família de Noé agradeceu a Deus.",
      },
      {
        speaker: "narrador",
        text: "Então Deus colocou o Arco da Aliança no céu como sinal da sua promessa de nunca mais destruir a terra com um dilúvio.",
      },
      { speaker: "noe", text: "Olhe! É o Arco da Aliança, o sinal da promessa de Deus. Vamos completar suas cores juntos?" },
    ],
    activity: { kind: "arcoiris" },
  },
];

export const chapterById = (id: string) => CHAPTERS.find((c) => c.id === id);
