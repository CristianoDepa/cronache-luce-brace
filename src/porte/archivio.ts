import type { Risultato, StatoGioco } from "../core/indice";
import { comeOggetto, fallisci, migraEConvalida, numero, ok } from "../core/indice";

// ok(undefined) = nessun salvataggio; errore = salvataggio presente ma danneggiato.
export type LetturaArchivio = Risultato<StatoGioco | undefined>;

export interface Archivio {
  carica(): Promise<LetturaArchivio>;
  salva(stato: StatoGioco): Promise<void>;
}

export const FORMATO_SALVATAGGIO = 1;

export function serializzaPartita(stato: StatoGioco): string {
  return JSON.stringify({ formato: FORMATO_SALVATAGGIO, stato });
}

export interface PartitaLetta {
  readonly stato: StatoGioco;
  // Versione dello schema con cui era stato scritto: se è minore dell'attuale il salvataggio è stato migrato.
  readonly versioneOrigine: number;
}

// Legge un salvataggio da testo (archivio o file importato) e lo porta alla versione attuale.
// Qui JSON.parse può lanciare: è il confine con l'esterno.
export function leggiPartita(testo: string): Risultato<PartitaLetta> {
  let grezzo: unknown;
  try {
    grezzo = JSON.parse(testo);
  } catch {
    return fallisci("il testo non è JSON valido");
  }
  const o = comeOggetto(grezzo);
  if (!o) return fallisci("salvataggio: oggetto atteso");
  const errori: string[] = [];
  const formato = numero(o, "formato", errori);
  if (formato !== FORMATO_SALVATAGGIO) return fallisci(`formato di salvataggio non supportato: ${formato}`);
  return migraEConvalida(o["stato"]);
}

export function deserializzaPartita(testo: string): Risultato<StatoGioco> {
  const r = leggiPartita(testo);
  return r.ok ? ok(r.valore.stato) : r;
}
