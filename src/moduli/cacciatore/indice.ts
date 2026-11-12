import type { DefinizioneModulo } from "../../core/indice";
import { VERSIONE_API } from "../../core/indice";
import { ID_AMULETI } from "../amuleti/indice";
import { ID_AZIONI } from "../azioni/indice";
import { ID_CITTA } from "../citta/indice";
import { ID_COMBATTIMENTO } from "../combattimento/indice";
import { ID_FORESTA } from "../foresta/indice";
import { ID_FORTUNA } from "../fortuna/indice";
import { ID_LUOGHI } from "../luoghi/indice";
import { ID_POZIONI } from "../pozioni/indice";
import { ID_TORRE } from "../torre/indice";
import { azioneAbbandonaMissione, azioneChiediMissione, azioneRiscuotiMissione } from "./azioni";
import { ILLUSTRAZIONI_CACCIATORE } from "./grafica";
import { interfacciaCacciatore } from "./interfaccia";
import { regolaPreda, regolaProgressoMissione } from "./regole";
import { TESTI_CACCIATORE } from "./testi";
import { ID_CACCIATORE, missioneAttiva, statoCacciatore } from "./tipi";

export { ID_CACCIATORE, missioneAttiva, statoCacciatore } from "./tipi";
export type { Missione } from "./tipi";
export { LIVELLI_PREDA, NUMERO_SOPRANNOMI, PARAMETRI_CACCIATORE } from "./parametri";
export { generaMissione, puoOffrire } from "./missione";
export { CONTESTO_CASTRUCCIO } from "./interfaccia";

// Castruccio, il cacciatore di taglie ai piedi della Torre: una missione al giorno (battuta o preda con nome) e il suo compenso.
export const moduloCacciatore: DefinizioneModulo = {
  id: ID_CACCIATORE,
  versioneApi: VERSIONE_API,
  dipende: [ID_AMULETI, ID_AZIONI, ID_CITTA, ID_COMBATTIMENTO, ID_FORESTA, ID_FORTUNA, ID_LUOGHI, ID_POZIONI, ID_TORRE],
  contenuti: [...ILLUSTRAZIONI_CACCIATORE],
  azioni: [azioneChiediMissione, azioneRiscuotiMissione, azioneAbbandonaMissione],
  regole: [regolaProgressoMissione, regolaPreda],
  testi: TESTI_CACCIATORE,
  stato: statoCacciatore,
  interfaccia: interfacciaCacciatore,
};
