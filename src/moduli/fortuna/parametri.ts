// Parametri della Fortuna (modificabili senza toccare la logica). VALORI PROPOSTI, da tarare con simulazioni.
export const PARAMETRI_FORTUNA = {
  // Ogni punto di Fortuna moltiplica la probabilità base di +3% (fortuna 10 = x1,3).
  pesoPerPunto: 0.03,
  // Nessuna probabilità, per effetto della Fortuna, supera questo tetto.
  tetto: 0.9,
} as const;
