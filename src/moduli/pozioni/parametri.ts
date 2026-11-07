// Parametri delle pozioni (modificabili senza toccare la logica). VALORI PROPOSTI, da tarare giocando.
export const PARAMETRI_POZIONI = {
  // Pozioni di effetto (forza, destrezza, corazza): +bonus alla statistica per durataBase + d(durataDado) turni di combattimento.
  bonusEffetto: 2,
  durataBase: 5,
  durataDado: 6,
  // Scorta dello Speziale: ogni giorno ogni tipo è in vendita con questa probabilità, in quantità tra min e max.
  probabilitaInVendita: 0.5,
  scortaMin: 1,
  scortaMax: 2,
  // Dopo ogni vittoria, probabilità di trovare una pozione a caso (con zaino pieno si lascia).
  probabilitaBottino: 0.02,
  // Le cure costano il doppio del Guaritore a pari HP medi: il Guaritore chiede il livello per HP, quindi leggera (3,5 HP medi) 7 x livello,
  // robusta (7 HP medi) 14 x livello.
  moltiplicatorePrezzoCura: 2,
  prezzoEffetto: 60,
  prezzoMana: 30,
} as const;
