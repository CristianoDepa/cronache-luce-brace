import type { StatoGioco } from "../../core/indice";
import { statoCronache } from "../cronache/indice";
import { PARAMETRI_TORNEO } from "./parametri";
import type { StatoTorneo, VoceAlbo } from "./tipi";
import { statoTorneo } from "./tipi";

const VUOTA: VoceAlbo = { vittorie: 0, finali: 0, iscrizioni: 0 };

// La settimana di gioco in corso (dal contatore dei giorni delle Cronache) e quale dei quattro tornei è (a rotazione).
export function settimanaCorrente(stato: StatoGioco): number {
  return Math.floor(statoCronache.leggi(stato).giorni / PARAMETRI_TORNEO.giorniPerSettimana);
}

export const torneoDellaSettimana = (stato: StatoGioco): number => settimanaCorrente(stato) % PARAMETRI_TORNEO.numeroTornei;

export function giorniAllaFine(stato: StatoGioco): number {
  return PARAMETRI_TORNEO.giorniPerSettimana - (statoCronache.leggi(stato).giorni % PARAMETRI_TORNEO.giorniPerSettimana);
}

// Lo stato del torneo di QUESTA settimana: se l'iscrizione è di una settimana passata si riparte da zero (l'albo resta).
export function statoDiQuestaSettimana(stato: StatoGioco): StatoTorneo {
  const s = statoTorneo.leggi(stato);
  return s.settimana === settimanaCorrente(stato) ? s : { ...s, settimana: settimanaCorrente(stato), iscritto: false, turni: 0, eliminato: false };
}

export const quotaDiIscrizione = (livello: number): number => PARAMETRI_TORNEO.quotaIscrizione * livello;

export const voceAlbo = (s: StatoTorneo, torneo: number): VoceAlbo => s.albo[String(torneo)] ?? VUOTA;

export function conVoceAlbo(s: StatoTorneo, torneo: number, cambia: (v: VoceAlbo) => VoceAlbo): StatoTorneo {
  return { ...s, albo: { ...s.albo, [String(torneo)]: cambia(voceAlbo(s, torneo)) } };
}

// HP e forza dell'avversario di un turno (0 = quarti, 1 = semifinale, 2 = finale): scalano sul livello, con una variazione a caso (u1, u2 in 0-1).
export function statisticheAvversario(livello: number, turno: number, u1: number, u2: number): { readonly hp: number; readonly forza: number } {
  const a = PARAMETRI_TORNEO.avversario;
  const f = PARAMETRI_TORNEO.fattoriTurno[turno] ?? 1;
  const v = PARAMETRI_TORNEO.variazione;
  return { hp: (a.hpBase + a.hpPerLivello * livello) * f * (1 + v * (2 * u1 - 1)), forza: (a.forzaBase + a.forzaPerLivello * livello) * f * (1 + v * (2 * u2 - 1)) };
}
