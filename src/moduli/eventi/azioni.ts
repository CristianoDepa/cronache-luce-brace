import type { Risultato } from "../../core/indice";
import { chiudi, comeOggetto, definisciAzione, esitoErrore, fallisci, numero } from "../../core/indice";
import { risolvi } from "./risoluzione";
import { sceltePossibili } from "./scelte";
import { eventoInCorso, senzaEvento, statoEventi } from "./tipi";

function validaPosizione(dati: unknown): Risultato<{ readonly posizione: number }> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  return chiudi(errori, { posizione: numero(o, "posizione", errori, { min: 1 }) });
}

// Sceglie una delle opzioni dell'evento in corso (per posizione, tra quelle che si vedono). L'evento o prosegue con un altro passo o finisce
// (e se la scelta è uno scontro, lo scontro comincia). Una scelta non possibile (poche monete, zaino pieno) lascia tutto com'è.
export const azioneSceltaEvento = definisciAzione("sceltaEvento", validaPosizione, (stato, dati, ctx) => {
  const corrente = sceltePossibili(stato);
  const scelta = corrente?.scelte[dati.posizione - 1];
  if (corrente === undefined || scelta === undefined) return esitoErrore("eventi.errore.scelta");
  const { zona, fase, valore } = eventoInCorso(stato);
  const r = risolvi(corrente.definizione.id, { stato, ctx, zona: zona ?? "foresta", fase, valore, scelta: scelta.chiave });
  if (!r.esito.ok) return r.esito;
  const dopo = r.prosegue ? statoEventi.scrivi(r.esito.stato, { ...eventoInCorso(stato), ...r.prosegue }) : senzaEvento(r.esito.stato);
  return { ...r.esito, stato: dopo };
});
