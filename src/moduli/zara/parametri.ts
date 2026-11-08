// Parametri della Zara, il gioco di dadi della Locanda (modificabili senza toccare la logica).
export const PARAMETRI_ZARA = {
  // Le tre puntate, in monete per livello del personaggio: piccola, media, grossa.
  puntate: [2, 5, 10],
  // Si chiama la somma di tre dadi tra questi due numeri (compresi).
  numeroMin: 7,
  numeroMax: 14,
  // Quanto paga, in volte la puntata (oltre a tenersi la puntata), ogni numero: i più rari pagano di più. Tarate perché il vantaggio dell'oste
  // sia circa quello della roulette europea (2,7%): da 1,6% a 3,1% a seconda del numero.
  quote: { 7: 13, 8: 9, 9: 7.5, 10: 6.75, 11: 6.75, 12: 7.5, 13: 9, 14: 13 } as Readonly<Record<number, number>>,
  // Somme così basse o così alte sono "Zara!": non si possono chiamare e vince sempre l'oste.
  zaraSotto: 7,
  zaraSopra: 14,
  dadi: 3,
  costoAzioni: 1,
} as const;
