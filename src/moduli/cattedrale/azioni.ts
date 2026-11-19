import type { EventoGioco, Risultato, StatoGioco } from "../../core/indice";
import { definisciAzione, esitoOk, ok } from "../../core/indice";
import { PARAMETRI_CATTEDRALE } from "./parametri";
import { curaStati, prezzoCuraChiesa, statoStati } from "../stati/indice";
import { statoCattedrale } from "./tipi";

const nessunDato = (_dati: unknown): Risultato<null> => ok(null);

export const costoOfferta = (stato: StatoGioco): number => PARAMETRI_CATTEDRALE.offertaPerLivello * stato.personaggio.livello;

const parla = (chiave: string, parametri?: Readonly<Record<string, number>>): EventoGioco => ({ chiave, ...(parametri ? { parametri } : {}), tono: "speciale" });

// «Chiedi l'intercessione»: la voce c'è sempre. Se la grazia c'è già o è stata chiesta oggi, o se mancano le monete, Padre Bartolomeo risponde e non succede altro;
// altrimenti si versa l'offerta (50 monete per livello) e per oggi la prima morte viene evitata.
export const azioneChiediIntercessione = definisciAzione("chiediIntercessione", nessunDato, (stato) => {
  const s = statoCattedrale.leggi(stato);
  const costo = costoOfferta(stato);
  if (s.attiva || s.richiestaOggi) return esitoOk(stato, [parla("cattedrale.gia")]);
  if (stato.personaggio.oro < costo) return esitoOk(stato, [parla("cattedrale.oro", { costo })]);
  const pagato: StatoGioco = { ...stato, personaggio: { ...stato.personaggio, oro: stato.personaggio.oro - costo } };
  return esitoOk(statoCattedrale.scrivi(pagato, { attiva: true, richiestaOggi: true, svanita: false }), [parla("cattedrale.accettata")]);
});

// «Chiedi di essere purificato»: per una piccola offerta (monete per livello) Padre Bartolomeo scaccia veleno e paura. La voce si vede solo se serve.
export const azionePurifica = definisciAzione("purificaCattedrale", nessunDato, (stato) => {
  const s = statoStati.leggi(stato);
  if (s.veleno === 0 && s.paura === 0) return esitoOk(stato, [parla("cattedrale.nessunoStato")]);
  const prezzo = prezzoCuraChiesa(stato.personaggio.livello);
  if (stato.personaggio.oro < prezzo) return esitoOk(stato, [parla("cattedrale.oroPurifica", { prezzo })]);
  const pagato: StatoGioco = { ...stato, personaggio: { ...stato.personaggio, oro: stato.personaggio.oro - prezzo } };
  return esitoOk(curaStati(pagato), [parla("cattedrale.purificato", { prezzo })]);
});
