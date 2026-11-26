import type { DefinizioneModulo } from "../../core/indice";
import { VERSIONE_API } from "../../core/indice";
import { ID_CITTA } from "../citta/indice";
import { ID_COMBATTIMENTO } from "../combattimento/indice";
import { ID_AZIONI } from "../azioni/indice";
import { ID_CRONACHE } from "../cronache/indice";
import { ID_FORTUNA } from "../fortuna/indice";
import { ID_POZIONI } from "../pozioni/indice";
import { ID_INVENTARIO } from "../inventario/indice";
import { azioneAbbandonaMissioni, azioneAccettaMissione, azioneChiacchiere, azioneConsegnaOggetti, azioneDevMercato, azioneDevTrovaOggetti } from "./azioni";
import { CONTENUTI_RECUPERI } from "./dati";
import { ILLUSTRAZIONI_RECUPERI } from "./grafica";
import { interfacciaRecuperi } from "./interfaccia";
import { regolaOggettoTrovato } from "./regole";
import { TESTI_RECUPERI } from "./testi";
import { ID_RECUPERI, statoRecuperi } from "./tipi";

export { ID_RECUPERI } from "./tipi";
export { OGGETTI_RECUPERI, ZONE_RECUPERI } from "./dati";
export { èGiornoDiMercato, offerteDelGiorno } from "./offerte";
export { statoRecuperi } from "./tipi";

// Le missioni di recupero (0.30.0): il mercante del tempo perduto, nella Loggia dei Mercanti, cerca oggetti strani delle zone già aperte;
// si trovano (con poca probabilità) vincendo nella zona, e si consegnano per un compenso. Nel giorno di mercato gli oggetti sono due.
export const moduloRecuperi: DefinizioneModulo = {
  id: ID_RECUPERI,
  versioneApi: VERSIONE_API,
  dipende: [ID_CITTA, ID_COMBATTIMENTO, ID_FORTUNA, ID_AZIONI, ID_POZIONI, ID_CRONACHE, ID_INVENTARIO],
  contenuti: [...CONTENUTI_RECUPERI, ...ILLUSTRAZIONI_RECUPERI],
  azioni: [azioneAccettaMissione, azioneChiacchiere, azioneConsegnaOggetti, azioneAbbandonaMissioni, azioneDevMercato, azioneDevTrovaOggetti],
  regole: [regolaOggettoTrovato],
  stato: statoRecuperi,
  testi: TESTI_RECUPERI,
  interfaccia: interfacciaRecuperi,
};
