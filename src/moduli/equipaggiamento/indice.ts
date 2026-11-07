import type { DefinizioneModulo } from "../../core/indice";
import { VERSIONE_API } from "../../core/indice";
import { ID_CLASSI } from "../classi/indice";
import { ID_COMBATTIMENTO } from "../combattimento/indice";
import { azioneCompraOggetto, azioneScambiaArma } from "./azioni";
import { ILLUSTRAZIONI_EQUIPAGGIAMENTO } from "./grafica";
import { interfacciaEquipaggiamento } from "./interfaccia";
import { LINEE, generaOggetti } from "./linee";
import { regolaStatisticheOggetti, regolaTipoDannoArma, regolaVelocitaOggetti } from "./regole";
import { TESTI_EQUIPAGGIAMENTO } from "./testi";
import { ID_EQUIPAGGIAMENTO, statoEquipaggiamento, tipoOggetto } from "./tipi";

export { ID_EQUIPAGGIAMENTO, statoEquipaggiamento, tipoOggetto, idOggetto } from "./tipi";
export type { Oggetto, StatoEquipaggiamento } from "./tipi";
export { LINEE, calcolaPrezzo, calcolaPunti, livelloMassimo, prezzoPerPunti } from "./linee";
export { PARAMETRI_EQUIPAGGIAMENTO } from "./parametri";
export { calcolaOfferta } from "./acquisto";

export const moduloEquipaggiamento: DefinizioneModulo = {
  id: ID_EQUIPAGGIAMENTO,
  versioneApi: VERSIONE_API,
  dipende: [ID_COMBATTIMENTO, ID_CLASSI],
  tipiContenuto: [tipoOggetto],
  contenuti: [...generaOggetti(LINEE), ...ILLUSTRAZIONI_EQUIPAGGIAMENTO],
  azioni: [azioneCompraOggetto, azioneScambiaArma],
  regole: [regolaStatisticheOggetti, regolaVelocitaOggetti, regolaTipoDannoArma],
  testi: TESTI_EQUIPAGGIAMENTO,
  stato: statoEquipaggiamento,
  interfaccia: interfacciaEquipaggiamento,
};
