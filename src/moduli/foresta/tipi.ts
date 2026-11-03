import type { Risultato, StatoGioco } from "../../core/indice";
import { chiudi, comeOggetto, definisciStato, fallisci, numero } from "../../core/indice";
import { PARAMETRI_FORESTA } from "./parametri";

export const ID_FORESTA = "foresta";

export interface StatoForesta {
  // Incontri a disposizione in un giorno (settaggio del giocatore).
  readonly turniGiorno: number;
  readonly turniResidui: number;
}

function convalidaStato(dati: unknown): Risultato<StatoForesta> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  // turniGiorno è opzionale: i salvataggi della versione precedente non lo contengono.
  const stato: StatoForesta = {
    turniGiorno: numero(o, "turniGiorno", errori, { min: 1, predefinito: PARAMETRI_FORESTA.turniGiornoPredefinito }),
    turniResidui: numero(o, "turniResidui", errori, { min: 0 }),
  };
  return chiudi(errori, stato);
}

export const statoForesta = definisciStato<StatoForesta>(
  ID_FORESTA,
  1,
  () => ({
    turniGiorno: PARAMETRI_FORESTA.turniGiornoPredefinito,
    turniResidui: PARAMETRI_FORESTA.turniGiornoPredefinito,
  }),
  convalidaStato,
);

export function leggiTurniResidui(stato: StatoGioco): number {
  return statoForesta.leggi(stato).turniResidui;
}

// Consuma incontri se ce ne sono abbastanza; altrimenti restituisce undefined e nulla cambia.
// È l'API con cui altri moduli (es. locanda) spendono gli incontri del giorno.
export function consumaTurni(stato: StatoGioco, quanti: number): StatoGioco | undefined {
  const corrente = statoForesta.leggi(stato);
  if (quanti > corrente.turniResidui) return undefined;
  return statoForesta.scrivi(stato, { ...corrente, turniResidui: corrente.turniResidui - quanti });
}
