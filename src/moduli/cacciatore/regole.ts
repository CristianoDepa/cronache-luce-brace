import type { EventoGioco } from "../../core/indice";
import { leggiContenuto, regola } from "../../core/indice";
import { puntoFineScontro, tipoCreatura } from "../combattimento/indice";
import type { CalcoloIncontro } from "../foresta/indice";
import { puntoIncontro } from "../foresta/indice";
import { probabilitaConFortuna } from "../fortuna/indice";
import { LIVELLI_PREDA, PARAMETRI_CACCIATORE } from "./parametri";
import { missioneAttiva, statoCacciatore } from "./tipi";

// Il progresso delle missioni: ogni vittoria su una creatura del tipo richiesto (senza potenziamento) conta per la battuta; la vittoria sulla
// preda con nome completa la missione di preda. Conta solo quanto accade dopo aver ricevuto la missione.
export const regolaProgressoMissione = regola(puntoFineScontro, 60, (calcolo) => {
  const m = missioneAttiva(calcolo.stato);
  if (calcolo.esito !== "vittoria" || !m || m.completata) return calcolo;
  const giusta = m.tipo === "preda"
    ? calcolo.potenziamento?.soprannomeChiave === `cacciatore.soprannome.${m.soprannome}` && calcolo.creaturaId === m.creaturaId
    : calcolo.potenziamento === undefined && calcolo.creaturaId === m.creaturaId;
  if (!giusta) return calcolo;
  const fatte = m.fatte + 1;
  const completata = fatte >= m.quantita;
  const stato = statoCacciatore.scrivi(calcolo.stato, { ...statoCacciatore.leggi(calcolo.stato), missione: { ...m, fatte, completata } });
  const evento = completata
    ? { chiave: "cacciatore.completata", tono: "positivo" as const, importante: true }
    : { chiave: "cacciatore.progresso", parametri: { fatte, quantita: m.quantita }, tono: "speciale" as const, importante: true };
  return { ...calcolo, stato, eventi: [...calcolo.eventi, evento] };
});

// La preda: nella zona giusta, con una piccola probabilità (che la Fortuna alza), prende il posto di un incontro normale (potenziata, con il suo soprannome);
// in quel caso il combattimento automatico non parte da solo.
export const regolaPreda = regola(puntoIncontro, 60, (calcolo, ctx) => {
  const m = missioneAttiva(calcolo.stato);
  if (!m || m.tipo !== "preda" || m.completata || m.luogoId !== calcolo.luogoId || m.livello === undefined || m.soprannome === undefined) return calcolo;
  if (ctx.rng.prossimo() >= probabilitaConFortuna(calcolo.stato, ctx, PARAMETRI_CACCIATORE.probabilitaIncontro) || leggiContenuto(ctx.registro, tipoCreatura, m.creaturaId) === undefined) return calcolo;
  const l = LIVELLI_PREDA[m.livello];
  const soprannomeChiave = `cacciatore.soprannome.${m.soprannome}`;
  const trovata: EventoGioco = { chiave: "cacciatore.predaTrovata", parametri: { soprannomeChiave }, tono: "avviso", importante: true };
  const incontro: CalcoloIncontro = { ...calcolo, creaturaId: m.creaturaId, potenziamento: { hp: l.hp, forza: l.forza, soprannomeChiave }, automatico: false, eventi: [...calcolo.eventi, trovata] };
  return incontro;
});
