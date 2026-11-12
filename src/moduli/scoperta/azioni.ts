import type { Risultato } from "../../core/indice";
import { definisciAzione, esitoOk, ok } from "../../core/indice";
import { statoScoperta } from "./tipi";

const nessunDato = (_dati: unknown): Risultato<null> => ok(null);

// «Continua»: chiude la schermata di scoperta e si torna alla porta della zona.
export const azioneChiudiScoperta = definisciAzione("chiudiScoperta", nessunDato, (stato) => esitoOk(statoScoperta.scrivi(stato, { tipo: null, zona: null }), []));
