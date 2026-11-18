import type { Risultato } from "../../core/indice";
import { chiudi, comeOggetto, definisciAzione, esitoErrore, esitoOk, fallisci, numero } from "../../core/indice";
import { caricaScontro } from "../combattimento/indice";
import { aggiungiOggetto, oggettoInSlot, rimuoviOggetto } from "../inventario/indice";
import { nomeChiaveOggetto, oggettoMagicoDaId } from "./dati";
import { statoOggettiMagici } from "./tipi";

function validaPosizione(dati: unknown): Risultato<{ readonly posizione: number }> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  return chiudi(errori, { posizione: numero(o, "posizione", errori, { min: 1 }) });
}

// Indossa l'oggetto magico di uno slot dello zaino (non in combattimento) nello slot che gli spetta (medaglione o anello).
// Se ne indossava già uno dello stesso slot, torna nello zaino al suo posto.
export const azioneIndossaOggetto = definisciAzione("indossaOggetto", validaPosizione, (stato, dati, ctx) => {
  const id = oggettoInSlot(stato, dati.posizione - 1);
  if (id === null) return esitoErrore("oggettiMagici.errore.slot_vuoto");
  const oggetto = oggettoMagicoDaId(id);
  if (oggetto === undefined) return esitoErrore("oggettiMagici.errore.non_magico");
  if (caricaScontro(stato, ctx) !== undefined) return esitoErrore("oggettiMagici.errore.in_combattimento");
  const indossati = statoOggettiMagici.leggi(stato);
  const precedente = indossati[oggetto.slot];
  const libero = rimuoviOggetto(stato, dati.posizione - 1);
  // Lo slot appena liberato c'è sempre: il vecchio oggetto ci rientra.
  const ripreso = precedente === null ? libero : (aggiungiOggetto(libero, precedente) ?? libero);
  const nuovo = statoOggettiMagici.scrivi(ripreso, { ...indossati, [oggetto.slot]: id });
  return esitoOk(nuovo, [{ chiave: "oggettiMagici.indossato", parametri: { nomeChiave: nomeChiaveOggetto(oggetto.slot, oggetto.tipo, oggetto.qualita) }, tono: "positivo" }]);
});
