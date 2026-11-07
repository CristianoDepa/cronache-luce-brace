// Parametri dell'equipaggiamento (modificabili senza toccare la logica).
// Le tre classi di peso decidono quanta potenza dà ogni livello, quanto velocizza o rallenta e fin dove arriva la linea.
// Regola di progetto: a ogni livello una linea dà "punti" di combattimento (forza o difesa = 1 punto, 3 HP = 1 punto);
// più è pesante, più punti dà per livello e meno è veloce. Ogni linea arriva alla stessa potenza massima (circa 20 punti):
// leggera 10 livelli, media 7, pesante 5. La velocità è fissa per linea (non cresce con il livello).
export const PARAMETRI_EQUIPAGGIAMENTO = {
  // Quota del prezzo incassata rivendendo l'oggetto sostituito.
  quotaRivendita: 0.33,
  // Il prezzo SEGUE I PUNTI e non il livello: a pari potenza, pari prezzo.
  // prezzo = prezzoBase x crescitaPrezzo^(punti / 2 - 1)  (leggera: 50 al livello 1, poi x1,6 a livello).
  prezzoBase: 50,
  crescitaPrezzo: 1.6,
  classiDiPeso: {
    leggera: { punti: 2, velocita: 3, livelliMax: 10 },
    media: { punti: 3, velocita: 0, livelliMax: 7 },
    pesante: { punti: 4, velocita: -3, livelliMax: 5 },
  },
} as const;

export type Peso = keyof typeof PARAMETRI_EQUIPAGGIAMENTO.classiDiPeso;
