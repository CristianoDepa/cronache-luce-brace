// Parametri delle missioni di recupero (0.30.0), modificabili senza toccare la logica. VALORI DI PARTENZA da tarare giocando e con il simulatore.
export const PARAMETRI_RECUPERI = {
  // Probabilità, a ogni vittoria nella zona della missione, di trovare l'oggetto (con l'effetto della Fortuna: +3% per punto).
  probabilita: 0.04,
  // Prezzo = moltiplicatore x oro medio di uno scontro nella zona (vedi ZONE_RECUPERI), con una variazione di ± variazione
  // fissata dal giorno e dall'oggetto, arrotondato a 5, tra un minimo e un massimo.
  moltiplicatorePrezzo: 4,
  variazione: 0.25,
  arrotondamento: 5,
  prezzoMin: 40,
  prezzoMax: 2000,
  // Giorno di mercato: probabilità giornaliera (decisa dalla data, come la scorta dello Speziale) e bonus se si consegnano entrambi gli oggetti.
  probabilitaMercato: 1 / 7,
  bonusDoppia: 0.25,
  // Quante missioni insieme: una di norma, due nel giorno di mercato.
  missioniNormali: 1,
  missioniMercato: 2,
  // Offerta rara (0.30.0): una offerta su 8 (solo la prima del giorno), ritrovamento all'1% e paga 3 volte (il tetto per la rara è 3 volte il massimo normale).
  frequenzaRara: 1 / 8,
  probabilitaRara: 0.01,
  moltiplicatoreRaro: 3,
  // Fiducia: +5% di compenso ogni 5 oggetti consegnati, fino a 3 gradini (+15%); si somma al bonus del mercato.
  consegnePerGradino: 5,
  bonusGradino: 0.05,
  gradiniMax: 3,
  // Registro completo (tutti e dodici gli oggetti consegnati almeno una volta): premio una tantum in monete.
  premioRegistro: 3000,
  // Chiacchiere: 1 azione, una volta al giorno; per quel giorno la probabilità di ritrovamento si moltiplica per bonusDritta (4% -> 6%, 1% -> 1,5%).
  costoChiacchiere: 1,
  bonusDritta: 1.5,
  // Giorno di mercato: pozioni a caso in premio a chi consegna entrambi gli oggetti (con lo zaino pieno valgono il loro prezzo in monete).
  pozioniDoppia: 1,
} as const;
