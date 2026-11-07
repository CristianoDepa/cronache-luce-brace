import type { DefinizioneModulo } from "../../core/indice";
import { VERSIONE_API } from "../../core/indice";
import { ID_COMBATTIMENTO } from "../combattimento/indice";
import { ID_LUOGHI, tipoLuogo } from "./tipi";

export { ID_LUOGHI, tipoLuogo } from "./tipi";
export type { Luogo } from "./tipi";
export { calcolaPotenza, pesiEffettivi, pesoCreatura, pesoEffettivo, scegliConPesi } from "./pesi";
export { faseDelGiorno, oraLocale, ORA_FINE_NOTTE, ORA_INIZIO_NOTTE } from "./fase";
export type { FaseGiorno } from "./fase";
export type { PesiLuogo, PesoIncontro } from "./pesi";

// Definisce solo il tipo "luogo": i luoghi concreti li dichiarano i moduli che li usano.
export const moduloLuoghi: DefinizioneModulo = {
  id: ID_LUOGHI,
  versioneApi: VERSIONE_API,
  dipende: [ID_COMBATTIMENTO],
  tipiContenuto: [tipoLuogo],
};
