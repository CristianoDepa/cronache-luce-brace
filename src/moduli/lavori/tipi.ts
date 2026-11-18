import type { Id, Risultato, StatoGioco } from "../../core/indice";
import { chiudi, comeOggetto, definisciStato, fallisci, numero, stringa } from "../../core/indice";

export const ID_LAVORI = "lavori";

// Un incarico di consegna o scorta già accettato, in corso verso la destinazione.
export interface Lavoro {
  readonly tipo: "consegna" | "scorta";
  readonly origine: Id;
  readonly destinazione: Id;
  readonly oro: number;
  readonly esperienza: number;
  // Vero mentre si combatte l'imboscata tesa all'arrivo.
  readonly imboscata: boolean;
}

export interface StatoLavori {
  // Il giorno (data dell'ultimo reset) a cui si riferiscono "fatte" e "attivo": un nuovo giorno li azzera.
  readonly giorno: number;
  // I bastioni dove l'incarico di oggi è già stato accettato o svolto.
  readonly fatte: readonly Id[];
  readonly attivo: Lavoro | null;
}

function convalidaLavoro(dati: unknown, errori: string[]): Lavoro | null {
  if (dati === null || dati === undefined) return null;
  const o = comeOggetto(dati);
  if (!o) {
    errori.push('campo "attivo": oggetto atteso');
    return null;
  }
  const tipo = stringa(o, "tipo", errori);
  if (tipo !== "consegna" && tipo !== "scorta") errori.push("lavoro: tipo sconosciuto");
  return {
    tipo: tipo === "scorta" ? "scorta" : "consegna",
    origine: stringa(o, "origine", errori),
    destinazione: stringa(o, "destinazione", errori),
    oro: numero(o, "oro", errori, { min: 0 }),
    esperienza: numero(o, "esperienza", errori, { min: 0 }),
    imboscata: o["imboscata"] === true,
  };
}

function convalidaStato(dati: unknown): Risultato<StatoLavori> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  const fatte = Array.isArray(o["fatte"]) ? o["fatte"].filter((x): x is string => typeof x === "string") : [];
  const giorno = typeof o["giorno"] === "number" ? o["giorno"] : -1;
  return chiudi(errori, { giorno, fatte, attivo: convalidaLavoro(o["attivo"], errori) });
}

export const statoLavori = definisciStato<StatoLavori>(ID_LAVORI, 1, () => ({ giorno: -1, fatte: [], attivo: null }), convalidaStato);

// Lo stato dei lavori di oggi: di un altro giorno non vale più nulla (le offerte cambiano e un incarico non finito scade).
export function lavoriOggi(stato: StatoGioco): StatoLavori {
  const s = statoLavori.leggi(stato);
  return s.giorno === stato.ultimoReset ? s : { giorno: stato.ultimoReset, fatte: [], attivo: null };
}

export function scriviLavori(stato: StatoGioco, nuovo: Omit<StatoLavori, "giorno">): StatoGioco {
  return statoLavori.scrivi(stato, { giorno: stato.ultimoReset, ...nuovo });
}
