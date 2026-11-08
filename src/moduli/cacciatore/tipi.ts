import type { Id, Risultato, StatoGioco } from "../../core/indice";
import { chiudi, comeOggetto, definisciStato, fallisci, numero, stringa } from "../../core/indice";
import type { LivelloPreda } from "./parametri";
import { LIVELLI_PREDA, NUMERO_SOPRANNOMI } from "./parametri";

export const ID_CACCIATORE = "cacciatore";

// La missione in corso. "battuta": uccidere "quantita" mostri di un tipo; "preda": uccidere una preda con nome (potenziata).
export interface Missione {
  readonly tipo: "battuta" | "preda";
  readonly creaturaId: Id;
  readonly luogoId: Id;
  readonly quantita: number;
  readonly fatte: number;
  readonly completata: boolean;
  readonly oro: number;
  readonly pozioni: number;
  readonly livello?: LivelloPreda;
  readonly soprannome?: number;
}

export interface StatoCacciatore {
  // Il giorno (data dell'ultimo reset) in cui ha proposto l'ultima missione: una sola al giorno; la missione vale solo quel giorno.
  readonly propostaAl: number | null;
  readonly missione: Missione | null;
}

function convalidaMissione(dati: unknown, errori: string[]): Missione | null {
  if (dati === null || dati === undefined) return null;
  const o = comeOggetto(dati);
  if (!o) {
    errori.push('campo "missione": oggetto atteso');
    return null;
  }
  const tipo = stringa(o, "tipo", errori);
  if (tipo !== "battuta" && tipo !== "preda") errori.push("missione: tipo sconosciuto");
  const livello = typeof o["livello"] === "string" && o["livello"] in LIVELLI_PREDA ? (o["livello"] as LivelloPreda) : undefined;
  const soprannome = typeof o["soprannome"] === "number" && o["soprannome"] >= 0 && o["soprannome"] < NUMERO_SOPRANNOMI ? Math.floor(o["soprannome"]) : undefined;
  return {
    tipo: tipo === "preda" ? "preda" : "battuta",
    creaturaId: stringa(o, "creaturaId", errori),
    luogoId: stringa(o, "luogoId", errori),
    quantita: numero(o, "quantita", errori, { min: 1 }),
    fatte: numero(o, "fatte", errori, { min: 0 }),
    completata: o["completata"] === true,
    oro: numero(o, "oro", errori, { min: 0 }),
    pozioni: numero(o, "pozioni", errori, { min: 0 }),
    ...(livello ? { livello } : {}),
    ...(soprannome !== undefined ? { soprannome } : {}),
  };
}

function convalidaStato(dati: unknown): Risultato<StatoCacciatore> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  const propostaAl = typeof o["propostaAl"] === "number" ? o["propostaAl"] : null;
  return chiudi(errori, { propostaAl, missione: convalidaMissione(o["missione"], errori) });
}

export const statoCacciatore = definisciStato<StatoCacciatore>(ID_CACCIATORE, 1, () => ({ propostaAl: null, missione: null }), convalidaStato);

// La missione di oggi (se c'è): una missione di un altro giorno è scaduta.
export function missioneAttiva(stato: StatoGioco): Missione | null {
  const s = statoCacciatore.leggi(stato);
  return s.missione !== null && s.propostaAl === stato.ultimoReset ? s.missione : null;
}
