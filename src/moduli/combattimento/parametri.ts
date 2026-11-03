// Parametri di bilanciamento del combattimento (valori iniziali, da tarare giocando).
export const PARAMETRI_COMBATTIMENTO = {
  // Il tiro aggiunto al danno è un intero in [0, dadoMax].
  dadoMax: 4,
  probabilitaFugaBase: 0.5,
  // Quota di oro in mano persa alla sconfitta.
  penalitaOroMorte: 0.25,
} as const;
