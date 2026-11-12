import type { DefinizioneModulo } from "../../core/indice";
import { VERSIONE_API } from "../../core/indice";
import { ID_COMBATTIMENTO } from "../combattimento/indice";
import { ID_FORESTA } from "../foresta/indice";
import { ID_FORTUNA } from "../fortuna/indice";
import { ID_SCOPERTA } from "../scoperta/indice";
import { regolaEtaLapide, regolaLapideAllaMorte, regolaScopertaLapide } from "./regole";
import { ID_LAPIDE, oroCustodito, statoLapide } from "./tipi";

export { ID_LAPIDE, oroCustodito, statoLapide } from "./tipi";
export type { StatoLapide } from "./tipi";
export { PARAMETRI_LAPIDE, ZONE_LAPIDE, zonaLapidePerScena } from "./parametri";
export { quotaRecupero, recuperaLapide } from "./recupero";

// Lapide: l'oro perso morendo in una zona resta in una lapide (una sola, quella dell'ultima morte); la si trova ESPLORANDO la zona e se ne
// recupera una quota. Il registro dei caduti (modulo registro) dice dove si trova. Nessuna voce di menu: è una scoperta dell'esplorazione.
export const moduloLapide: DefinizioneModulo = {
  id: ID_LAPIDE,
  versioneApi: VERSIONE_API,
  dipende: [ID_COMBATTIMENTO, ID_FORESTA, ID_FORTUNA, ID_SCOPERTA],
  regole: [regolaLapideAllaMorte, regolaEtaLapide, regolaScopertaLapide],
  stato: statoLapide,
  testi: {
    it: {
      "lapide.zona.foresta": "nella foresta",
      "lapide.zona.palude": "nella palude",
      "lapide.zona.cimitero": "nel cimitero",
      "lapide.sorge": "Dove sei caduto sorge una lapide: forse, tornando, potrai ritrovarla.",
      "lapide.persa": "La lapide di prima è andata perduta, con tutto quello che custodiva.",
      "lapide.trovata": "Trovi la tua lapide {zonaChiave}: recuperi {oro} {oro#moneta|monete}; il resto è perso per sempre.",
    },
    en: {
      "lapide.zona.foresta": "in the forest",
      "lapide.zona.palude": "in the swamp",
      "lapide.zona.cimitero": "in the graveyard",
      "lapide.sorge": "A gravestone rises where you fell: maybe, coming back, you will find it again.",
      "lapide.persa": "The previous gravestone is lost, along with everything it held.",
      "lapide.trovata": "You find your gravestone {zonaChiave}: you recover {oro} {oro#coin|coins}; the rest is lost for good.",
    },
  },
};
