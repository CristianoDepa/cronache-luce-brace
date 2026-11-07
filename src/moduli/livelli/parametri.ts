// Parametri dei livelli (modificabili senza toccare la logica).
export const PARAMETRI_LIVELLI = {
  // Esperienza TOTALE da raggiungere per ESSERE a ciascun livello (posizione 0 = livello 1, 1 = livello 2...). I valori oltre il
  // livello 12 sono una riserva. Una tabella e non una formula: facile da leggere e da ritoccare. Dal 5° in su sono provvisori.
  esperienzaTotale: [0, 150, 300, 600, 1000, 1500, 2500, 4000, 6000, 9000, 15000, 25000, 40000, 60000],
  // Retta in monete per salire AL livello indicato (si paga all'inizio, anche ai livelli senza duello). Ai livelli chiave il primo
  // tentativo costa la retta intera, i successivi (dopo una sconfitta) una quota (non si ridimezza ancora).
  rette: { 2: 60, 3: 150, 4: 300, 5: 300, 6: 500, 7: 800 } as Readonly<Record<number, number>>,
  quotaRitentativo: 0.5,
  // Morendo contro una creatura si perde questa quota dell'esperienza necessaria per passare al livello successivo (non di quella
  // accumulata); l'esperienza non scende mai sotto la soglia del livello attuale.
  penalitaMorte: 0.1,
  // Tetto provvisorio (0.9.0: 7): si alza quando arrivano i capigilda e i mostri delle fasce successive.
  livelloMax: 7,
  // Ai livelli chiave la gilda chiede di battere il proprio capogilda prima di salire.
  livelliChiave: [4, 8, 12],
} as const;
