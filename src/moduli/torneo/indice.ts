import type { DefinizioneModulo } from "../../core/indice";
import { VERSIONE_API } from "../../core/indice";
import { ID_AZIONI } from "../azioni/indice";
import { ID_CITTA } from "../citta/indice";
import { ID_COMBATTIMENTO } from "../combattimento/indice";
import { ID_CRONACHE } from "../cronache/indice";
import { ID_POZIONI } from "../pozioni/indice";
import { azioneAvviaTorneo, azioneCombattiTurno, azioneIscriviTorneo } from "./azioni";
import { CREATURE_TORNEO } from "./dati";
import { ILLUSTRAZIONI_TORNEO } from "./grafica";
import { interfacciaTorneo } from "./interfaccia";
import { regolaFineDuelloTorneo } from "./regole";
import { TESTI_TORNEO } from "./testi";
import { ID_TORNEO, statoTorneo } from "./tipi";

export { ID_TORNEO, statoTorneo } from "./tipi";
export type { StatoTorneo, VoceAlbo } from "./tipi";
export { PARAMETRI_TORNEO } from "./parametri";
export { giorniAllaFine, quotaDiIscrizione, settimanaCorrente, statisticheAvversario, statoDiQuestaSettimana, torneoDellaSettimana } from "./calcolo";
export { ID_GLADIATORE } from "./dati";
export { CONTESTO_TORNEO } from "./interfaccia";

// I tornei dell'Anfiteatro: uno a settimana (quattro nomi a rotazione), tre duelli non letali contro gladiatori scalati sul livello.
export const moduloTorneo: DefinizioneModulo = {
  id: ID_TORNEO,
  versioneApi: VERSIONE_API,
  dipende: [ID_AZIONI, ID_CITTA, ID_COMBATTIMENTO, ID_CRONACHE, ID_POZIONI],
  contenuti: [...CREATURE_TORNEO, ...ILLUSTRAZIONI_TORNEO],
  azioni: [azioneIscriviTorneo, azioneCombattiTurno, azioneAvviaTorneo],
  regole: [regolaFineDuelloTorneo],
  testi: TESTI_TORNEO,
  stato: statoTorneo,
  interfaccia: interfacciaTorneo,
};
