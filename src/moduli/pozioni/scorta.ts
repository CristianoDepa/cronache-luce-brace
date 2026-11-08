import type { Contesto, StatoGioco } from "../../core/indice";
import { manaMassimo } from "../mana/indice";
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

function semeDelGiorno(stato: StatoGioco): number {
  return Math.floor(stato.ultimoReset / 1000) * 31;
}

// Le pozioni in vendita oggi: da 1 a 3 tipi DIVERSI scelti a caso tra i sei (sempre gli stessi per tutto il giorno), nell'ordine dei dati.
export function tipiDelGiorno(stato: StatoGioco, ctx: Contesto): readonly TipoPozione[] {
  const { tipiMin, tipiMax } = PARAMETRI_POZIONI;
  const seme = semeDelGiorno(stato);
  // La pozione di mana non si offre a chi non ha mana (Cavaliere e Ladro).
  const offerte = manaMassimo(stato, ctx) > 0 ? POZIONI : POZIONI.filter((p) => p.effetto.genere !== "mana");
  const quanti = Math.min(offerte.length, tipiMin + Math.floor(casuale(seme + 5) * (tipiMax - tipiMin + 1)));
  const scelti = offerte.map((p) => ({ tipo: p.tipo, chiave: casuale(seme + 101 + POZIONI.indexOf(p) * 7919) })).sort((a, b) => a.chiave - b.chiave).slice(0, quanti).map((x) => x.tipo);
  return offerte.map((p) => p.tipo).filter((t) => scelti.includes(t));
}

// Scorta del giorno di un tipo (0 se oggi non c'è), prima delle vendite: da scortaMin a scortaMax pezzi.
export function scortaDelGiorno(stato: StatoGioco, tipo: TipoPozione, ctx: Contesto): number {
  if (!tipiDelGiorno(stato, ctx).includes(tipo)) return 0;
  const indice = POZIONI.findIndex((p) => p.tipo === tipo);
  const { scortaMin, scortaMax } = PARAMETRI_POZIONI;
  return scortaMin + Math.floor(casuale(semeDelGiorno(stato) + 1 + indice * 104729) * (scortaMax - scortaMin + 1));
}

// Pezzi ancora in vendita oggi.
export function scortaRimasta(stato: StatoGioco, tipo: TipoPozione, ctx: Contesto): number {
  return Math.max(0, scortaDelGiorno(stato, tipo, ctx) - (statoPozioni.leggi(stato).venduti[tipo] ?? 0));
}
