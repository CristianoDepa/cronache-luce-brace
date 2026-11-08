import type { VoceContenuto } from "../../core/indice";
import { BASE_GLADIATORE } from "./parametri";

export const ID_GLADIATORE = "gladiatore";

// Il combattente base del torneo: non si può fuggire e perdere non uccide (si resta a 1 HP), come nei duelli con i capigilda. HP e forza
// reali dipendono dal livello del giocatore e dal turno (potenziamento), difesa e velocità sono fisse. Niente oro né esperienza: i premi sono del torneo.
export const CREATURE_TORNEO: readonly VoceContenuto[] = [
  {
    tipo: "creatura",
    id: ID_GLADIATORE,
    dati: { nomeChiave: "torneo.gladiatore", nomeBreveChiave: "torneo.gladiatore.breve", hp: BASE_GLADIATORE.hp, forza: BASE_GLADIATORE.forza, difesa: 4, oro: 0, esperienza: 0, velocita: 9, fugaConsentita: false, nonLetale: true, immagineId: "sprite.capogilda.cavaliere" },
  },
];
