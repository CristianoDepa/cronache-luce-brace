import type { Esito, EventoGioco, StatoGioco } from "./tipi";

export function esitoOk(stato: StatoGioco, eventi: readonly EventoGioco[] = []): Esito {
  return { ok: true, stato, eventi };
}

export function esitoErrore(chiave: string, dettaglio?: string): Esito {
  return dettaglio === undefined
    ? { ok: false, errore: { chiave } }
    : { ok: false, errore: { chiave, dettaglio } };
}
