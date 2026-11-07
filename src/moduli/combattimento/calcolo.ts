import { PARAMETRI_COMBATTIMENTO } from "./parametri";
import type { NaturaCreatura, TipoDanno } from "./tipi";
// Calcoli puri del combattimento: nessuno stato, nessun I/O.

// Danno di un colpo: forza + tiro - difesa, ma non meno del danno minimo (quota della forza dell'attaccante, almeno 1).
export function dannoMinimo(forzaAttaccante: number): number {
  return Math.max(1, Math.ceil(forzaAttaccante * PARAMETRI_COMBATTIMENTO.quotaDannoMinimo));
}

export function calcolaDannoBase(forzaAttaccante: number, tiro: number, difesaBersaglio: number): number {
  return Math.max(dannoMinimo(forzaAttaccante), forzaAttaccante + tiro - difesaBersaglio);
}

// Moltiplicatore del danno di un tipo contro una creatura (1 se non ha una natura per quel tipo).
export function moltiplicatoreTipo(natura: NaturaCreatura | undefined, tipo: TipoDanno): number {
  return natura?.[tipo] ?? 1;
}

export function limitaProbabilita(probabilita: number): number {
  return Math.min(1, Math.max(0, probabilita));
}

export function calcolaOroPerso(oro: number, quota: number): number {
  return Math.floor(oro * quota);
}

export type Iniziativa = "giocatore" | "nemico";

// Probabilità di fuga: la base più "perPunto" per ogni punto di velocità in più del nemico (meno se è più lento),
// tenuta fra il minimo e il massimo. Arrotondata a due decimali per evitare errori di virgola mobile.
export function calcolaProbabilitaFuga(
  velocitaGiocatore: number,
  velocitaNemico: number,
  parametri: { readonly base: number; readonly perPunto: number; readonly minima: number; readonly massima: number },
): number {
  const grezza = parametri.base + (velocitaGiocatore - velocitaNemico) * parametri.perPunto;
  return Math.round(Math.min(parametri.massima, Math.max(parametri.minima, grezza)) * 100) / 100;
}

// Chi colpisce per primo in un round: il più veloce. A parità si sorteggia (solo in quel caso si chiama "sorteggia").
export function chiAttaccaPerPrimo(velocitaGiocatore: number, velocitaNemico: number, sorteggia: () => number): Iniziativa {
  if (velocitaGiocatore !== velocitaNemico) return velocitaGiocatore > velocitaNemico ? "giocatore" : "nemico";
  return sorteggia() < 0.5 ? "giocatore" : "nemico";
}
