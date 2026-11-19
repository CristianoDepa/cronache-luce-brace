import type { EventoGioco } from "../../core/indice";
import { puntoDopoAzione, puntoInizioGiorno, puntoStatistiche, regola } from "../../core/indice";
import { puntoColpoSubito, puntoOro } from "../combattimento/indice";
import { puntoFortunaBonus } from "../fortuna/indice";
import { leggiAzioniResidue } from "../azioni/indice";
import { CREATURE_CHE_INFLIGGONO, pattoPerId } from "./dati";
import { PARAMETRI_STATI as P } from "./parametri";
import { curaStati, infliggiStato, statoStati } from "./tipi";

// Paura e patto cambiano le statistiche per tutto il tempo in cui valgono.
export const regolaStatisticheStati = regola(puntoStatistiche, 65, (calcolo) => {
  const s = statoStati.leggi(calcolo.stato);
  const patto = pattoPerId(s.patto);
  const paura = s.paura > 0 ? { forza: P.paura.forza, difesa: P.paura.difesa } : { forza: 0, difesa: 0 };
  const { statistiche: st } = calcolo;
  return {
    ...calcolo,
    statistiche: {
      hpMax: Math.max(1, st.hpMax + (patto?.hpMax ?? 0)),
      forza: Math.max(0, st.forza + (patto?.forza ?? 0) - paura.forza),
      difesa: Math.max(0, st.difesa + (patto?.difesa ?? 0) - paura.difesa),
    },
  };
});

export const regolaFortunaPatto = regola(puntoFortunaBonus, 60, (c) => ({ ...c, fortuna: c.fortuna + (pattoPerId(statoStati.leggi(c.stato).patto)?.fortuna ?? 0) }));
export const regolaOroPatto = regola(puntoOro, 60, (c) => ({ ...c, oro: Math.round(c.oro * (pattoPerId(statoStati.leggi(c.stato).patto)?.oroMostri ?? 1)) }));

// Un nuovo giorno (il riposo) guarisce da veleno e paura.
export const regolaGiornoStati = regola(puntoInizioGiorno, 90, (stato) => curaStati(stato));

// Il tempo passa a ogni azione spesa: il veleno toglie HP (mai oltre 1 HP) e le durate scendono. Le azioni spese sono quelle che mancano rispetto a prima.
export const regolaTempoStati = regola(puntoDopoAzione, 50, (c) => {
  const spese = leggiAzioniResidue(c.prima) - leggiAzioniResidue(c.stato);
  const s = statoStati.leggi(c.stato);
  if (spese <= 0 || c.stato.personaggio.morto || (s.veleno === 0 && s.paura === 0)) return c;
  const eventi: EventoGioco[] = [];
  const colpi = Math.min(spese, s.veleno);
  const hp = c.stato.personaggio.hp;
  const nuovoHp = hp <= 1 ? hp : Math.max(1, hp - colpi * P.veleno.hpPerAzione);
  if (nuovoHp < hp) eventi.push({ chiave: "stati.log.velenoDanno", parametri: { hp: hp - nuovoHp }, tono: "negativo" });
  const veleno = Math.max(0, s.veleno - spese);
  const paura = Math.max(0, s.paura - spese);
  if (s.veleno > 0 && veleno === 0) eventi.push({ chiave: "stati.log.velenoFinito", tono: "positivo" });
  if (s.paura > 0 && paura === 0) eventi.push({ chiave: "stati.log.pauraFinita", tono: "positivo" });
  const scritto = statoStati.scrivi({ ...c.stato, personaggio: { ...c.stato.personaggio, hp: nuovoHp } }, { ...s, veleno, paura });
  return { ...c, stato: scritto, eventi: [...c.eventi, ...eventi] };
});

// Una creatura che infligge uno stato lo fa con una certa probabilità a ogni colpo a segno.
export const regolaColpoStati = regola(puntoColpoSubito, 50, (c, ctx) => {
  const tipo = CREATURE_CHE_INFLIGGONO[c.creaturaId];
  if (tipo === undefined || ctx.rng.prossimo() >= P.probabilitaColpo) return c;
  const evento: EventoGioco = { chiave: `stati.log.${tipo === "veleno" ? "avvelenato" : "spaventato"}`, parametri: { azioni: P[tipo].azioni }, tono: "negativo" };
  return { ...c, stato: infliggiStato(c.stato, tipo), eventi: [...c.eventi, evento] };
});
