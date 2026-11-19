import type { Risultato, StatoGioco } from "../../core/indice";
import { chiudi, comeOggetto, definisciStato, fallisci } from "../../core/indice";

export const ID_EVENTI = "eventi";

// L'evento in corso (null = nessuno): l'id, la zona dove avviene (foresta, palude, cimitero, valle o città), la fase (per gli eventi a più passi)
// e un valore che l'evento si porta dietro (la puntata del gioco del maiale). Finché c'è, il gioco mostra la schermata dell'evento.
export interface StatoEventi {
  readonly evento: string | null;
  readonly zona: string | null;
  readonly fase: number;
  readonly valore: number;
}

const VUOTO: StatoEventi = { evento: null, zona: null, fase: 0, valore: 0 };

function convalidaStato(dati: unknown): Risultato<StatoEventi> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const evento = typeof o["evento"] === "string" ? o["evento"] : null;
  if (evento === null) return chiudi([], VUOTO);
  const fase = typeof o["fase"] === "number" && o["fase"] >= 0 ? Math.floor(o["fase"]) : 0;
  const valore = typeof o["valore"] === "number" && o["valore"] >= 0 ? o["valore"] : 0;
  return chiudi([], { evento, zona: typeof o["zona"] === "string" ? o["zona"] : null, fase, valore });
}

export const statoEventi = definisciStato<StatoEventi>(ID_EVENTI, 1, () => VUOTO, convalidaStato);

export const eventoInCorso = (stato: StatoGioco): StatoEventi => statoEventi.leggi(stato);
export const senzaEvento = (stato: StatoGioco): StatoGioco => statoEventi.scrivi(stato, VUOTO);
