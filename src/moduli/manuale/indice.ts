import type { DefinizioneModulo } from "../../core/indice";
import { VERSIONE_API } from "../../core/indice";
import { ID_ABILITA } from "../abilita/indice";
import { ID_CLASSI } from "../classi/indice";
import { ID_COMBATTIMENTO } from "../combattimento/indice";
import { ID_EQUIPAGGIAMENTO } from "../equipaggiamento/indice";
import { ID_LIVELLI } from "../livelli/indice";
import { ID_OGGETTI_MAGICI } from "../oggettimagici/indice";
import { interfacciaManuale } from "./interfaccia";
import { TESTI_MANUALE } from "./testi";

export const ID_MANUALE = "manuale";
export { CONTESTO_MANUALE } from "./interfaccia";

// 0.26.0: il manuale in gioco, solo ciò che si scopre giocando. Nessuno stato né regole: tutto è calcolato dai dati degli altri moduli.
export const moduloManuale: DefinizioneModulo = {
  id: ID_MANUALE,
  versioneApi: VERSIONE_API,
  dipende: [ID_ABILITA, ID_CLASSI, ID_COMBATTIMENTO, ID_EQUIPAGGIAMENTO, ID_LIVELLI, ID_OGGETTI_MAGICI],
  testi: TESTI_MANUALE,
  interfaccia: interfacciaManuale,
};
