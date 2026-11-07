import type { CrescitaPerClasse } from "./calcolo";

// Crescita delle classi (VALORI DECISI dal game designer; da verificare con la simulazione). Una nuova classe porta la sua voce.
// Cavaliere: forza; Mistico: difesa e mana (+2 fisso a livello); Ladro: velocità. HP a livello: Cavaliere +5, Ladro +4, Mistico +3.
// Al 4° livello un extra su una seconda statistica.
export const CRESCITA: CrescitaPerClasse = {
  cavaliere: { perLivello: { forza: 1, hp: 5 }, bonus: { 4: { difesa: 1 } } },
  mistico: { perLivello: { difesa: 1, hp: 3 }, mana: [2], bonus: { 4: { velocita: 1 } } },
  ladro: { perLivello: { velocita: 1, hp: 4 }, bonus: { 4: { forza: 1 } } },
};
