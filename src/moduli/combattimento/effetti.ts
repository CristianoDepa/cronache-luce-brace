import { limitaProbabilita } from "./calcolo";
import type { EffettoScontro } from "./tipi";

export type Attaccante = "giocatore" | "nemico";

export interface ModificatoriColpo {
  readonly moltiplicatoreDanno: number;
  readonly moltiplicatorePrecisione: number;
  readonly deltaPrecisione: number;
}

// Somma gli effetti attivi dell'attaccante: moltiplicatori in prodotto, delta in somma.
export function modificatoriAttaccante(effetti: readonly EffettoScontro[], chi: Attaccante): ModificatoriColpo {
  return effetti
    .filter((e) => e.bersaglio === chi)
    .reduce<ModificatoriColpo>(
      (m, e) => ({
        moltiplicatoreDanno: m.moltiplicatoreDanno * e.moltiplicatoreDanno,
        moltiplicatorePrecisione: m.moltiplicatorePrecisione * e.moltiplicatorePrecisione,
        deltaPrecisione: m.deltaPrecisione + e.deltaPrecisione,
      }),
      { moltiplicatoreDanno: 1, moltiplicatorePrecisione: 1, deltaPrecisione: 0 },
    );
}

// Probabilità finale di colpire: (base x moltiplicatore + delta), tra 0 e 1, arrotondata a due decimali.
export function calcolaPrecisione(base: number, m: ModificatoriColpo): number {
  return Math.round(limitaProbabilita(base * m.moltiplicatorePrecisione + m.deltaPrecisione) * 100) / 100;
}

// Dopo un attacco di "chi" (anche mancato) ogni suo effetto perde un colpo; a zero scade.
export function consumaColpi(effetti: readonly EffettoScontro[], chi: Attaccante): EffettoScontro[] {
  return effetti.flatMap((e) => (e.bersaglio !== chi ? [e] : e.colpi > 1 ? [{ ...e, colpi: e.colpi - 1 }] : []));
}

export function aggiungiEffetti(effetti: readonly EffettoScontro[], nuovi: readonly EffettoScontro[]): EffettoScontro[] {
  return [...effetti, ...nuovi];
}

// Danno dopo i moltiplicatori: arrotondato, e un colpo che va a segno fa almeno 1.
export function applicaMoltiplicatoreDanno(danno: number, moltiplicatore: number): number {
  return Math.max(1, Math.round(danno * moltiplicatore));
}
