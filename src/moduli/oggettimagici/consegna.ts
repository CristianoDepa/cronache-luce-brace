import type { Contesto, EventoGioco, StatoGioco } from "../../core/indice";
import { aggiungiOggetto } from "../inventario/indice";
import { manaMassimo } from "../mana/indice";
import type { QualitaOggetto, SlotMagico, TipoOggetto } from "./dati";
import { TIPI_OGGETTO, idOggetto, nomeChiaveOggetto } from "./dati";
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

// Consegna un oggetto magico (medaglione o anello a caso, tipo a caso) della qualità data: finisce nello zaino; se è pieno non si perde, ma vale un compenso in monete.
export function consegnaOggettoMagico(stato: StatoGioco, ctx: Contesto, qualita: QualitaOggetto): { readonly stato: StatoGioco; readonly eventi: readonly EventoGioco[] } {
  const slot = slotCasuale(ctx);
  const tipo = tipoOggettoCasuale(stato, ctx);
  const nomeChiave = nomeChiaveOggetto(slot, tipo, qualita);
  const con = aggiungiOggetto(stato, idOggetto(slot, tipo, qualita));
  if (con) return { stato: con, eventi: [{ chiave: "oggettiMagici.ricevuto", parametri: { nomeChiave }, tono: "speciale", importante: true }] };
  const oro = PARAMETRI_MAGICI.compensoZainoPieno[qualita];
  const pagato: StatoGioco = { ...stato, personaggio: { ...stato.personaggio, oro: stato.personaggio.oro + oro } };
  return { stato: pagato, eventi: [{ chiave: "oggettiMagici.ricevutoOro", parametri: { nomeChiave, oro }, tono: "positivo", importante: true }] };
}
