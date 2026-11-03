import type { VoceContenuto } from "../../core/indice";
import { voceIllustrazione } from "../../core/indice";

const SCENA_ARMERIA = String.raw`
   \  /          _______
    \/          /  _|_  \
    /\         |  /_|_\  |
   /  \        |   \ /   |
  /_/\_\        \   V   /
                 \_____/
 ============================
`;

const SCENA_SARTORIA = String.raw`
      _O_            ____   ____
     / | \          |~~~~| |####|
    |  |  |         |~~~~| |####|
     \_|_/          |~~~~| |####|
       |            '----' '----'
      _|_
 ============================
`;

export const ILLUSTRAZIONI_EQUIPAGGIAMENTO: readonly VoceContenuto[] = [
  voceIllustrazione("scena.armeria", SCENA_ARMERIA, { "\\": 15, "/": 15, _: 8, "|": 8, V: 12, "=": 6 }),
  voceIllustrazione("scena.sartoria", SCENA_SARTORIA, { O: 15, "~": 13, "#": 9, "|": 8, _: 7, "-": 8, "'": 8, "/": 7, "\\": 7, "=": 6 }),
];
