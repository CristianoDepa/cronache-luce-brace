// Parametri della città (modificabili senza toccare la logica).
export const PARAMETRI_CITTA = {
  // 5-10 movimenti consumano un'azione: il resto si conserva fino al nuovo giorno.
  movimentiPerAzione: 8,
  // Dove si parte (0.31.0: Piazza dell'Anfiteatro) e dove si rinasce dopo la morte (fuori dalla prima porta).
  sitoIniziale: "piazza-n",
  sitoRinascita: "porta-s",
  // Luoghi già noti all'inizio, oltre a quello di partenza: la strada per la foresta (la porta) e la piazza della locanda (Anfiteatro).
  sitiNotiAllInizio: ["porta-s"],
} as const;
