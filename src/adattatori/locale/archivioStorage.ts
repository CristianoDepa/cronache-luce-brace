import { fallisci, ok } from "../../core/indice";
import type { Archivio, LetturaArchivio } from "../../porte/archivio";
import { deserializzaPartita, serializzaPartita } from "../../porte/archivio";

// Sottoinsieme di Storage (localStorage): permette di usare un contenitore finto nei test.
export interface ContenitoreStringhe {
  getItem(chiave: string): string | null;
  setItem(chiave: string, valore: string): void;
  removeItem(chiave: string): void;
}

export const CHIAVE_PARTITA = "clb.partita";

export function creaArchivioStorage(contenitore: ContenitoreStringhe, chiave = CHIAVE_PARTITA): Archivio {
  return {
    async carica(): Promise<LetturaArchivio> {
      const testo = contenitore.getItem(chiave);
      if (testo === null) return ok(undefined);
      const r = deserializzaPartita(testo);
      return r.ok ? ok(r.valore) : fallisci(...r.errori);
    },
    async salva(stato): Promise<void> {
      contenitore.setItem(chiave, serializzaPartita(stato));
    },
  };
}
