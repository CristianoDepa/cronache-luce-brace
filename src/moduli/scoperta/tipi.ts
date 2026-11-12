import type { Risultato, StatoGioco } from "../../core/indice";
import { chiudi, comeOggetto, definisciStato, fallisci } from "../../core/indice";

export const ID_SCOPERTA = "scoperta";

export type TipoScoperta = "lapide" | "forziere";
const TIPI: readonly TipoScoperta[] = ["lapide", "forziere"];

// La scoperta in corso (null = nessuna): il tipo (lapide o forziere) e la zona dove è avvenuta (foresta, palude, cimitero).
// Finché c'è, il giocatore vede la schermata di scoperta e deve premere «Continua».
export interface StatoScoperta {
  readonly tipo: TipoScoperta | null;
  readonly zona: string | null;
}

function convalidaStato(dati: unknown): Risultato<StatoScoperta> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const tipo = TIPI.find((t) => t === o["tipo"]) ?? null;
  const zona = typeof o["zona"] === "string" ? o["zona"] : null;
  return chiudi([], tipo === null ? { tipo: null, zona: null } : { tipo, zona });
}

export const statoScoperta = definisciStato<StatoScoperta>(ID_SCOPERTA, 1, () => ({ tipo: null, zona: null }), convalidaStato);

// Chi trova qualcosa (la lapide, il forziere) la segnala qui: il gioco mostra la schermata di scoperta.
export const impostaScoperta = (stato: StatoGioco, tipo: TipoScoperta, zona: string): StatoGioco => statoScoperta.scrivi(stato, { tipo, zona });
