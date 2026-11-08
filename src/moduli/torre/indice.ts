import type { DefinizioneModulo } from "../../core/indice";
import { VERSIONE_API } from "../../core/indice";
import { ID_AZIONI } from "../azioni/indice";
import { ID_CLASSI } from "../classi/indice";
import { ID_COMBATTIMENTO } from "../combattimento/indice";
import { ID_LUOGHI } from "../luoghi/indice";
import { ID_MANA } from "../mana/indice";
import { azioneSaliTorre } from "./azioni";
import { ILLUSTRAZIONI_TORRE } from "./grafica";
import { interfacciaTorre } from "./interfaccia";
import { regolaHpTorre, regolaManaTorre } from "./regole";
import { TESTI_TORRE } from "./testi";
import { ID_TORRE, statoTorre } from "./tipi";

export { ID_TORRE, SEGRETI, statoTorre } from "./tipi";
export type { Segreto } from "./tipi";
export { segretoDisponibile } from "./azioni";
export { PARAMETRI_TORRE } from "./parametri";
export { CONTESTO_CIMA, CONTESTO_TORRE } from "./interfaccia";

// La Torre Guinigi: la salita, i tre segreti e i bonus permanenti che danno.
export const moduloTorre: DefinizioneModulo = {
  id: ID_TORRE,
  versioneApi: VERSIONE_API,
  dipende: [ID_AZIONI, ID_CLASSI, ID_COMBATTIMENTO, ID_LUOGHI, ID_MANA],
  contenuti: [...ILLUSTRAZIONI_TORRE],
  azioni: [azioneSaliTorre],
  regole: [regolaHpTorre, regolaManaTorre],
  testi: TESTI_TORRE,
  stato: statoTorre,
  interfaccia: interfacciaTorre,
};
