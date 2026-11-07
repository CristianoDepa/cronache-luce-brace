import type { StatoGioco } from "../../core/indice";
import type { TipoPozione } from "./dati";
import { POZIONI } from "./dati";
import { PARAMETRI_POZIONI } from "./parametri";
import { statoPozioni } from "./tipi";

// Numero pseudocasuale deterministico (mulberry32): la scorta di oggi dipende solo dalla data dell'ultimo reset, così il pannello e gli acquisti
// la calcolano allo stesso modo senza salvarla (e un nuovo giorno la cambia da solo).
function casuale(seme: number): number {
  let t = (seme + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// Scorta del giorno di un tipo: in vendita con probabilità 50%, in 1-2 pezzi (0 se oggi non c'è), prima delle vendite.
export function scortaDelGiorno(stato: StatoGioco, tipo: TipoPozione): number {
  const indice = POZIONI.findIndex((p) => p.tipo === tipo);
  const seme = Math.floor(stato.ultimoReset / 1000) * 31 + indice * 7919;
  if (casuale(seme) >= PARAMETRI_POZIONI.probabilitaInVendita) return 0;
  const { scortaMin, scortaMax } = PARAMETRI_POZIONI;
  return scortaMin + Math.floor(casuale(seme + 1) * (scortaMax - scortaMin + 1));
}

// Pezzi ancora in vendita oggi.
export function scortaRimasta(stato: StatoGioco, tipo: TipoPozione): number {
  return Math.max(0, scortaDelGiorno(stato, tipo) - (statoPozioni.leggi(stato).venduti[tipo] ?? 0));
}
