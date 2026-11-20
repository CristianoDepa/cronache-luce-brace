import type { Risultato } from "../../core/indice";
import { chiudi, comeOggetto, definisciStato, fallisci } from "../../core/indice";

export const ID_COLLINE = "colline";

// Lo stato delle colline: il Capitano dei Banditi si sfida una volta al giorno (si rinnova al nuovo giorno).
export interface StatoColline {
  readonly capitanoSfidato: boolean;
}

const STATO_COLLINE_INIZIALE: StatoColline = { capitanoSfidato: false };

function convalidaStato(dati: unknown): Risultato<StatoColline> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  return chiudi([], { capitanoSfidato: o["capitanoSfidato"] === true });
}

export const statoColline = definisciStato<StatoColline>(ID_COLLINE, 1, () => STATO_COLLINE_INIZIALE, convalidaStato);
