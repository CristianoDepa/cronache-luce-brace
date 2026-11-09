import type { Risultato } from "../../core/indice";
import { chiudi, comeOggetto, definisciStato, fallisci } from "../../core/indice";
import { PARAMETRI_TORNEO } from "./parametri";

export const ID_TORNEO = "torneo";

export interface VoceAlbo {
  readonly vittorie: number;
  readonly finali: number;
  readonly iscrizioni: number;
}

export interface StatoTorneo {
  // La settimana a cui si riferisce l'iscrizione: se è passata una settimana si riparte (il torneo è un altro).
  readonly settimana: number;
  readonly iscritto: boolean;
  // Turni vinti nel torneo di questa settimana (0-3) e se si è stati eliminati.
  readonly turni: number;
  readonly eliminato: boolean;
  // Ritirato: ha lasciato il torneo di sua volontà o passando il giorno mentre era in gara (come aver abbandonato l'anfiteatro).
  readonly ritirato: boolean;
  // L'aspetto (indice del tipo di gladiatore) dell'ultimo avversario, per non ripetere lo stesso al turno dopo; -1 se non c'è.
  readonly aspetto: number;
  // L'albo: per ognuno dei quattro tornei vittorie, finali raggiunte e iscrizioni.
  readonly albo: Readonly<Record<string, VoceAlbo>>;
}

const n = (v: unknown): number => (typeof v === "number" && v >= 0 ? Math.floor(v) : 0);

// L'ultimo aspetto è valido se è l'indice di uno dei tipi di gladiatore; altrimenti -1 (nessuno).
const aspettoValido = (v: unknown): number => (typeof v === "number" && Number.isInteger(v) && v >= 0 && v < PARAMETRI_TORNEO.gladiatori.length ? v : -1);

function convalidaStato(dati: unknown): Risultato<StatoTorneo> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const grezzo = comeOggetto(o["albo"]) ?? {};
  const albo: Record<string, VoceAlbo> = {};
  for (let i = 0; i < PARAMETRI_TORNEO.numeroTornei; i++) {
    const v = comeOggetto(grezzo[String(i)]);
    if (v) albo[String(i)] = { vittorie: n(v["vittorie"]), finali: n(v["finali"]), iscrizioni: n(v["iscrizioni"]) };
  }
  return chiudi([], { settimana: n(o["settimana"]), iscritto: o["iscritto"] === true, turni: Math.min(n(o["turni"]), PARAMETRI_TORNEO.turni), eliminato: o["eliminato"] === true, ritirato: o["ritirato"] === true, aspetto: aspettoValido(o["aspetto"]), albo });
}

export const statoTorneo = definisciStato<StatoTorneo>(ID_TORNEO, 1, () => ({ settimana: 0, iscritto: false, turni: 0, eliminato: false, ritirato: false, aspetto: -1, albo: {} }), convalidaStato);
