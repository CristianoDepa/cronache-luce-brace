import type { Contesto, Id, StatoGioco } from "../../core/indice";
import { elencaContenuti, leggiContenuto } from "../../core/indice";
import { mostriUccisi, tipoCreatura } from "../combattimento/indice";
import { statoCitta } from "../citta/indice";
import { creatureIncontrabili } from "../foresta/indice";
import { tipoLuogo } from "../luoghi/indice";
import type { LivelloPreda } from "./parametri";
import { LIVELLI_PREDA, NUMERO_SOPRANNOMI, PARAMETRI_CACCIATORE, SITO_DELLA_ZONA } from "./parametri";
import type { Missione } from "./tipi";

interface Possibilita {
  readonly luogoId: Id;
  readonly creaturaId: Id;
}

// Le creature che adesso possono comparire nelle zone che il giocatore conosce (ha visitato il luogo che le ospita).
export function creaturePossibili(stato: StatoGioco, ctx: Contesto): readonly Possibilita[] {
  const visitati = statoCitta.leggi(stato).visitati;
  return elencaContenuti(ctx.registro, tipoLuogo).flatMap(({ id, dati }) => {
    const sito = SITO_DELLA_ZONA[id];
    if (!sito || !visitati.includes(sito)) return [];
    return creatureIncontrabili(dati, stato, ctx).map((creaturaId) => ({ luogoId: id, creaturaId }));
  });
}

export function puoOffrire(stato: StatoGioco, ctx: Contesto): boolean {
  return mostriUccisi(stato, ctx).length >= PARAMETRI_CACCIATORE.mostriUccisiMin;
}

function scegli<T>(elenco: readonly T[], ctx: Contesto): T {
  return elenco[Math.min(elenco.length - 1, Math.floor(ctx.rng.prossimo() * elenco.length))]!;
}

function scegliLivello(ctx: Contesto): LivelloPreda {
  const livelli = Object.keys(LIVELLI_PREDA) as LivelloPreda[];
  let tiro = ctx.rng.prossimo() * livelli.reduce((s, l) => s + LIVELLI_PREDA[l].peso, 0);
  return livelli.find((l) => (tiro -= LIVELLI_PREDA[l].peso) < 0) ?? "pari";
}

// Genera la missione di oggi, o undefined se non c'è nulla da offrire. Battuta: un mostro già ucciso, raggiungibile adesso; preda: un
// mostro raggiungibile adesso (anche mai incontrato), con un soprannome e un livello.
export function generaMissione(stato: StatoGioco, ctx: Contesto): Missione | undefined {
  if (!puoOffrire(stato, ctx)) return undefined;
  const possibili = creaturePossibili(stato, ctx);
  if (possibili.length === 0) return undefined;
  const uccisi = new Set(mostriUccisi(stato, ctx));
  const dellUcciso = possibili.filter((p) => uccisi.has(p.creaturaId));
  const preda = ctx.rng.prossimo() < PARAMETRI_CACCIATORE.probabilitaPreda || dellUcciso.length === 0;
  const scelta = scegli(preda ? possibili : dellUcciso, ctx);
  const creatura = leggiContenuto(ctx.registro, tipoCreatura, scelta.creaturaId);
  if (!creatura) return undefined;
  if (preda) {
    const livello = scegliLivello(ctx);
    const l = LIVELLI_PREDA[livello];
    return {
      tipo: "preda", creaturaId: scelta.creaturaId, luogoId: scelta.luogoId, quantita: 1, fatte: 0, completata: false, livello,
      soprannome: Math.min(NUMERO_SOPRANNOMI - 1, Math.floor(ctx.rng.prossimo() * NUMERO_SOPRANNOMI)),
      oro: Math.round(creatura.oro * PARAMETRI_CACCIATORE.moltiplicatoreOroPreda * l.premio), pozioni: l.pozioni,
    };
  }
  const quantita = 1 + Math.min(PARAMETRI_CACCIATORE.quantitaMax - 1, Math.floor(ctx.rng.prossimo() * PARAMETRI_CACCIATORE.quantitaMax));
  return {
    tipo: "battuta", creaturaId: scelta.creaturaId, luogoId: scelta.luogoId, quantita, fatte: 0, completata: false,
    oro: creatura.oro * quantita * PARAMETRI_CACCIATORE.moltiplicatoreBattuta, pozioni: quantita === PARAMETRI_CACCIATORE.quantitaMax ? PARAMETRI_CACCIATORE.pozioniBattutaTre : 0,
  };
}
