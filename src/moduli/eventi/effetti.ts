import type { Contesto, EventoGioco, StatoGioco } from "../../core/indice";
import { calcolaStatistiche } from "../../core/indice";
import { consumaAzioni } from "../azioni/indice";
import { aggiungiMana, manaMassimo } from "../mana/indice";

// Piccoli effetti comuni agli eventi: tutte funzioni pure sullo stato.
export type Tono = NonNullable<EventoGioco["tono"]>;
export const evento = (chiave: string, parametri?: Readonly<Record<string, string | number>>, tono?: Tono): EventoGioco => ({ chiave, ...(parametri ? { parametri } : {}), ...(tono ? { tono } : {}) });

export const livelloDi = (stato: StatoGioco): number => stato.personaggio.livello;

// Aggiunge (o toglie, se negativo) monete: mai sotto zero.
export const conOro = (stato: StatoGioco, quanto: number): StatoGioco => ({ ...stato, personaggio: { ...stato.personaggio, oro: Math.max(0, stato.personaggio.oro + quanto) } });

// Costa qualche azione in più; se non ne restano, l'evento non le chiede (non si blocca mai la schermata).
export const conAzioni = (stato: StatoGioco, quante: number): StatoGioco => consumaAzioni(stato, quante) ?? stato;

export const conEsperienza = (stato: StatoGioco, quanta: number): StatoGioco => ({ ...stato, personaggio: { ...stato.personaggio, esperienza: stato.personaggio.esperienza + quanta } });

// Guarisce una quota degli HP massimi.
export function cura(stato: StatoGioco, ctx: Contesto, quota: number): { readonly stato: StatoGioco; readonly curati: number } {
  const hpMax = calcolaStatistiche(stato, ctx).hpMax;
  const curati = Math.max(0, Math.min(hpMax - stato.personaggio.hp, Math.ceil(hpMax * quota)));
  return { stato: { ...stato, personaggio: { ...stato.personaggio, hp: stato.personaggio.hp + curati } }, curati };
}

// Toglie una quota degli HP massimi, ma MAI letale: resta almeno 1 HP.
export function danno(stato: StatoGioco, ctx: Contesto, quota: number): { readonly stato: StatoGioco; readonly persi: number } {
  const hpMax = calcolaStatistiche(stato, ctx).hpMax;
  const persi = Math.max(0, Math.min(stato.personaggio.hp - 1, Math.ceil(hpMax * quota)));
  return { stato: { ...stato, personaggio: { ...stato.personaggio, hp: stato.personaggio.hp - persi } }, persi };
}

// Restituisce una quota del mana massimo (niente per chi non ha mana).
export function curaMana(stato: StatoGioco, ctx: Contesto, quota: number): StatoGioco {
  const massimo = manaMassimo(stato, ctx);
  return massimo > 0 ? aggiungiMana(stato, ctx, Math.ceil(massimo * quota)) : stato;
}

// Un valore tra min e max (estremi compresi) con un solo tiro.
export const traMinEMax = (ctx: Contesto, min: number, max: number): number => Math.round(min + ctx.rng.prossimo() * (max - min));
