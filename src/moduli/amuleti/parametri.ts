// Parametri degli amuleti (modificabili senza toccare la logica). VALORI PROPOSTI, da tarare con simulazioni.
export const PARAMETRI_AMULETI = {
  // Bonus per qualità (forza, difesa, velocità, mana, fortuna); gli HP massimi hanno il moltiplicatore qui sotto (+6/+12/+18).
  bonusPerQualita: { bronzo: 2, argento: 4, oro: 6 },
  moltiplicatoreVita: 3,
  // Dopo una vittoria (non un duello): probabilità MOLTO bassa di trovare un amuleto (la Fortuna la alza).
  probabilitaBottino: 0.005,
  // Qualità dell'amuleto per ciascuna fonte.
  fonti: { mostri: "bronzo", predaPericolosa: "argento", torneoCampione: "oro" },
  // Se lo zaino è pieno l'amuleto non si perde: si riceve questo compenso in monete (gli amuleti non si vendono).
  compensoZainoPieno: { bronzo: 60, argento: 150, oro: 400 },
} as const;
