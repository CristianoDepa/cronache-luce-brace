import type { VoceContenuto } from "../../core/indice";
import { BASE_GLADIATORE, PARAMETRI_TORNEO } from "./parametri";

// I gladiatori sono creature non letali (non si può fuggire, perdere non uccide: si resta a 1 HP), senza oro né esperienza: i premi sono del torneo.
// Hanno tutti gli stessi valori: HP e forza reali dipendono dal livello del giocatore e dal turno (potenziamento); cambia solo l'aspetto.
export const ID_GLADIATORI: readonly string[] = PARAMETRI_TORNEO.gladiatori.map((t) => `gladiatore-${t}`);

export const eGladiatore = (id: string): boolean => ID_GLADIATORI.includes(id);

export const CREATURE_TORNEO: readonly VoceContenuto[] = PARAMETRI_TORNEO.gladiatori.map((tipo): VoceContenuto => ({
  tipo: "creatura",
  id: `gladiatore-${tipo}`,
  dati: {
    nomeChiave: "torneo.gladiatore", nomeBreveChiave: "torneo.gladiatore.breve", hp: BASE_GLADIATORE.hp, forza: BASE_GLADIATORE.forza, difesa: 4, oro: 0, esperienza: 0,
    velocita: 9, fugaConsentita: false, nonLetale: true, immagineId: `sprite.gladiatore.${tipo}`, messaggioSconfittaChiave: "torneo.sconfittaDuello", gruppoStatistiche: "gladiatore",
  },
}));
