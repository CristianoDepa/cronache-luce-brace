import type { VoceContenuto } from "../../core/indice";
import { voceIllustrazione } from "../../core/indice";

// La torre con gli alberi in cima e le mura: il biglietto da visita del gioco.
const SCENA_AVVIO = String.raw`
 *      .        ^^^^^^^      .        *     .
    .         ^^^^^^^^^^^        .      *
   *            ^^^^^^^     *        .
       .         ##|##              .    *
          ___    ##|##    ___
  .  ____|###|___#####___|###|____    .
 ####|###|###|#########|###|###|####
 ####|###|###|#########|###|###|####
 ==================================
`;

const SCENA_OPZIONI = String.raw`
        *   .   *   .   *
          _______________
     ____/_______________\____
    /_________________________\
           |           |
         __|___________|__
        /_________________\
`;

const SCENA_VILLAGGIO = String.raw`
              +
             /^\             *
      ___   /___\    ___        .
     /___\  |[ ]|   /___\   ___
    |[] []| |   |  |[] []| /___\
    |_____|_|___|__|_____|_|[]_|
 ,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.
`;

export const ILLUSTRAZIONI_INTERFACCIA: readonly VoceContenuto[] = [
  voceIllustrazione("scena.avvio", SCENA_AVVIO, { "*": 14, ".": 8, "^": 10, "#": 6, "|": 6, _: 8, "=": 2 }),
  voceIllustrazione("scena.opzioni", SCENA_OPZIONI, { "*": 14, ".": 14, _: 8, "/": 8, "\\": 8, "|": 8 }),
  voceIllustrazione("scena.villaggio", SCENA_VILLAGGIO, { "+": 14, "^": 4, "/": 4, "\\": 4, _: 8, "[": 11, "]": 11, "|": 6, ",": 2, ".": 2, "*": 14 }),
];
