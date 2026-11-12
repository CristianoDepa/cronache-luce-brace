import type { Contesto, StatoGioco } from "../../core/indice";
import { applicaRegole, definisciPuntoRegola } from "../../core/indice";
import { PARAMETRI_FORTUNA } from "./parametri";

export interface CalcoloFortuna {
  readonly stato: StatoGioco;
  readonly fortuna: number;
}

// Base (classe e livelli) e bonus (pozioni, amuleti): i moduli vi agganciano le proprie regole.
export const puntoFortunaBase = definisciPuntoRegola<CalcoloFortuna>("fortuna.base");
export const puntoFortunaBonus = definisciPuntoRegola<CalcoloFortuna>("fortuna.bonus");

const interoNonNegativo = (n: number): number => Math.max(0, Math.round(n));

export function fortunaBase(stato: StatoGioco, ctx: Contesto): number {
  return interoNonNegativo(applicaRegole(ctx, puntoFortunaBase, { stato, fortuna: 0 }).fortuna);
}

export function fortunaBonus(stato: StatoGioco, ctx: Contesto): number {
  return interoNonNegativo(applicaRegole(ctx, puntoFortunaBonus, { stato, fortuna: 0 }).fortuna);
}

export const fortunaTotale = (stato: StatoGioco, ctx: Contesto): number => fortunaBase(stato, ctx) + fortunaBonus(stato, ctx);

// Funzione pura: la probabilità cresce del 3% per punto di Fortuna, fino al tetto. Non può mai diminuire
// (una probabilità già oltre il tetto resta com'è).
// Il tetto è quello della Fortuna (90%) salvo chi ne chiede uno diverso (es. la quota recuperata dalla lapide, 75%).
export function conFortuna(probabilita: number, fortuna: number, tetto: number = PARAMETRI_FORTUNA.tetto): number {
  const alzata = Math.min(tetto, probabilita * (1 + PARAMETRI_FORTUNA.pesoPerPunto * fortuna));
  return Math.max(probabilita, alzata);
}

// La Fortuna agisce solo su bottino e scoperte: i moduli la usano per la probabilità di un ritrovamento.
export const probabilitaConFortuna = (stato: StatoGioco, ctx: Contesto, probabilita: number): number => conFortuna(probabilita, fortunaTotale(stato, ctx));
