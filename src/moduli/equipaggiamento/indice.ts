import type { DefinizioneModulo } from "../../core/indice";
import { VERSIONE_API } from "../../core/indice";
import { ID_COMBATTIMENTO } from "../combattimento/indice";
import { azioneCompraOggetto } from "./azioni";
import { ILLUSTRAZIONI_EQUIPAGGIAMENTO } from "./grafica";
import { interfacciaEquipaggiamento } from "./interfaccia";
import { LINEE, generaOggetti } from "./linee";
import { regolaFugaOggetti, regolaStatisticheOggetti } from "./regole";
import { TESTI_EQUIPAGGIAMENTO } from "./testi";
import { ID_EQUIPAGGIAMENTO, statoEquipaggiamento, tipoOggetto } from "./tipi";

export { ID_EQUIPAGGIAMENTO, statoEquipaggiamento, tipoOggetto, idOggetto } from "./tipi";
export type { Oggetto, StatoEquipaggiamento } from "./tipi";
export { LINEE, calcolaPrezzo } from "./linee";
export { PARAMETRI_EQUIPAGGIAMENTO } from "./parametri";

export const moduloEquipaggiamento: DefinizioneModulo = {
  id: ID_EQUIPAGGIAMENTO,
  versioneApi: VERSIONE_API,
  dipende: [ID_COMBATTIMENTO],
  tipiContenuto: [tipoOggetto],
  contenuti: [...generaOggetti(LINEE), ...ILLUSTRAZIONI_EQUIPAGGIAMENTO],
  azioni: [azioneCompraOggetto],
  regole: [regolaStatisticheOggetti, regolaFugaOggetti],
  testi: TESTI_EQUIPAGGIAMENTO,
  stato: statoEquipaggiamento,
  interfaccia: interfacciaEquipaggiamento,
};
