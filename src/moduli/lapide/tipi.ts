import type { Risultato, StatoGioco } from "../../core/indice";
import { chiudi, comeOggetto, definisciStato, fallisci } from "../../core/indice";
import { eZonaLapide } from "./parametri";

export const ID_LAPIDE = "lapide";

// UNA SOLA lapide in tutto il gioco: quella dell'ultima morte in una zona (la vecchia si perde con il suo oro).
// zona = dove si trova (null = nessuna lapide); oro = le monete custodite (non si mostrano mai); eta = giorni di gioco passati dalla morte (0 = oggi).
export interface StatoLapide {
  readonly zona: string | null;
  readonly oro: number;
  readonly eta: number;
}

const naturale = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= 0;

function convalidaStato(dati: unknown): Risultato<StatoLapide> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const zona = o["zona"];
  if (zona === null || zona === undefined) return chiudi([], { zona: null, oro: 0, eta: 0 });
  if (typeof zona !== "string" || eZonaLapide(zona) === undefined) return fallisci("zona non valida");
  if (!naturale(o["oro"]) || !naturale(o["eta"])) return fallisci("oro ed eta: interi non negativi attesi");
  return chiudi([], { zona, oro: o["oro"], eta: o["eta"] });
}

export const statoLapide = definisciStato<StatoLapide>(ID_LAPIDE, 2, () => ({ zona: null, oro: 0, eta: 0 }), convalidaStato);

// L'oro custodito nella zona indicata (0 se la lapide è altrove o non c'è).
export const oroCustodito = (stato: StatoGioco, zona: string): number => {
  const l = statoLapide.leggi(stato);
  return l.zona === zona ? l.oro : 0;
};
