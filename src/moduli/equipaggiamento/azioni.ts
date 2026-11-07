import type { EventoGioco, Id, Risultato } from "../../core/indice";
import { chiudi, comeOggetto, definisciAzione, esitoErrore, esitoOk, fallisci, leggiContenuto, ok, stringa } from "../../core/indice";
import { caricaScontro, risolviRound } from "../combattimento/indice";
import type { SlotAcquisto } from "./acquisto";
import { calcolaOfferta } from "./acquisto";
import { idOggetto, statoEquipaggiamento, tipoOggetto } from "./tipi";

function validaCompra(dati: unknown): Risultato<{ readonly linea: Id; readonly slot: SlotAcquisto }> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  const linea = stringa(o, "linea", errori);
  if (o["slot"] !== undefined && o["slot"] !== "riserva" && o["slot"] !== "principale") errori.push('campo "slot": "principale" o "riserva" atteso');
  return chiudi(errori, { linea, slot: o["slot"] === "riserva" ? "riserva" : "principale" });
}

// Compra il livello successivo della linea scelta (nello slot principale o in quello di riserva); l'oggetto sostituito viene rivenduto.
export const azioneCompraOggetto = definisciAzione("compraOggetto", validaCompra, (stato, dati, ctx) => {
  const offerta = calcolaOfferta(stato, dati.linea, ctx, dati.slot);
  if (!offerta) return esitoErrore("equipaggiamento.errore.non_disponibile", dati.linea);
  if (stato.personaggio.oro < offerta.prezzoNetto) {
    return esitoErrore("equipaggiamento.errore.oro_insufficiente", String(offerta.prezzoNetto));
  }
  const { oggetto } = offerta;
  const slot = { linea: oggetto.linea, livello: oggetto.livello };
  const eq = statoEquipaggiamento.leggi(stato);
  const nuovoEq = dati.slot === "riserva" ? { ...eq, riserva: slot } : oggetto.tipo === "arma" ? { ...eq, arma: slot } : { ...eq, armatura: slot };
  const nuovoStato = statoEquipaggiamento.scrivi({ ...stato, personaggio: { ...stato.personaggio, oro: stato.personaggio.oro - offerta.prezzoNetto } }, nuovoEq);
  return esitoOk(nuovoStato, [
    {
      chiave: "equipaggiamento.acquisto",
      parametri: { oggettoChiave: oggetto.nomeChiave, livello: oggetto.livello, prezzo: offerta.prezzoNetto },
      tono: "positivo",
    },
  ]);
});

const nessunDato = (_dati: unknown): Risultato<null> => ok(null);

// Scambia l'arma in mano con quella di riserva. Fuori dal combattimento è gratis; durante uno scontro (anche un duello) costa il turno:
// il nemico attacca mentre si cambia.
export const azioneScambiaArma = definisciAzione("scambiaArma", nessunDato, (stato, _dati, ctx) => {
  const eq = statoEquipaggiamento.leggi(stato);
  if (!eq.riserva) return esitoErrore("equipaggiamento.errore.nessuna_riserva");
  const nuovo = statoEquipaggiamento.scrivi(stato, { ...eq, arma: eq.riserva, riserva: eq.arma ?? null });
  const oggetto = leggiContenuto(ctx.registro, tipoOggetto, idOggetto(eq.riserva.linea, eq.riserva.livello));
  const evento: EventoGioco = { chiave: "equipaggiamento.scambio", parametri: { oggettoChiave: oggetto?.nomeChiave ?? eq.riserva.linea }, tono: "speciale" };
  if (!caricaScontro(nuovo, ctx)) return esitoOk(nuovo, [evento]);
  const round = risolviRound(nuovo, ctx, { salta: true });
  return round.ok ? esitoOk(round.stato, [evento, ...round.eventi]) : round;
});
