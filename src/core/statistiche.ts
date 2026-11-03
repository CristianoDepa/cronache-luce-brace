import { definisciPuntoRegola, applicaRegole } from "./regole";
import type { Contesto, StatoGioco } from "./tipi";

export interface Statistiche {
  readonly hpMax: number;
  readonly forza: number;
  readonly difesa: number;
}

export interface CalcoloStatistiche {
  readonly stato: StatoGioco;
  readonly statistiche: Statistiche;
}

// I moduli (classi, equipaggiamento, incantesimi...) modificano le statistiche agganciandosi qui.
export const puntoStatistiche = definisciPuntoRegola<CalcoloStatistiche>("nucleo.statistiche");

export function calcolaStatistiche(stato: StatoGioco, ctx: Contesto): Statistiche {
  const p = stato.personaggio;
  const base: Statistiche = { hpMax: p.hpMax, forza: p.forza, difesa: p.difesa };
  return applicaRegole(ctx, puntoStatistiche, { stato, statistiche: base }).statistiche;
}
