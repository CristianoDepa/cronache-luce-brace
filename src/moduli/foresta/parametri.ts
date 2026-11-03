// Parametri della foresta (modificabili senza toccare la logica).
export const PARAMETRI_FORESTA = {
  // Incontri disponibili in un ciclo giornaliero, se il giocatore non sceglie altro.
  turniGiornoPredefinito: 30,
  // Intervallo consentito per il settaggio "turni al giorno".
  turniMin: 5,
  turniMax: 100,
} as const;
