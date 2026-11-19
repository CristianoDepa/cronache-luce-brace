// Gli stati (0.23.0): VALORI DI PARTENZA, da tarare giocando (decisi dal game designer il 18-11-2026).
export const PARAMETRI_STATI = {
  // Il veleno dura azioni e toglie HP a ogni azione spesa, ma non uccide mai da solo (si ferma a 1 HP).
  veleno: { azioni: 8, hpPerAzione: 1 },
  // La paura dura azioni e abbassa forza e difesa.
  paura: { azioni: 8, forza: 1, difesa: 1 },
  // Probabilità che un colpo a segno di una creatura che infligge uno stato lo infligga davvero.
  probabilitaColpo: 0.25,
  // Rimedi a pagamento (curano veleno e paura insieme): monete per ogni livello del personaggio.
  curaGuaritorePerLivello: 8,
  curaChiesaPerLivello: 5,
} as const;
