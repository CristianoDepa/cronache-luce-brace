import type { Id, Risultato } from "../../core/indice";
import { chiudi, comeOggetto, definisciAzione, esitoErrore, esitoOk, fallisci, stringa } from "../../core/indice";
import { calcolaOfferta } from "./acquisto";
import { statoEquipaggiamento } from "./tipi";

function validaLinea(dati: unknown): Risultato<{ readonly linea: Id }> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  const linea = stringa(o, "linea", errori);
  return chiudi(errori, { linea });
}

// Compra il livello successivo della linea scelta; l'oggetto sostituito viene rivenduto.
export const azioneCompraOggetto = definisciAzione("compraOggetto", validaLinea, (stato, dati, ctx) => {
  const offerta = calcolaOfferta(stato, dati.linea, ctx);
  if (!offerta) return esitoErrore("equipaggiamento.errore.non_disponibile", dati.linea);
  if (stato.personaggio.oro < offerta.prezzoNetto) {
    return esitoErrore("equipaggiamento.errore.oro_insufficiente", String(offerta.prezzoNetto));
  }
  const { oggetto } = offerta;
  const slot = { linea: oggetto.linea, livello: oggetto.livello };
  const eq = statoEquipaggiamento.leggi(stato);
  const nuovoStato = statoEquipaggiamento.scrivi(
    { ...stato, personaggio: { ...stato.personaggio, oro: stato.personaggio.oro - offerta.prezzoNetto } },
    oggetto.tipo === "arma" ? { ...eq, arma: slot } : { ...eq, armatura: slot },
  );
  return esitoOk(nuovoStato, [
    {
      chiave: "equipaggiamento.acquisto",
      parametri: { oggettoChiave: oggetto.nomeChiave, livello: oggetto.livello, prezzo: offerta.prezzoNetto },
      tono: "positivo",
    },
  ]);
});
