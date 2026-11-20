// Parametri dei livelli (modificabili senza toccare la logica).
export const PARAMETRI_LIVELLI = {
  // Esperienza TOTALE da raggiungere per ESSERE a ciascun livello (posizione 0 = livello 1, 1 = livello 2...). I valori dal 13 al 20
  // sono provvisori (0.27.0 e 0.28.0), da tarare con il simulatore. Una tabella e non una formula: facile da leggere e da ritoccare. Dal 5° in su sono provvisori.
  esperienzaTotale: [0, 150, 300, 600, 1000, 1500, 2500, 4000, 6000, 9000, 15000, 25000, 34000, 43000, 53000, 64000, 76000, 89000, 103000, 118000],
  // Retta in monete per salire AL livello indicato (si paga all'inizio, anche ai livelli senza duello). Ai livelli chiave il primo
  // tentativo costa la retta intera, i successivi (dopo una sconfitta) una quota (non si ridimezza ancora).
  rette: { 2: 60, 3: 150, 4: 300, 5: 300, 6: 500, 7: 800, 8: 1200, 9: 1500, 10: 1800, 11: 2200, 12: 2600, 13: 2400, 14: 2800, 15: 3300, 16: 3900, 17: 4600, 18: 5400, 19: 6300, 20: 7300 } as Readonly<Record<number, number>>,
  quotaRitentativo: 0.5,
  // Morendo contro una creatura si perde questa quota dell'esperienza necessaria per passare al livello successivo (non di quella
  // accumulata); l'esperienza non scende mai sotto la soglia del livello attuale.
  penalitaMorte: 0.1,
  // Tetto del livello (0.28.0: 20, con il quinto capogilda; il Drago arriva con la 1.0.0): si alza quando arrivano i capigilda e i mostri delle fasce successive.
  livelloMax: 20,
  // Livello in cui il terzo capogilda ti rende degno dell'acciaio di brace (si apre il Fabbro): prima coincideva con il tetto.
  livelloDegno: 12,
  // Ai livelli chiave la gilda chiede di battere il proprio capogilda prima di salire.
  livelliChiave: [4, 8, 12, 16, 20],
} as const;
