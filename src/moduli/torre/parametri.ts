// Parametri della Torre Guinigi (modificabili senza toccare la logica).
export const PARAMETRI_TORRE = {
  // Salire costa 1 azione solo quando c'è un segreto da scoprire in quel momento; altrimenti è gratis.
  costoSalita: 1,
  // Segreto 1 (prima salita): HP massimi permanenti per tutte le classi.
  bonusHp: 3,
  // Segreto 3 (prima salita del Mistico): mana massimo permanente.
  bonusMana: 1,
  // Il mostro che si apre nel bestiario con il segreto della prima salita di notte.
  mostroDelleStelle: "spettro",
} as const;
