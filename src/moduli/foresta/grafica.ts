import type { VoceContenuto } from "../../core/indice";
import { voceIllustrazione } from "../../core/indice";

// L'ancora dice dove poggiano i piedi della creatura quando la scena diventa lo sfondo di un combattimento.
const SCENA_FORESTA = String.raw`
   ^^^^      ^^^^^
  ^^^^^^    ^^^^^^^        .  .
 ^^^^^^^^  ^^^^^^^^^
   |##|       |##|
   |##|       |##|
,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.,.
`;

export const ILLUSTRAZIONI_FORESTA: readonly VoceContenuto[] = [
  voceIllustrazione("scena.foresta", SCENA_FORESTA, { "^": 10, "|": 6, "#": 6, ",": 2, ".": 2 }, { x: 28, y: 4 }),
];
