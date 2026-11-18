import type { DefinizioneModulo } from "../../core/indice";
import { VERSIONE_API } from "../../core/indice";
import { ID_AZIONI } from "../azioni/indice";
import { ID_CITTA } from "../citta/indice";
import { ID_COMBATTIMENTO } from "../combattimento/indice";
import { ID_MURA } from "../mura/indice";
import { azioneAbbandonaLavoro, azioneLavora } from "./azioni";
import { CREATURE_LAVORI } from "./dati";
import { ILLUSTRAZIONI_LAVORI } from "./grafica";
import { interfacciaLavori } from "./interfaccia";
import { regolaArrivo, regolaFineScontroLavoro, regolaFugaImboscata } from "./regole";
import { TESTI_LAVORI } from "./testi";
import { ID_LAVORI, statoLavori } from "./tipi";

export { ID_LAVORI, lavoriOggi, statoLavori } from "./tipi";
export type { Lavoro, StatoLavori } from "./tipi";
export { PARAMETRI_LAVORI } from "./parametri";
export type { TipoLavoro } from "./parametri";
export { azioniDelLavoro, offerteDelGiorno, offertaIn, pagaDelLavoro } from "./offerte";
export type { Offerta } from "./offerte";

// I lavori ai bastioni: ogni giorno tre capitani offrono un incarico (sorveglianza, consegna o scorta) in cambio di monete ed esperienza minima.
export const moduloLavori: DefinizioneModulo = {
  id: ID_LAVORI,
  versioneApi: VERSIONE_API,
  dipende: [ID_AZIONI, ID_CITTA, ID_COMBATTIMENTO, ID_MURA],
  contenuti: [...ILLUSTRAZIONI_LAVORI, ...CREATURE_LAVORI],
  azioni: [azioneLavora, azioneAbbandonaLavoro],
  regole: [regolaArrivo, regolaFineScontroLavoro, regolaFugaImboscata],
  testi: TESTI_LAVORI,
  stato: statoLavori,
  interfaccia: interfacciaLavori,
};
