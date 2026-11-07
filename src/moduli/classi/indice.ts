import type { DefinizioneModulo } from "../../core/indice";
import { VERSIONE_API } from "../../core/indice";
import { ID_COMBATTIMENTO } from "../combattimento/indice";
import { ID_MANA } from "../mana/indice";
import { azioneScegliClasse } from "./azioni";
import { CLASSI } from "./dati";
import { ILLUSTRAZIONI_CLASSI } from "./grafica";
import { interfacciaClassi } from "./interfaccia";
import { regolaManaClasse, regolaOroClasse, regolaStatisticheClasse, regolaVelocitaClasse } from "./regole";
import { TESTI_CLASSI } from "./testi";
import { ID_CLASSI, statoClassi, tipoClasse } from "./tipi";

export { ID_CLASSI, statoClassi, tipoClasse } from "./tipi";
export type { Classe, ModificatoriClasse, StatoClassi } from "./tipi";
export { CONTESTO_CREAZIONE, CONTESTO_INFO_CLASSI, contestoClasse } from "./interfaccia";

export const moduloClassi: DefinizioneModulo = {
  id: ID_CLASSI,
  versioneApi: VERSIONE_API,
  dipende: [ID_COMBATTIMENTO, ID_MANA],
  tipiContenuto: [tipoClasse],
  contenuti: [...CLASSI, ...ILLUSTRAZIONI_CLASSI],
  azioni: [azioneScegliClasse],
  regole: [regolaStatisticheClasse, regolaVelocitaClasse, regolaOroClasse, regolaManaClasse],
  testi: TESTI_CLASSI,
  stato: statoClassi,
  interfaccia: interfacciaClassi,
};
