import type { VoceContenuto } from "../../core/indice";
import { BASE_TAGLIABORSE } from "./parametri";

export const ID_TAGLIABORSE = "tagliaborse";

// Il tagliaborse, ladro delle imboscate ai lavori: compare solo lì (nessun luogo lo elenca), senza oro né esperienza (il premio è la paga del lavoro).
export const CREATURE_LAVORI: readonly VoceContenuto[] = [
  {
    tipo: "creatura",
    id: ID_TAGLIABORSE,
    dati: {
      nomeChiave: "lavori.creatura.tagliaborse", nomeBreveChiave: "lavori.creatura.tagliaborse.breve", hp: BASE_TAGLIABORSE.hp, forza: BASE_TAGLIABORSE.forza,
      difesa: 3, oro: 0, esperienza: 0, velocita: 4, immagineId: "sprite.tagliaborse", natura: {}, famiglia: "umanoidi",
    },
  },
];
