// Parametri delle azioni giornaliere (modificabili senza toccare la logica).
export const PARAMETRI_AZIONI = {
  // Azioni disponibili in un giorno, se il giocatore non sceglie altro.
  azioniGiornoPredefinite: 50,
  // Intervallo consentito per il settaggio "azioni al giorno".
  azioniMin: 5,
  azioniMax: 100,
} as const;
