import type { DefinizioneModulo } from "../../core/indice";
import { VERSIONE_API } from "../../core/indice";
import { ID_CITTA } from "../citta/indice";
import { ILLUSTRAZIONI_CRONACHE } from "./grafica";
import { interfacciaCronache } from "./interfaccia";
import { regolaGiornoCronache } from "./regole";
import { TESTI_CRONACHE } from "./testi";
import { ID_CRONACHE, statoCronache } from "./tipi";

export { ID_CRONACHE, statoCronache } from "./tipi";
export { NOTIZIE, chiaveNotizia } from "./dati";
export type { Notizia } from "./dati";
export { NOTIZIE_AL_GIORNO, mazzo, notizieDelGiorno, semeDelNome } from "./selezione";
export { CONTESTO_STAMPERIA } from "./interfaccia";

// Le Cronache della città: il giornale di gossip della Stamperia, con tre notizie diverse al giorno (solo flavor, per ora).
export const moduloCronache: DefinizioneModulo = {
  id: ID_CRONACHE,
  versioneApi: VERSIONE_API,
  dipende: [ID_CITTA],
  contenuti: [...ILLUSTRAZIONI_CRONACHE],
  regole: [regolaGiornoCronache],
  testi: TESTI_CRONACHE,
  stato: statoCronache,
  interfaccia: interfacciaCronache,
};
