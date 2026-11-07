// Parametri della città (modificabili senza toccare la logica).
export const PARAMETRI_CITTA = {
  // 5-10 movimenti consumano un'azione: il resto si conserva fino al nuovo giorno.
  movimentiPerAzione: 8,
  // Dove si parte e dove si rinasce dopo la morte.
  sitoIniziale: "porta-s",
} as const;
