import type { Risultato } from "../../core/indice";
import { chiudi, comeOggetto, definisciStato, fallisci } from "../../core/indice";

export const ID_FORZIERE = "forziere";

// Il forziere trovato e non ancora aperto: la zona dove è stato trovato (null se non ce n'è).
export interface StatoForziere {
  readonly zona: string | null;
}

function convalidaStato(dati: unknown): Risultato<StatoForziere> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  return chiudi([], { zona: typeof o["zona"] === "string" ? o["zona"] : null });
}

export const statoForziere = definisciStato<StatoForziere>(ID_FORZIERE, 1, () => ({ zona: null }), convalidaStato);
