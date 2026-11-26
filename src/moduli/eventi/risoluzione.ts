import type { Contesto, Esito, EventoGioco, StatoGioco } from "../../core/indice";
import { esitoErrore, esitoOk } from "../../core/indice";
import { iniziaScontro } from "../combattimento/indice";
import type { Potenziamento } from "../combattimento/indice";
import { probabilitaConFortuna } from "../fortuna/indice";
import { aggiungiOggetto } from "../inventario/indice";
import { POZIONI, consegnaPozioni, idPozione, prezzoPozione } from "../pozioni/indice";
import type { TipoPozione } from "../pozioni/dati";
import { manaMassimo } from "../mana/indice";
import { PARAMETRI_STATI, infliggiStato, pattoPerId, pattoStretto, stringiPatto } from "../stati/indice";
import { conAzioni, conEsperienza, conOro, cura, curaMana, danno, evento, livelloDi, traMinEMax } from "./effetti";
import { SCENA_DELL_EVENTO } from "./dati";
import { CREATURA_DELL_EVENTO, PARAMETRI_EVENTI as P } from "./parametri";

// Un evento ha due momenti: «avvia» (gli effetti che scattano subito, quando compare) e «risolvi» (l'effetto della scelta fatta).
export interface Argomenti {
  readonly stato: StatoGioco;
  readonly ctx: Contesto;
  readonly zona: string;
  readonly fase: number;
  readonly valore: number;
  readonly scelta: string;
}
// prosegue: l'evento ha un altro passo (fase e valore); assente = l'evento è finito.
export interface Risoluzione {
  readonly esito: Esito;
  readonly prosegue?: { readonly fase: number; readonly valore: number };
}
export interface Avvio {
  readonly stato: StatoGioco;
  readonly eventi: readonly EventoGioco[];
  // Il valore che l'evento si porta dietro dall'inizio (il mercante: quale pozione offre).
  readonly valore?: number;
}

const fine = (stato: StatoGioco, eventi: readonly EventoGioco[] = []): Risoluzione => ({ esito: esitoOk(stato, eventi) });
// Un testo con «{hp} HP» non si scrive quando il valore reale è 0 (HP già al massimo o al minimo): si usa la variante «Nulla» senza numero.
const conHp = (chiave: string, hp: number, tono: "positivo" | "negativo"): EventoGioco => (hp > 0 ? evento(chiave, { hp }, tono) : evento(`${chiave}Nulla`, undefined, tono));
const errore = (chiave: string): Risoluzione => ({ esito: esitoErrore(chiave) });
const oro = (stato: StatoGioco): number => stato.personaggio.oro;
const tesoroBase = (stato: StatoGioco, ctx: Contesto): number => livelloDi(stato) * traMinEMax(ctx, P.tesoro.min, P.tesoro.max);

// --- Effetti che scattano quando l'evento compare (gli eventi di sola lettura: si legge e si preme «Continua») ---
const AVVIO: Readonly<Record<string, (stato: StatoGioco, ctx: Contesto) => Avvio>> = {
  tesoro: (stato, ctx) => {
    const quanto = tesoroBase(stato, ctx);
    return { stato: conOro(stato, quanto), eventi: [evento("eventi.log.tesoro", { oro: quanto }, "positivo")] };
  },
  trappola: (stato, ctx) => {
    const r = danno(stato, ctx, P.trappola.quotaMin + ctx.rng.prossimo() * (P.trappola.quotaMax - P.trappola.quotaMin));
    const avvelenata = ctx.rng.prossimo() < P.trappola.probabilitaVeleno; // le punte possono essere avvelenate
    const eventi = [conHp("eventi.log.trappola", r.persi, "negativo"), ...(avvelenata ? [evento("stati.log.avvelenato", { azioni: PARAMETRI_STATI.veleno.azioni }, "negativo")] : [])];
    return { stato: avvelenata ? infliggiStato(r.stato, "veleno") : r.stato, eventi };
  },
  // Il mercante offre una pozione a caso (la pozione di mana solo a chi ha mana); il valore dell'evento è la sua posizione nell'elenco, da 1.
  mercante: (stato, ctx) => {
    const offerte = POZIONI.filter((p) => p.effetto.genere !== "mana" || manaMassimo(stato, ctx) > 0);
    const scelta = offerte[ctx.rng.intero(0, offerte.length - 1)]!;
    return { stato, eventi: [], valore: POZIONI.indexOf(scelta) + 1 };
  },
  cantastorie: (stato) => {
    const xp = livelloDi(stato) * P.cantastorie.esperienzaPerLivello;
    return { stato: conEsperienza(conAzioni(stato, P.cantastorie.azioni), xp), eventi: [evento("eventi.log.cantastorie", { esperienza: xp }, "positivo")] };
  },
  scippo: (stato, ctx) => {
    const rubato = Math.floor(oro(stato) * (P.scippo.quotaMin + ctx.rng.prossimo() * (P.scippo.quotaMax - P.scippo.quotaMin)));
    return { stato: conOro(stato, -rubato), eventi: [evento("eventi.log.scippo", { oro: rubato }, "negativo")] };
  },
};

export function avvia(id: string, stato: StatoGioco, ctx: Contesto): Avvio {
  return AVVIO[id]?.(stato, ctx) ?? { stato, eventi: [] };
}

// --- Scontri nati da un evento: la creatura della zona, e la scena di quella zona ---
function scontro(a: Argomenti, potenziamento?: Potenziamento, creaturaFissa?: string, scena?: string): Risoluzione {
  const creatura = creaturaFissa ?? CREATURA_DELL_EVENTO[a.zona];
  if (creatura === undefined) return errore("eventi.errore.nessuna_creatura");
  return { esito: iniziaScontro(a.stato, creatura, a.ctx, scena ?? SCENA_DELL_EVENTO[a.zona], 1, potenziamento) };
}

// --- Le scelte, evento per evento ---
const viandante = (a: Argomenti): Risoluzione => {
  if (a.scelta !== "aiuta") return fine(a.stato, [evento("eventi.log.prosegui")]);
  const quanto = livelloDi(a.stato) * P.viandante.oroPerLivello;
  return fine(conOro(conAzioni(a.stato, P.viandante.azioni), quanto), [evento("eventi.log.viandante", { oro: quanto }, "positivo")]);
};

const pellegrino = (a: Argomenti): Risoluzione => {
  if (a.scelta !== "offri") return fine(a.stato, [evento("eventi.log.rifiuta")]);
  if (oro(a.stato) < P.pellegrino.offerta) return errore("eventi.errore.poco_oro");
  const r = cura(conOro(a.stato, -P.pellegrino.offerta), a.ctx, P.pellegrino.cura);
  return fine(curaMana(r.stato, a.ctx, P.pellegrino.cura), [conHp("eventi.log.pellegrino", r.curati, "positivo")]);
};

// La pozione del mercante (dal valore dell'evento) e il suo prezzo scontato.
export const pozioneDelMercante = (valore: number): TipoPozione => (POZIONI[valore - 1] ?? POZIONI[0]!).tipo;
export const prezzoDelMercante = (stato: StatoGioco, valore: number): number => Math.max(1, Math.round(prezzoPozione(pozioneDelMercante(valore), livelloDi(stato)) * (1 - P.mercante.sconto)));

const mercante = (a: Argomenti): Risoluzione => {
  if (a.scelta !== "compra") return fine(a.stato, [evento("eventi.log.prosegui")]);
  const prezzo = prezzoDelMercante(a.stato, a.valore);
  if (oro(a.stato) < prezzo) return errore("eventi.errore.poco_oro");
  const tipo = pozioneDelMercante(a.valore);
  const con = aggiungiOggetto(conOro(a.stato, -prezzo), idPozione(tipo));
  return con ? fine(con, [evento("eventi.log.mercante", { prezzo, pozioneChiave: `pozioni.nome.${tipo}` }, "positivo")]) : errore("eventi.errore.zaino_pieno");
};

// Le erbe medicinali: o un antidoto per lo zaino, o le erbe pungono e ti avvelenano.
const erbe = (a: Argomenti): Risoluzione => {
  if (a.scelta !== "raccogli") return fine(a.stato, [evento("eventi.log.prosegui")]);
  if (a.ctx.rng.prossimo() >= P.erbe.probabilitaAntidoto) {
    return fine(infliggiStato(a.stato, "veleno"), [evento("eventi.log.erbeVeleno", undefined, "negativo"), evento("stati.log.avvelenato", { azioni: PARAMETRI_STATI.veleno.azioni }, "negativo")]);
  }
  const con = aggiungiOggetto(a.stato, idPozione("antidoto"));
  return con ? fine(con, [evento("eventi.log.erbeAntidoto", undefined, "positivo")]) : errore("eventi.errore.zaino_pieno");
};

const postoDiBlocco = (a: Argomenti): Risoluzione => {
  if (a.scelta === "combatti") return scontro(a, undefined, "guardia"); // la guardia, non la creatura della zona
  const pedaggio = Math.ceil(oro(a.stato) * P.postoDiBlocco.quotaPedaggio);
  return fine(conOro(a.stato, -pedaggio), [evento("eventi.log.pedaggio", { oro: pedaggio }, "negativo")]);
};

const fonte = (a: Argomenti): Risoluzione => {
  if (a.scelta !== "bevi") return fine(a.stato, [evento("eventi.log.prosegui")]);
  if (a.ctx.rng.prossimo() < P.fonte.probabilitaBuona) {
    const r = cura(a.stato, a.ctx, P.fonte.cura);
    return fine(r.stato, [conHp("eventi.log.fonteBuona", r.curati, "positivo")]);
  }
  const r = danno(a.stato, a.ctx, P.fonte.danno);
  return fine(r.stato, [conHp("eventi.log.fonteCattiva", r.persi, "negativo")]);
};

const cacciatore = (a: Argomenti): Risoluzione => {
  if (a.scelta !== "aiuta") return fine(a.stato, [evento("eventi.log.prosegui")]);
  const costata = conAzioni(a.stato, P.cacciatore.azioni);
  if (a.ctx.rng.prossimo() < P.cacciatore.probabilitaPozione) {
    const p = consegnaPozioni(costata, a.ctx, 1);
    return fine(p.stato, [evento("eventi.log.cacciatorePozione", undefined, "positivo"), ...p.eventi]);
  }
  const quanto = livelloDi(a.stato) * P.cacciatore.oroPerLivello;
  return fine(conOro(costata, quanto), [evento("eventi.log.cacciatoreOro", { oro: quanto }, "positivo")]);
};

const lucidaMansi = (a: Argomenti): Risoluzione => {
  if (a.scelta !== "specchio") return fine(a.stato, [evento("eventi.log.rifiuta")]);
  const r = danno(a.stato, a.ctx, P.lucidaMansi.quotaHp);
  const quanto = r.persi * P.lucidaMansi.oroPerHp;
  return fine(conOro(r.stato, quanto), [r.persi > 0 ? evento("eventi.log.lucidaMansi", { hp: r.persi, oro: quanto }, "speciale") : evento("eventi.log.lucidaMansiNulla", { oro: quanto }, "speciale")]);
};

const pozzo = (a: Argomenti): Risoluzione => {
  const i = ["g10", "g25", "g50"].indexOf(a.scelta);
  if (i < 0) return fine(a.stato, [evento("eventi.log.prosegui")]);
  const somma = P.pozzo.tagli[i]!;
  if (oro(a.stato) < somma) return errore("eventi.errore.poco_oro");
  const pagato = conOro(a.stato, -somma);
  if (a.ctx.rng.prossimo() >= probabilitaConFortuna(pagato, a.ctx, P.pozzo.probabilita[i]!)) return fine(pagato, [evento("eventi.log.pozzoNulla", { oro: somma })]);
  const premio = Math.round(somma * (1 + a.ctx.rng.prossimo()));
  return fine(conOro(pagato, premio), [evento("eventi.log.pozzoPremio", { oro: premio }, "positivo")]);
};

const bivioSentiero = (a: Argomenti): Risoluzione => {
  if (a.scelta === "lunga") {
    const quanto = livelloDi(a.stato) * P.bivio.oroStradaLunga;
    return fine(conOro(conAzioni(a.stato, P.bivio.azioniStradaLunga), quanto), [evento("eventi.log.stradaLunga", { oro: quanto }, "positivo")]);
  }
  if (a.ctx.rng.prossimo() < P.bivio.probabilitaSentiero) {
    const quanto = tesoroBase(a.stato, a.ctx) * P.bivio.moltiplicatoreSentiero;
    return fine(conOro(a.stato, quanto), [evento("eventi.log.sentieroTesoro", { oro: quanto }, "positivo")]);
  }
  return scontro(a, { hp: P.bivio.potenziamento, forza: P.bivio.potenziamento });
};

const bivioGrotta = (a: Argomenti): Risoluzione => {
  if (a.scelta !== "entra") return fine(a.stato, [evento("eventi.log.prosegui")]);
  if (a.ctx.rng.prossimo() >= P.grotta.probabilitaTesoro) return scontro(a, undefined, undefined, "scena.grotta"); // lo scontro avviene nella grotta
  const quanto = tesoroBase(a.stato, a.ctx) * P.grotta.moltiplicatore;
  return fine(conOro(a.stato, quanto), [evento("eventi.log.grottaTesoro", { oro: quanto }, "positivo")]);
};

const bivioGuado = (a: Argomenti): Risoluzione => {
  if (a.scelta === "giro") return fine(conAzioni(a.stato, P.guado.azioniGiro), [evento("eventi.log.giro")]);
  if (a.ctx.rng.prossimo() >= P.guado.probabilitaScivolata) return fine(a.stato, [evento("eventi.log.guadoOk")]);
  const r = danno(a.stato, a.ctx, P.guado.dannoHp);
  return fine(r.stato, [conHp("eventi.log.guado", r.persi, "negativo")]);
};

// Il patto (una volta per partita): si sceglie uno dei tre doni e se ne paga il prezzo per sempre.
function pattoDelDiavolo(a: Argomenti): Risoluzione {
  const id = a.scelta.replace("patto", "").toLowerCase();
  if (pattoPerId(id) === undefined || pattoStretto(a.stato) !== null) return errore("eventi.errore.scelta");
  return fine(stringiPatto(a.stato, id), [evento(`eventi.log.patto.${id}`, undefined, "speciale")]);
}

// Il diavolo del Ponte: 0) giochi, stringi un patto o rifiuti; 1) 2) scegli la puntata; 3) scegli la cesta (una su tre ha il maiale).
function diavolo(a: Argomenti): Risoluzione {
  if (a.scelta === "rifiuta") return fine(a.stato, [evento("eventi.log.rifiuta")]);
  if (a.fase === 5) return pattoDelDiavolo(a);
  if (a.fase >= 3) return fine(a.stato); // «Continua» dopo il risultato
  if (a.fase === 0 && a.scelta === "patto") return { esito: esitoOk(a.stato), prosegue: { fase: 5, valore: 0 } };
  if (a.fase === 0) return { esito: esitoOk(a.stato), prosegue: { fase: 1, valore: 0 } };
  if (a.fase === 1) {
    const puntata = P.diavolo.tagli[["p10", "p25", "p50", "p100", "p200"].indexOf(a.scelta)];
    if (puntata === undefined) return errore("eventi.errore.scelta");
    return oro(a.stato) < puntata ? errore("eventi.errore.poco_oro") : { esito: esitoOk(a.stato), prosegue: { fase: 2, valore: puntata } };
  }
  const scelta = Number(a.scelta.replace("cesta", ""));
  const col = a.ctx.rng.intero(1, P.diavolo.ceste);
  if (oro(a.stato) < a.valore) return errore("eventi.errore.poco_oro");
  // Il risultato si mostra in una schermata a parte (fase 3 vinto, 4 perso) con il Diavolo e il maiale; poi «Continua».
  if (scelta !== col) return { esito: esitoOk(conOro(a.stato, -a.valore)), prosegue: { fase: 4, valore: a.valore * 10 + col } };
  const vinto = a.valore * (P.diavolo.moltiplicatore - 1);
  return { esito: esitoOk(conOro(a.stato, vinto)), prosegue: { fase: 3, valore: vinto * 10 + col } };
}

const RISOLUZIONE: Readonly<Record<string, (a: Argomenti) => Risoluzione>> = {
  viandante, pellegrino, mercante, erbe, postoDiBlocco, fonte, cacciatore, lucidaMansi, pozzo, bivioSentiero, bivioGrotta, bivioGuado, diavolo,
};

// Le scelte di sola lettura («Continua») non hanno altro effetto.
export function risolvi(id: string, a: Argomenti): Risoluzione {
  const r = RISOLUZIONE[id];
  return r === undefined ? fine(a.stato) : r(a);
}
