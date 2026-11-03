import type { VoceContenuto } from "../../core/indice";
import { voceIllustrazione } from "../../core/indice";

// Tre sagome: cavaliere con scudo, mistico con la veste, ladro con il mantello.
const SCENA_CREAZIONE = String.raw`
     O            O            O
    /|\          /|\          /|\
   [=|=]        /*|*\        /_|_\
    / \         /___\         / \
   /   \         | |         _/ \_
 ===================================
`;

export const ILLUSTRAZIONI_CLASSI: readonly VoceContenuto[] = [
  voceIllustrazione("scena.creazione", SCENA_CREAZIONE, { O: 15, "/": 7, "\\": 7, "|": 15, "*": 13, "[": 9, "]": 9, "=": 9, _: 6 }),
];
