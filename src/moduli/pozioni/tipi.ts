import type { Risultato } from "../../core/indice";
import { chiudi, comeOggetto, definisciStato, fallisci, numero, stringa } from "../../core/indice";
import type { TipoPozione } from "./dati";
import { POZIONI } from "./dati";

export const ID_POZIONI = "pozioni";

// L'effetto in corso di una pozione di forza, destrezza o corazza. "restanti" sono i turni di combattimento che mancano ALL'INIZIO
// dello scontro in corso (o adesso, fuori dal combattimento): durante uno scontro quelli già giocati si sottraggono (vedi effetto.ts).
export interface EffettoPozione {
  readonly tipo: TipoPozione;
  readonly restanti: number;
}

export interface StatoPozioni {
  readonly effetto: EffettoPozione | null;
  // Pezzi venduti oggi dallo Speziale per tipo (la scorta del giorno si ricava dalla data dell'ultimo reset, vedi scorta.ts).
  readonly venduti: Readonly<Record<string, number>>;
  // Il balsamo di un boss trovato con lo zaino pieno: finché non si sceglie cosa lasciare (o si scarta) la schermata di scelta resta aperta.
  readonly sospeso: TipoPozione | null;
}

function convalidaStato(dati: unknown): Risultato<StatoPozioni> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  let effetto: EffettoPozione | null = null;
  if (o["effetto"] !== null && o["effetto"] !== undefined) {
    const e = comeOggetto(o["effetto"]);
    const tipo = e ? stringa(e, "tipo", errori) : "";
    if (!e || !POZIONI.some((p) => p.tipo === tipo)) errori.push("effetto non valido");
    else effetto = { tipo: tipo as TipoPozione, restanti: numero(e, "restanti", errori, { min: 0 }) };
  }
  const grezzo = comeOggetto(o["venduti"]) ?? {};
  const venduti = Object.fromEntries(Object.keys(grezzo).map((k) => [k, numero(grezzo, k, errori, { min: 0 })]));
  const grezzoSospeso = o["sospeso"];
  const sospeso = typeof grezzoSospeso === "string" && POZIONI.some((p) => p.tipo === grezzoSospeso) ? (grezzoSospeso as TipoPozione) : null;
  return chiudi(errori, { effetto, venduti, sospeso });
}

export const statoPozioni = definisciStato<StatoPozioni>(ID_POZIONI, 1, () => ({ effetto: null, venduti: {}, sospeso: null }), convalidaStato);
