import type { Contesto, StatoGioco } from "../../core/indice";
import { applicaRegole, definisciPuntoRegola } from "../../core/indice";
import { statoMana } from "./tipi";

export interface CalcoloManaMassimo {
  readonly stato: StatoGioco;
  readonly mana: number;
}

// Mana massimo: parte da zero (non tutte le classi hanno mana) e le regole dei moduli lo alzano.
export const puntoManaMassimo = definisciPuntoRegola<CalcoloManaMassimo>("mana.massimo");

export function manaMassimo(stato: StatoGioco, ctx: Contesto): number {
  return Math.max(0, Math.round(applicaRegole(ctx, puntoManaMassimo, { stato, mana: 0 }).mana));
}

// Mana attuale, mai oltre il massimo (se il massimo scende, il mana si adegua).
export function manaAttuale(stato: StatoGioco, ctx: Contesto): number {
  return Math.min(statoMana.leggi(stato).attuale, manaMassimo(stato, ctx));
}

// Spende "quanto" mana; restituisce undefined se non ce n'è abbastanza.
export function spendiMana(stato: StatoGioco, ctx: Contesto, quanto: number): StatoGioco | undefined {
  const disponibile = manaAttuale(stato, ctx);
  return disponibile < quanto ? undefined : statoMana.scrivi(stato, { attuale: disponibile - quanto });
}

// Aggiunge "quanto" mana, senza superare il massimo (es. una pozione di mana).
export function aggiungiMana(stato: StatoGioco, ctx: Contesto, quanto: number): StatoGioco {
  return statoMana.scrivi(stato, { attuale: Math.min(manaMassimo(stato, ctx), manaAttuale(stato, ctx) + quanto) });
}

// Riempie il mana fino al massimo (nuovo giorno, riposo in locanda, scelta della classe).
export function ripristinaMana(stato: StatoGioco, ctx: Contesto): StatoGioco {
  return statoMana.scrivi(stato, { attuale: manaMassimo(stato, ctx) });
}
