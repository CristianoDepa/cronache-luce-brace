// Parametri dei lavori ai bastioni (modificabili senza toccare la logica). Tutti i numeri sono PROVVISORI: si tarano con il simulatore
// sul confronto con l'oro netto del combattimento per azione (obiettivo: i lavori sicuri rendono circa il 60% di un combattimento).
export const PARAMETRI_LAVORI = {
  // Quanti bastioni (su sei) hanno un incarico ogni giorno: è anche il limite naturale dei lavori al giorno.
  offerteAlGiorno: 3,
  // Peso di ogni tipo nell'estrazione dell'incarico di un bastione (stessa probabilità all'inizio).
  pesiTipi: { sorveglianza: 1, consegna: 1, scorta: 1 },
  // Sorveglianza: azioni spese sul posto. Consegna e scorta: azioni di carico alla partenza (il viaggio si paga a parte, camminando).
  azioniSorveglianza: 3,
  azioniCarico: 1,
  // Paga = livello x tariffa x azioni del lavoro (per consegna e scorta: carico + azioni del viaggio previsto, almeno 1).
  tariffe: { sorveglianza: 8, consegna: 12, scorta: 12 },
  // Esperienza (minima, per non scavalcare la progressione): punti per azione del lavoro.
  esperienzaPerAzione: 1,
  // Probabilità di imboscata all'arrivo a destinazione.
  probabilitaImboscata: { consegna: 0.25, scorta: 0.5 },
  // Ai primi livelli i lavori sono "tranquillini": fino a questo livello (compreso) vale la probabilità ridotta.
  livelloTranquillo: 2,
  probabilitaImboscataTranquilla: { consegna: 0.1, scorta: 0.2 },
  // Il Tagliaborse (la creatura dell'imboscata): HP e forza = fattore x (base + per livello x livello del giocatore); la creatura in dati.ts
  // ha valori base fissi (BASE_TAGLIABORSE) e il potenziamento li porta a questi. Senza oro né esperienza propri: il premio è la paga del lavoro.
  tagliaborse: { fattore: 0.8, hpBase: 30, hpPerLivello: 12, forzaBase: 6, forzaPerLivello: 1.5 },
  // Scena dello scontro (i bastioni).
  scenaImboscata: "scena.mura",
} as const;

// I valori della creatura "tagliaborse" (in dati.ts): HP e forza si moltiplicano con il potenziamento.
export const BASE_TAGLIABORSE = { hp: 100, forza: 10 } as const;

export type TipoLavoro = keyof typeof PARAMETRI_LAVORI.tariffe;
