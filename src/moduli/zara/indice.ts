import type { DefinizioneModulo } from "../../core/indice";
import { VERSIONE_API } from "../../core/indice";
import { ID_AZIONI } from "../azioni/indice";
import { ID_LOCANDA } from "../locanda/indice";
import { azioneCambiaPuntataZara, azioneGiocaZara } from "./azioni";
import { ILLUSTRAZIONI_ZARA } from "./grafica";
import { interfacciaZara } from "./interfaccia";
import { TESTI_ZARA } from "./testi";
import { ID_ZARA, statoZara } from "./tipi";

export { ID_ZARA, statoZara } from "./tipi";
export { PARAMETRI_ZARA } from "./parametri";
export { esitoDelTiro, numeriChiamabili, puntataInMonete, combinazioniDelNumero, percentualeDelNumero, quotaDelNumero, sommaDei, vincitaDi } from "./gioco";
export { CONTESTO_ZARA } from "./interfaccia";

// La Zara: il gioco di dadi della Locanda (si chiama la somma di tre dadi; qualche moneta in più o in meno).
export const moduloZara: DefinizioneModulo = {
  id: ID_ZARA,
  versioneApi: VERSIONE_API,
  dipende: [ID_AZIONI, ID_LOCANDA],
  contenuti: [...ILLUSTRAZIONI_ZARA],
  azioni: [azioneGiocaZara, azioneCambiaPuntataZara],
  testi: TESTI_ZARA,
  stato: statoZara,
  interfaccia: interfacciaZara,
};
