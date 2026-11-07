import type { Risultato } from "../../core/indice";
import { chiudi, comeOggetto, definisciStato, fallisci, numero } from "../../core/indice";

export const ID_MANA = "mana";

// Il mana attuale; il massimo non è salvato: si calcola dalle regole (classe, oggetti...), come gli HP massimi.
export interface StatoMana {
  readonly attuale: number;
}

function convalidaStato(dati: unknown): Risultato<StatoMana> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  return chiudi(errori, { attuale: numero(o, "attuale", errori, { min: 0 }) });
}

export const statoMana = definisciStato<StatoMana>(ID_MANA, 1, () => ({ attuale: 0 }), convalidaStato);
