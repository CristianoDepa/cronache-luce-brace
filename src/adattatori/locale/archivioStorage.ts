import { fallisci, ok } from "../../core/indice";
import type { Archivio, LetturaArchivio } from "../../porte/archivio";
import { leggiPartita, serializzaPartita } from "../../porte/archivio";
import { VERSIONE_SCHEMA } from "../../core/indice";

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
      const r = leggiPartita(testo);
      if (!r.ok) return fallisci(...r.errori);
      if (r.valore.versioneOrigine < VERSIONE_SCHEMA) {
        // Salvataggio di una versione precedente: prima si conserva una copia, poi si salva quello migrato.
        const chiaveBackup = `${chiave}.backup-v${r.valore.versioneOrigine}`;
        if (contenitore.getItem(chiaveBackup) === null) contenitore.setItem(chiaveBackup, testo);
        contenitore.setItem(chiave, serializzaPartita(r.valore.stato));
      }
      return ok(r.valore.stato);
    },
    async salva(stato): Promise<void> {
      contenitore.setItem(chiave, serializzaPartita(stato));
    },
  };
}
