import type { Risultato } from "../../core/indice";
import { chiudi, comeOggetto, definisciAzione, esitoErrore, esitoOk, fallisci, numero } from "../../core/indice";
import { caricaScontro } from "../combattimento/indice";
import { aggiungiOggetto, oggettoInSlot, rimuoviOggetto } from "../inventario/indice";
import { amuletoDaId, nomeChiaveAmuleto } from "./dati";
import { statoAmuleti } from "./tipi";

function validaPosizione(dati: unknown): Risultato<{ readonly posizione: number }> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  return chiudi(errori, { posizione: numero(o, "posizione", errori, { min: 1 }) });
}

// Indossa l'amuleto di uno slot dello zaino (non in combattimento). Se se ne indossava già uno, torna nello zaino al suo posto.
export const azioneIndossaAmuleto = definisciAzione("indossaAmuleto", validaPosizione, (stato, dati, ctx) => {
  const id = oggettoInSlot(stato, dati.posizione - 1);
  if (id === null) return esitoErrore("amuleti.errore.slot_vuoto");
  const amuleto = amuletoDaId(id);
  if (amuleto === undefined) return esitoErrore("amuleti.errore.non_amuleto");
  if (caricaScontro(stato, ctx) !== undefined) return esitoErrore("amuleti.errore.in_combattimento");
  const precedente = statoAmuleti.leggi(stato).indossato;
  const libero = rimuoviOggetto(stato, dati.posizione - 1);
  // Lo slot appena liberato c'è sempre: il vecchio amuleto ci rientra.
  const ripreso = precedente === null ? libero : (aggiungiOggetto(libero, precedente) ?? libero);
  const nuovo = statoAmuleti.scrivi(ripreso, { indossato: id });
  return esitoOk(nuovo, [{ chiave: "amuleti.indossato", parametri: { nomeChiave: nomeChiaveAmuleto(amuleto.tipo, amuleto.qualita) }, tono: "positivo" }]);
});
