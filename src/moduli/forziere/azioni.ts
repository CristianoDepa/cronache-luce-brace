import type { Risultato } from "../../core/indice";
import { definisciAzione, esitoErrore, esitoOk, ok } from "../../core/indice";
import { impostaScoperta } from "../scoperta/indice";
import { tentaApertura } from "./apertura";
import { statoForziere } from "./tipi";

const nessunDato = (_dati: unknown): Risultato<null> => ok(null);

// Apre il forziere trovato (gratis, un solo tentativo).
export const azioneApriForziere = definisciAzione("apriForziere", nessunDato, (stato, _dati, ctx) => {
  const zona = statoForziere.leggi(stato).zona;
  if (zona === null) return esitoErrore("forziere.errore.nessuno");
  const r = tentaApertura(stato, zona, ctx);
  const fallita = r.eventi.some((e) => e.chiave === "forziere.fallito");
  return esitoOk(impostaScoperta(r.stato, fallita ? "apertura-fallita" : "apertura-riuscita", zona), r.eventi);
});
