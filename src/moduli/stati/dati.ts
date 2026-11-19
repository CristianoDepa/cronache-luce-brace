import type { Id } from "../../core/indice";
import { PARAMETRI_STATI } from "./parametri";

export type TipoStato = "veleno" | "paura";

// Quali creature infliggono uno stato quando colpiscono (con la probabilità comune di PARAMETRI_STATI).
export const CREATURE_CHE_INFLIGGONO: Readonly<Record<Id, TipoStato>> = {
  serpe: "veleno",
  rospo: "veleno",
  spettro: "paura",
  annegato: "paura",
  dama_della_nebbia: "paura",
};

// I patti del Diavolo del Ponte (permanenti, uno solo per partita). Ogni patto dà qualcosa e ne toglie qualcos'altro.
export interface DefinizionePatto {
  readonly id: Id;
  readonly forza: number;
  readonly difesa: number;
  readonly hpMax: number;
  readonly fortuna: number;
  // Moltiplicatore delle monete che i mostri lasciano (1 = invariato).
  readonly oroMostri: number;
}
const NESSUNO = { forza: 0, difesa: 0, hpMax: 0, fortuna: 0, oroMostri: 1 };
export const PATTI: readonly DefinizionePatto[] = [
  { id: "forza", ...NESSUNO, forza: 3, hpMax: -6 },
  { id: "difesa", ...NESSUNO, difesa: 3, forza: -3 },
  { id: "fortuna", ...NESSUNO, fortuna: 2, oroMostri: 0.75 },
];
export const pattoPerId = (id: string | null): DefinizionePatto | undefined => PATTI.find((p) => p.id === id);

export const DURATA: Readonly<Record<TipoStato, number>> = { veleno: PARAMETRI_STATI.veleno.azioni, paura: PARAMETRI_STATI.paura.azioni };
