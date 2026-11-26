import type { DefinizioneModulo } from "../../core/indice";
import { VERSIONE_API } from "../../core/indice";
import { ID_COMBATTIMENTO } from "../combattimento/indice";
import { MOSTRI_RISERVA } from "./dati";
import { ILLUSTRAZIONI_RISERVA } from "./grafica";
import { TESTI_RISERVA } from "./testi";

export const ID_RISERVA = "riserva";
export { ID_MOSTRI_RISERVA, MOSTRI_RISERVA } from "./dati";

// La riserva del bestiario (0.32.0): ventuno creature con scheda, testi e sprite, ma senza zona (vedi dati.ts).
// Il modulo non ha azioni, regole né stato: solo contenuti.
export const moduloRiserva: DefinizioneModulo = {
  id: ID_RISERVA,
  versioneApi: VERSIONE_API,
  dipende: [ID_COMBATTIMENTO],
  contenuti: [...MOSTRI_RISERVA, ...ILLUSTRAZIONI_RISERVA],
  testi: TESTI_RISERVA,
};
