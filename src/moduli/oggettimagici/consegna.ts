import type { Contesto, EventoGioco, StatoGioco } from "../../core/indice";
import { aggiungiOggetto } from "../inventario/indice";
import { manaMassimo } from "../mana/indice";
import type { QualitaOggetto, SlotMagico, TipoOggetto } from "./dati";
import { TIPI_OGGETTO, idOggetto, nomeChiaveOggetto, oggettoMagicoDaId } from "./dati";
import { PARAMETRI_MAGICI } from "./parametri";

// Un tipo a caso. Il medaglione e l'anello del mana non cadono a chi non ha mana.
export function tipoOggettoCasuale(stato: StatoGioco, ctx: Contesto): TipoOggetto {
  const possibili = TIPI_OGGETTO.filter((t) => t !== "mana" || manaMassimo(stato, ctx) > 0);
  return possibili[Math.min(possibili.length - 1, Math.floor(ctx.rng.prossimo() * possibili.length))]!;
}

// Lo slot dell'oggetto: un anello con la probabilità dei parametri, altrimenti un medaglione.
export function slotCasuale(ctx: Contesto): SlotMagico {
  return ctx.rng.prossimo() < PARAMETRI_MAGICI.probabilitaAnello ? "anello" : "medaglione";
}

// Sorteggia un oggetto magico (slot e tipo a caso) della qualità data, senza consegnarlo: la cripta (0.25.0) lo fa quando lo trovi, per dirti subito cosa hai trovato.
export function sorteggiaOggettoMagico(stato: StatoGioco, ctx: Contesto, qualita: QualitaOggetto): string {
  const slot = slotCasuale(ctx);
  const tipo = tipoOggettoCasuale(stato, ctx);
  return idOggetto(slot, tipo, qualita);
}

// Consegna un oggetto magico già scelto (id): finisce nello zaino; se è pieno non si perde, ma vale un compenso in monete.
export function consegnaOggettoMagicoId(stato: StatoGioco, id: string): { readonly stato: StatoGioco; readonly eventi: readonly EventoGioco[] } {
  const oggetto = oggettoMagicoDaId(id);
  if (!oggetto) return { stato, eventi: [] };
  const nomeChiave = nomeChiaveOggetto(oggetto.slot, oggetto.tipo, oggetto.qualita);
  const con = aggiungiOggetto(stato, id);
  if (con) return { stato: con, eventi: [{ chiave: "oggettiMagici.ricevuto", parametri: { nomeChiave }, tono: "speciale", importante: true }] };
  const oro = PARAMETRI_MAGICI.compensoZainoPieno[oggetto.qualita];
  const pagato: StatoGioco = { ...stato, personaggio: { ...stato.personaggio, oro: stato.personaggio.oro + oro } };
  return { stato: pagato, eventi: [{ chiave: "oggettiMagici.ricevutoOro", parametri: { nomeChiave, oro }, tono: "positivo", importante: true }] };
}

// Consegna un oggetto magico (medaglione o anello a caso, tipo a caso) della qualità data.
export function consegnaOggettoMagico(stato: StatoGioco, ctx: Contesto, qualita: QualitaOggetto): { readonly stato: StatoGioco; readonly eventi: readonly EventoGioco[] } {
  return consegnaOggettoMagicoId(stato, sorteggiaOggettoMagico(stato, ctx, qualita));
}
