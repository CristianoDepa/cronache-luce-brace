import type { Risultato } from "../../core/indice";
import { chiudi, comeOggetto, definisciStato, fallisci } from "../../core/indice";

export const ID_TORRE = "torre";

// I tre segreti della Torre: la storia (prima salita), le stelle (prima salita di notte) e la concentrazione (solo il Mistico, prima salita).
export const SEGRETI = ["storia", "stelle", "concentrazione"] as const;
export type Segreto = (typeof SEGRETI)[number];

export interface StatoTorre {
  readonly segreti: readonly Segreto[];
}

function convalidaStato(dati: unknown): Risultato<StatoTorre> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const grezzi = Array.isArray(o["segreti"]) ? o["segreti"] : [];
  const segreti = SEGRETI.filter((s) => grezzi.includes(s));
  return chiudi([], { segreti });
}

export const statoTorre = definisciStato<StatoTorre>(ID_TORRE, 1, () => ({ segreti: [] }), convalidaStato);
