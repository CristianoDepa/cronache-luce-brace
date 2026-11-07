import type { DefinizioneModulo } from "../../core/indice";
import { VERSIONE_API } from "../../core/indice";
import { ID_AZIONI } from "../azioni/indice";
import { ID_CITTA } from "../citta/indice";
import { ID_CLASSI } from "../classi/indice";
import { ID_COMBATTIMENTO } from "../combattimento/indice";
import { ID_LIVELLI } from "../livelli/indice";
import { azioneSaliDiLivello, azioneSfidaCapogilda } from "./azioni";
import { CAPIGILDA } from "./dati";
import { ILLUSTRAZIONI_GILDE } from "./grafica";
import { interfacciaGilde } from "./interfaccia";
import { regolaFineDuello } from "./regole";
import { TESTI_GILDE } from "./testi";

export const ID_GILDE = "gilde";
export { GILDE } from "./dati";

// Le gilde di classe: luoghi (nei dati della città), scene, capigilda come creature e la salita di livello.
export const moduloGilde: DefinizioneModulo = {
  id: ID_GILDE,
  versioneApi: VERSIONE_API,
  dipende: [ID_AZIONI, ID_CITTA, ID_CLASSI, ID_COMBATTIMENTO, ID_LIVELLI],
  contenuti: [...CAPIGILDA, ...ILLUSTRAZIONI_GILDE],
  azioni: [azioneSaliDiLivello, azioneSfidaCapogilda],
  regole: [regolaFineDuello],
  testi: TESTI_GILDE,
  interfaccia: interfacciaGilde,
};
