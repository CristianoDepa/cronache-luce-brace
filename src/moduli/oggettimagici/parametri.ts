// Parametri degli oggetti magici (medaglioni e anelli), modificabili senza toccare la logica. VALORI PROPOSTI, da tarare con simulazioni.
export const PARAMETRI_MAGICI = {
  // Punti per qualità e per slot. Forza, difesa, velocità, mana e fortuna: 1 punto = +1. L'anello vale metà del medaglione.
  puntiPerQualita: {
    medaglione: { bronzo: 2, argento: 4, oro: 6 },
    anello: { bronzo: 1, argento: 2, oro: 3 },
  },
  // Scala dei soli oggetti magici (non dell'equipaggiamento né dei livelli, che restano a 3 HP per punto): 1 punto di vita = 5 HP massimi.
  hpPerPunto: 5,
  // Quando una fonte dà un oggetto magico: probabilità che sia un anello (altrimenti è un medaglione).
  probabilitaAnello: 0.5,
  // Dopo una vittoria (non un duello): probabilità MOLTO bassa di trovare un oggetto magico (la Fortuna la alza).
  probabilitaBottino: 0.005,
  // Qualità dell'oggetto per ciascuna fonte.
  fonti: { mostri: "bronzo", predaPericolosa: "argento", torneoCampione: "oro", bossValle: "argento" },
  // Se lo zaino è pieno l'oggetto non si perde: si riceve questo compenso in monete (gli oggetti magici non si vendono).
  compensoZainoPieno: { bronzo: 60, argento: 150, oro: 400 },
} as const;
