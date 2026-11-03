import { definisciPuntoRegola, applicaRegole } from "./regole";
import type { Contesto, EventoGioco, StatoGioco } from "./tipi";

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
  const base: Statistiche = { hpMax: p.hpMaxBase, forza: p.forzaBase, difesa: p.difesaBase };
  return applicaRegole(ctx, puntoStatistiche, { stato, statistiche: base }).statistiche;
}

export interface RisultatoRiallineamento {
  readonly stato: StatoGioco;
  // Presente solo se gli HP sono stati ridotti al nuovo massimo.
  readonly evento?: EventoGioco;
}

// Gli HP non possono superare il massimo effettivo (es. dopo aver cambiato armatura). Un solo punto del nucleo
// se ne occupa dopo ogni azione, così nessun modulo deve ricordarsene.
export function riallineaHp(stato: StatoGioco, ctx: Contesto): RisultatoRiallineamento {
  const { hpMax } = calcolaStatistiche(stato, ctx);
  const hp = stato.personaggio.hp;
  if (hp <= hpMax) return { stato };
  return {
    stato: { ...stato, personaggio: { ...stato.personaggio, hp: hpMax } },
    evento: { chiave: "nucleo.hpRiallineati", parametri: { hp: hpMax } },
  };
}
