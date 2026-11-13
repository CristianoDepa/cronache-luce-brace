// Parametri di Sibilla Brace, l'Incantatrice (0.17.0). VALORI DECISI dal game designer, da tarare con simulazioni.
export const PARAMETRI_INCANTATRICE = {
  // Sotto questo livello del giocatore non lo riceve.
  livelloMinimoGiocatore: 5,
  // Le armi di livello inferiore (fino a 3) non le prende in considerazione.
  livelloMinimoArma: 4,
  // Il rito costa questa quota del prezzo dell'arma.
  quotaPrezzo: 0.5,
  // L'incantamento riesce sempre; con questa probabilità (alzata dalla Fortuna: +3% per punto) c'è anche un bonus permanente ai danni...
  probabilitaBonus: 0.3,
  // ...che vale +2 con questa probabilità, altrimenti +1.
  probabilitaBonusDue: 0.3,
} as const;
