import type { Istante } from "../core/indice";

export interface Orologio {
  adesso(): Istante;
  // Minuti da sommare all'ora universale per ottenere l'ora locale del giocatore.
  offsetFusoMinuti(): number;
  // Solo per le prove (?ora=N): un'ora locale (0-24) che vale al posto di quella vera nelle regole che dipendono dall'ora.
  oraForzata?(): number | undefined;
}
