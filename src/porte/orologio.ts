import type { Istante } from "../core/indice";

export interface Orologio {
  adesso(): Istante;
  // Minuti da sommare all'ora universale per ottenere l'ora locale del giocatore.
  offsetFusoMinuti(): number;
}
