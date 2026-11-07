import type { Risultato } from "../../core/indice";
import { booleano, chiudi, comeOggetto, definisciStato, fallisci, numero } from "../../core/indice";

export const ID_LIVELLI = "livelli";

// Se oggi il capogilda ha battuto il giocatore: il nuovo tentativo aspetta il giorno dopo.
export interface StatoLivelli {
  readonly maestroPerso: boolean;
  // Tentativi di duello già fatti per il livello chiave successivo (si azzera salendo): dal secondo la retta è ridotta.
  readonly tentativi: number;
}

function convalida(dati: unknown): Risultato<StatoLivelli> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  return chiudi(errori, { maestroPerso: booleano(o, "maestroPerso", errori, false), tentativi: numero(o, "tentativi", errori, { min: 0, predefinito: 0 }) });
}

export const statoLivelli = definisciStato<StatoLivelli>(ID_LIVELLI, 1, () => ({ maestroPerso: false, tentativi: 0 }), convalida);
