import type { Contesto, EventoGioco, StatoGioco } from "../../core/indice";
import { aggiungiOggetto } from "../inventario/indice";
import { manaMassimo } from "../mana/indice";
import type { QualitaAmuleto, TipoAmuleto } from "./dati";
import { TIPI_AMULETO, idAmuleto, nomeChiaveAmuleto } from "./dati";
import { PARAMETRI_AMULETI } from "./parametri";

// Un tipo a caso. Il medaglione del mana non cade a chi non ha mana.
export function tipoAmuletoCasuale(stato: StatoGioco, ctx: Contesto): TipoAmuleto {
  const possibili = TIPI_AMULETO.filter((t) => t !== "mana" || manaMassimo(stato, ctx) > 0);
  return possibili[Math.min(possibili.length - 1, Math.floor(ctx.rng.prossimo() * possibili.length))]!;
}

// Consegna un amuleto di un tipo a caso e della qualità data: finisce nello zaino; se è pieno non si perde, ma vale un compenso in monete.
export function consegnaAmuleto(stato: StatoGioco, ctx: Contesto, qualita: QualitaAmuleto): { readonly stato: StatoGioco; readonly eventi: readonly EventoGioco[] } {
  const tipo = tipoAmuletoCasuale(stato, ctx);
  const nomeChiave = nomeChiaveAmuleto(tipo, qualita);
  const con = aggiungiOggetto(stato, idAmuleto(tipo, qualita));
  if (con) return { stato: con, eventi: [{ chiave: "amuleti.ricevuto", parametri: { nomeChiave }, tono: "speciale", importante: true }] };
  const oro = PARAMETRI_AMULETI.compensoZainoPieno[qualita];
  const pagato: StatoGioco = { ...stato, personaggio: { ...stato.personaggio, oro: stato.personaggio.oro + oro } };
  return { stato: pagato, eventi: [{ chiave: "amuleti.ricevutoOro", parametri: { nomeChiave, oro }, tono: "positivo", importante: true }] };
}
