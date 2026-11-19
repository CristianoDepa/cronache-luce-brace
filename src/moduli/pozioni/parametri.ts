// Parametri delle pozioni (modificabili senza toccare la logica). VALORI PROPOSTI, da tarare giocando.
export const PARAMETRI_POZIONI = {
  // Pozioni di effetto (forza, destrezza, corazza): +bonus alla statistica per durataBase + d(durataDado) turni di combattimento.
  bonusEffetto: 2,
  // La pozione della fortuna dà un bonus più alto (la Fortuna è una statistica piccola: classe 2-5, +1 ogni 2 livelli).
  bonusFortuna: 5,
  durataBase: 5,
  durataDado: 6,
  // Scorta dello Speziale: ogni giorno ha da tipiMin a tipiMax pozioni DIVERSE (a caso tra le sei), ciascuna in quantità tra scortaMin e scortaMax.
  tipiMin: 1,
  tipiMax: 3,
  scortaMin: 1,
  scortaMax: 2,
  // Dopo ogni vittoria, probabilità di trovare una pozione a caso (con zaino pieno si lascia).
  probabilitaBottino: 0.02,
  // Le cure (0.25.0) costano 1,55 volte il Guaritore a pari HP medi (il Guaritore chiede il livello per HP), arrotondate per eccesso alle 5 monete
  // e con un tetto per tipo: a livello 11 la leggera costa 250 e la robusta 450, e da lì il prezzo non sale più.
  moltiplicatorePrezzoCura: 1.55,
  arrotondamentoPrezzoCura: 5,
  tettoPrezzoCura: { curaLeggera: 250, curaRobusta: 450 },
  // Lo Speziale ricompra le pozioni sigillate (quelle nello zaino) a questa quota del loro valore (il prezzo di acquisto al tuo livello).
  quotaRiacquisto: 0.3,
  prezzoEffetto: 60,
  prezzoMana: 30,
  // L'antidoto (0.23.0): prezzo fisso, sempre in vendita allo Speziale (un pezzo o due al giorno). I tasti dello Speziale diventano quattro.
  prezzoAntidoto: 30,
  slotSpeziale: 4,
} as const;
