import type { CrescitaPerClasse } from "./calcolo";

// Crescita delle classi (VALORI DECISI dal game designer; da verificare con la simulazione). Una nuova classe porta la sua voce.
// Cavaliere: forza; Mistico: difesa e mana (+3 fisso a livello dalla 0.34.0, prima +2); Ladro: velocità. HP a livello: Cavaliere +5, Ladro +4, Mistico +3.
// Al 4° livello un extra su una seconda statistica. Fortuna: +1 ogni due livelli per tutte le classi ([1, 0] = +1 ai livelli pari).
export const CRESCITA: CrescitaPerClasse = {
  cavaliere: { perLivello: { forza: 1, hp: 5 }, fortuna: [1, 0], bonus: { 4: { difesa: 1 } } },
  mistico: { perLivello: { difesa: 1, hp: 3 }, mana: [3], fortuna: [1, 0], bonus: { 4: { velocita: 1 } } },
  // Ladro (0.34.0): +1 difesa ai livelli chiave (destrezza: schiva e para meglio); totale +3 al 12, +4 al 16, +5 al 20.
  ladro: { perLivello: { velocita: 1, hp: 4 }, fortuna: [1, 0], scasso: [1], bonus: { 4: { forza: 1, difesa: 1 }, 8: { difesa: 1 }, 12: { difesa: 1 }, 16: { difesa: 1 }, 20: { difesa: 1 } } },
};
