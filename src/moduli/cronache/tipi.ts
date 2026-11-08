import type { Risultato } from "../../core/indice";
import { chiudi, comeOggetto, definisciStato, fallisci } from "../../core/indice";

export const ID_CRONACHE = "cronache";

export interface StatoCronache {
  // Quanti giorni sono passati dall'inizio della partita (0 il primo giorno): decide quali notizie escono. Servirà anche ai tornei.
  readonly giorni: number;
}

function convalidaStato(dati: unknown): Risultato<StatoCronache> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const g = typeof o["giorni"] === "number" && o["giorni"] >= 0 ? Math.floor(o["giorni"]) : 0;
  return chiudi([], { giorni: g });
}

export const statoCronache = definisciStato<StatoCronache>(ID_CRONACHE, 1, () => ({ giorni: 0 }), convalidaStato);
