import type { Id, StatoGioco } from "../../core/indice";
import type { ScontroAttivo, StatisticheNemico } from "./tipi";
import { STATISTICHE_VUOTE, statoCombattimento } from "./tipi";

// Somma i valori indicati ai contatori della creatura. Funzione pura: restituisce un nuovo stato.
export function registraStatistiche(stato: StatoGioco, creaturaId: Id, aggiunte: Partial<StatisticheNemico>): StatoGioco {
  const corrente = statoCombattimento.leggi(stato);
  const prima = corrente.statistiche[creaturaId] ?? STATISTICHE_VUOTE;
  const dopo: StatisticheNemico = {
    incontri: prima.incontri + (aggiunte.incontri ?? 0),
    sconfitti: prima.sconfitti + (aggiunte.sconfitti ?? 0),
    morti: prima.morti + (aggiunte.morti ?? 0),
    perse: prima.perse + (aggiunte.perse ?? 0),
    fugheRiuscite: prima.fugheRiuscite + (aggiunte.fugheRiuscite ?? 0),
    fugheFallite: prima.fugheFallite + (aggiunte.fugheFallite ?? 0),
    dannoInflitto: prima.dannoInflitto + (aggiunte.dannoInflitto ?? 0),
    dannoSubito: prima.dannoSubito + (aggiunte.dannoSubito ?? 0),
    // Un nuovo incontro azzera il danno "dell'ultima volta"; poi ogni colpo lo accumula.
    ultimoInflitto: (aggiunte.incontri ? 0 : prima.ultimoInflitto) + (aggiunte.dannoInflitto ?? 0),
    // Il primo incontro con una creatura le assegna il numero d'ordine successivo (per il bestiario).
    ordine: prima.incontri === 0 && (aggiunte.incontri ?? 0) > 0 ? 1 + Math.max(0, ...Object.values(corrente.statistiche).map((s) => s.ordine)) : prima.ordine,
  };
  return statoCombattimento.scrivi(stato, { ...corrente, statistiche: { ...corrente.statistiche, [creaturaId]: dopo } });
}

// Cambia lo scontro in corso (o lo chiude con null) senza perdere le statistiche.
export function impostaScontro(stato: StatoGioco, scontro: ScontroAttivo | null): StatoGioco {
  const corrente = statoCombattimento.leggi(stato);
  return statoCombattimento.scrivi(stato, { ...corrente, scontro });
}

export function sommaStatistiche(tutte: Readonly<Record<Id, StatisticheNemico>>): StatisticheNemico {
  return Object.values(tutte).reduce<StatisticheNemico>(
    (totale, s) => ({
      incontri: totale.incontri + s.incontri,
      sconfitti: totale.sconfitti + s.sconfitti,
      morti: totale.morti + s.morti,
      perse: totale.perse + s.perse,
      fugheRiuscite: totale.fugheRiuscite + s.fugheRiuscite,
      fugheFallite: totale.fugheFallite + s.fugheFallite,
      dannoInflitto: totale.dannoInflitto + s.dannoInflitto,
      dannoSubito: totale.dannoSubito + s.dannoSubito,
      ultimoInflitto: 0,
      ordine: 0,
    }),
    STATISTICHE_VUOTE,
  );
}
