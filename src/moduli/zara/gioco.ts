import type { Contesto } from "../../core/indice";
import { PARAMETRI_ZARA } from "./parametri";

export type EsitoZara = "vinci" | "perdi" | "zara";

// Quanto vale ogni puntata (piccola, media, grossa) al livello dato.
export function puntataInMonete(indice: number, livello: number): number {
  return (PARAMETRI_ZARA.puntate[indice] ?? PARAMETRI_ZARA.puntate[0]!) * livello;
}

export function quotaDelNumero(numero: number): number {
  return PARAMETRI_ZARA.quote[numero] ?? 0;
}

// La vincita in monete per una puntata e un numero (le quote possono avere decimali: si arrotonda per difetto alla moneta,
// così con le puntate piccole il banco non perde mai).
export function vincitaDi(puntata: number, numero: number): number {
  return Math.floor(puntata * quotaDelNumero(numero));
}

// I numeri che si possono chiamare, dal più basso al più alto.
export function numeriChiamabili(): readonly number[] {
  const elenco: number[] = [];
  for (let n = PARAMETRI_ZARA.numeroMin; n <= PARAMETRI_ZARA.numeroMax; n++) elenco.push(n);
  return elenco;
}

// L'oste tira i dadi (tre d6) con il generatore del motore.
export function tiraDadi(ctx: Contesto): readonly number[] {
  return Array.from({ length: PARAMETRI_ZARA.dadi }, () => 1 + Math.min(5, Math.floor(ctx.rng.prossimo() * 6)));
}

export function sommaDei(dadi: readonly number[]): number {
  return dadi.reduce((s, d) => s + d, 0);
}

// "Zara!" se la somma è troppo bassa o troppo alta (nessuno può chiamarla); altrimenti vinci se hai indovinato.
export function esitoDelTiro(somma: number, chiamato: number): EsitoZara {
  if (somma < PARAMETRI_ZARA.zaraSotto || somma > PARAMETRI_ZARA.zaraSopra) return "zara";
  return somma === chiamato ? "vinci" : "perdi";
}

// Quante combinazioni su 216 (tre dadi) danno quella somma.
export function combinazioniDelNumero(numero: number): number {
  let n = 0;
  for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) for (let c = 1; c <= 6; c++) if (a + b + c === numero) n++;
  return n;
}

// La probabilità di vincere chiamando quel numero, in percentuale con un decimale (es. 12,5 per il 10).
export function percentualeDelNumero(numero: number): number {
  return Math.round((combinazioniDelNumero(numero) / 216) * 1000) / 10;
}

