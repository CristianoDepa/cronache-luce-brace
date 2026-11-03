import type { Risultato, StatoGioco } from "../core/indice";
import { comeOggetto, convalidaStatoGioco, fallisci, numero } from "../core/indice";

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

// Legge un salvataggio da testo (archivio o file importato). Qui JSON.parse può lanciare: è il confine con l'esterno.
export function deserializzaPartita(testo: string): Risultato<StatoGioco> {
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
  return convalidaStatoGioco(o["stato"]);
}
