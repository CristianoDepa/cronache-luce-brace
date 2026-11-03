import type { VoceContenuto } from "../../core/indice";
import { voceIllustrazione } from "../../core/indice";

// Sfondo di riserva, quando lo scontro non è iniziato in un luogo con la sua scena.
const SCENA_COMBATTIMENTO = String.raw`
   \         /
    \       /
     \     /
      \   /
       \ /
        X
       / \
      /   \
     /     \
`;

const SPRITE_RATTO = String.raw`
   ,_,
  (o.o)__
 (  v   __)~~
  ""  ""
`;

const SPRITE_LUPO = String.raw`
  /|   |\
 / |___| \
 \ (o o) /
  \ \_^_/ \__
   |  w  |  ~~>
`;

export const ILLUSTRAZIONI_COMBATTIMENTO: readonly VoceContenuto[] = [
  voceIllustrazione("scena.combattimento", SCENA_COMBATTIMENTO, { "\\": 15, "/": 15, X: 14 }),
  voceIllustrazione("sprite.ratto", SPRITE_RATTO, { o: 12, "~": 6, ",": 8, _: 8, v: 5 }),
  voceIllustrazione("sprite.lupo", SPRITE_LUPO, { o: 14, "~": 8, "^": 15, "/": 8, "\\": 8, "|": 8, _: 8 }),
];
