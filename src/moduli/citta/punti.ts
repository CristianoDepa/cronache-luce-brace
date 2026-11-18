import type { Contesto, EventoGioco, Id, StatoGioco } from "../../core/indice";
import { applicaRegole, definisciPuntoRegola } from "../../core/indice";

// Punto di estensione: prima di ogni spostamento (viaggio, ingresso e uscita da un luogo) i moduli possono vietarlo con un messaggio
// (es. il torneo dell'Anfiteatro: finché si è in gara non si può lasciare l'arena).
export interface CalcoloMovimento {
  readonly stato: StatoGioco;
  // Chiave del messaggio di errore se lo spostamento è vietato.
  readonly errore?: string;
}

export const puntoMovimento = definisciPuntoRegola<CalcoloMovimento>("citta.movimento");

export function movimentoVietato(stato: StatoGioco, ctx: Contesto): string | undefined {
  return applicaRegole(ctx, puntoMovimento, { stato }).errore;
}

// Punto di estensione (0.20.0): dopo ogni arrivo a piedi in un luogo (viaggio) i moduli possono cambiare lo stato e aggiungere eventi
// (es. i lavori: la consegna o la scorta finiscono quando si arriva a destinazione, con l'eventuale imboscata).
export interface CalcoloArrivo {
  readonly stato: StatoGioco;
  readonly sito: Id;
  readonly eventi: readonly EventoGioco[];
}

export const puntoArrivo = definisciPuntoRegola<CalcoloArrivo>("citta.arrivo");
