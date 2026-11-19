import type { StatoGioco } from "../../core/indice";
import type { DefinizioneEvento, SceltaEvento } from "./dati";
import { eventoPerId } from "./dati";
import { pattoStretto } from "../stati/indice";
import { eventoInCorso } from "./tipi";

// L'evento in corso con le scelte di questa fase che si possono fare ora (quelle che costano monete si vedono solo se si hanno).
export function sceltePossibili(stato: StatoGioco): { readonly definizione: DefinizioneEvento; readonly scelte: readonly SceltaEvento[] } | undefined {
  const { evento, fase } = eventoInCorso(stato);
  const definizione = evento === null ? undefined : eventoPerId(evento);
  if (definizione === undefined) return undefined;
  return { definizione, scelte: (definizione.scelte[fase] ?? []).filter((s) => (s.costoOro === undefined || stato.personaggio.oro >= s.costoOro) && (s.soloSenzaPatto !== true || pattoStretto(stato) === null)) };
}
