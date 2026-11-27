import type { Risultato } from "../../core/indice";
import { chiudi, comeOggetto, definisciStato, fallisci } from "../../core/indice";

export const ID_SAN_DONATO = "sandonato";

// Lo stato di San Donato: i luoghi battuti almeno una volta (per sempre) e quelli già affrontati oggi (si rinnovano al nuovo giorno).
export interface StatoSanDonato {
  readonly battuti: readonly string[];
  readonly oggi: readonly string[];
}

const INIZIALE: StatoSanDonato = { battuti: [], oggi: [] };

const elenco = (v: unknown): readonly string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

function convalidaStato(dati: unknown): Risultato<StatoSanDonato> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  return chiudi([], { battuti: elenco(o["battuti"]), oggi: elenco(o["oggi"]) });
}

export const statoSanDonato = definisciStato<StatoSanDonato>(ID_SAN_DONATO, 1, () => INIZIALE, convalidaStato);
