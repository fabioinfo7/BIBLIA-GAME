import elefante from "@/assets/animal-elefante.png";
import leao from "@/assets/animal-leao.png";
import girafa from "@/assets/animal-girafa.png";
import macaco from "@/assets/animal-macaco.png";
import zebra from "@/assets/animal-zebra.png";
import pomba from "@/assets/pomba.png";
import type { SfxName } from "./audio";

export type Animal = {
  id: string;
  name: string;
  image: string;
  sound: SfxName;
  /** Animação própria de cada animal (classe utilitária do design system). */
  motion: string;
};

export const ANIMALS: Animal[] = [
  {
    id: "elefante",
    name: "Elefante",
    image: elefante,
    sound: "elefante",
    motion: "animate-sway",
  },
  { id: "leao", name: "Leão", image: leao, sound: "leao", motion: "animate-bounce-soft" },
  { id: "girafa", name: "Girafa", image: girafa, sound: "girafa", motion: "animate-float-soft" },
  { id: "macaco", name: "Macaco", image: macaco, sound: "macaco", motion: "animate-bounce-soft" },
  { id: "zebra", name: "Zebra", image: zebra, sound: "zebra", motion: "animate-sway" },
  { id: "pomba", name: "Pomba", image: pomba, sound: "passaro", motion: "animate-float-soft" },
];

export const animalById = (id: string) => ANIMALS.find((a) => a.id === id)!;
