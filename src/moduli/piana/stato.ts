import type { Risultato } from "../../core/indice";
import { chiudi, comeOggetto, definisciStato, fallisci } from "../../core/indice";

export const ID_PIANA = "piana";

// Lo stato della piana: la Quercia delle streghe si sfida una volta al giorno (si rinnova al nuovo giorno).
export interface StatoPiana {
  readonly querciaSfidata: boolean;
}

const STATO_PIANA_INIZIALE: StatoPiana = { querciaSfidata: false };

function convalidaStato(dati: unknown): Risultato<StatoPiana> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  return chiudi([], { querciaSfidata: o["querciaSfidata"] === true });
}

export const statoPiana = definisciStato<StatoPiana>(ID_PIANA, 1, () => STATO_PIANA_INIZIALE, convalidaStato);
