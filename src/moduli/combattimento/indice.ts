import type { DefinizioneModulo } from "../../core/indice";
import { VERSIONE_API } from "../../core/indice";
import { azioneAttacca, azioneFuggi, azioneIniziaCombattimento } from "./azioni";
import { CREATURE } from "./dati";
import { ILLUSTRAZIONI_COMBATTIMENTO } from "./grafica";
import { interfacciaCombattimento } from "./interfaccia";
import { TESTI_COMBATTIMENTO } from "./testi";
import { ID_COMBATTIMENTO, statoCombattimento, tipoCreatura } from "./tipi";

// API pubblica del modulo: ciò che altri moduli possono usare.
export { ID_COMBATTIMENTO, statoCombattimento, tipoCreatura } from "./tipi";
export type { Creatura, ScontroAttivo, StatoCombattimento } from "./tipi";
export { puntoDanno, puntoFuga, puntoOro } from "./punti";
export type { CalcoloDanno, CalcoloFuga, CalcoloOro } from "./punti";
export { caricaScontro, creaturaDisponibile, iniziaScontro, risolviColpoGiocatore } from "./scontro";
export { CONTESTO_COMBATTIMENTO } from "./interfaccia";

export const moduloCombattimento: DefinizioneModulo = {
  id: ID_COMBATTIMENTO,
  versioneApi: VERSIONE_API,
  dipende: [],
  tipiContenuto: [tipoCreatura],
  contenuti: [...CREATURE, ...ILLUSTRAZIONI_COMBATTIMENTO],
  azioni: [azioneIniziaCombattimento, azioneAttacca, azioneFuggi],
  testi: TESTI_COMBATTIMENTO,
  stato: statoCombattimento,
  interfaccia: interfacciaCombattimento,
};
