import type { Contesto, StatoGioco } from "../../src/core/indice";
import { applicaGiorno, calcolaStatistiche, creaStatoIniziale, eseguiAzione, DURATA_CICLO_MS } from "../../src/core/indice";
import { abilitaDellaClasse } from "../../src/moduli/abilita/indice";
import { leggiAzioniResidue } from "../../src/moduli/azioni/indice";
import { statoCitta } from "../../src/moduli/citta/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { statoCombattimento } from "../../src/moduli/combattimento/indice";
import { manaAttuale } from "../../src/moduli/mana/indice";
import { LINEE, calcolaOfferta, calcolaPunti, statoEquipaggiamento } from "../../src/moduli/equipaggiamento/indice";
import { LINEA_FUCINA_ARMA, LINEA_FUCINA_ARMATURA } from "../../src/moduli/equipaggiamento/acquisto";
import { PARAMETRI_LIVELLI, eLivelloChiave, esperienzaPerSalire, rettaAttuale } from "../../src/moduli/livelli/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { creaContestoDiProva, registroDa } from "../../tests/aiuti";

// Simulatore di bilanciamento (0.26.1, esteso al livello 16 nella 0.27.0). NON fa parte del gioco: guida il motore reale con un giocatore automatico e misura i giorni.
// Giocatore simulato ("regolare"): ogni giorno (1) sale di livello se può (con il duello ai livelli chiave), (2) compra l'equipaggiamento
// naturale della classe mantenendo da parte la retta, (3) esplora la foresta (dal livello 12, con l'acciaio di brace completo, la piana di Capannori) con il combattimento automatico finché ha azioni, (4) si
// cura dal guaritore se sotto il 50% degli HP (altrimenti smette per oggi). NON usa abilità, pozioni, forzieri, lavori, torneo, cripta, palude, valle né la Quercia delle streghe.
// Quindi è una stima PRUDENTE (un giocatore reale, con più fonti di reddito, procede più in fretta).
const registro = registroDa(MODULI_ATTIVI);
const GILDA: Record<string, string> = { cavaliere: "gilda-cavaliere", mistico: "gilda-mistico", ladro: "gilda-ladro" };
const LINEE_CLASSE: Record<string, readonly string[]> = { cavaliere: ["spadone", "piastre"], mistico: ["bastone", "veste"], ladro: ["pugnale", "cuoio"] };
// Punti per pezzo (arma e armatura) che il giocatore simulato vuole avere prima di sfidare il capogilda di quel livello (i capigilda sono tarati su 16-20; quello del 16 sull'acciaio di brace, 26).
const PUNTI_PER_DUELLO: Record<number, number> = { 4: 16, 8: 20, 12: 20, 16: 26, 20: 26 };
// Con CLB_CURA=1 il giocatore si cura a pagamento dal guaritore; di default riposa (la cura costa livello × HP mancanti: a livello alto mangia tutto il guadagno).
const CURA_A_PAGAMENTO = process.env.CLB_CURA === "1";
const SOGLIA_FRENO = 0.35;
// Sotto questa quota di HP il giocatore smette di esplorare per oggi: nella piana è più prudente (le creature colpiscono più forte e perdere costa un quarto dell'oro).
const RIPOSO = { foresta: 0.5, piana: Number(process.env.CLB_RIPOSO_PIANA ?? 0.75), colline: Number(process.env.CLB_RIPOSO_COLLINE ?? 0.75) };
const INIZIO = Date.UTC(2026, 6, 1, 12);
// Mana che il Mistico simulato tiene da parte (non lo spende sotto questa soglia); di default spende tutto.
const RISERVA_MANA = Number(process.env.CLB_RISERVA_MANA ?? 0);

// Modi di giocare del giocatore simulato (0.34.0). `abilita`: usa le abilità con la regola semplice (vedi usaAbilitaDiScontro);
// `guai`: dal livello 2 nella foresta alterna l'esplorazione normale e «Cerca guai».
export interface OpzioniSimulatore {
  readonly abilita?: boolean;
  readonly guai?: boolean;
}

export interface RisultatoRun {
  readonly giornoLivello: Readonly<Record<number, number>>; // livello -> giorno in cui lo si raggiunge
  readonly giornoPrimoPezzoBrace: number | null;
  readonly giornoDuePezziBrace: number | null;
  readonly morti: number;
  readonly orodelGiorno: Readonly<Record<number, number>>; // livello -> oro medio guadagnato al giorno (esplorazione, prima delle spese)
  readonly espDelGiorno: Readonly<Record<number, number>>;
  readonly stato: StatoGioco; // lo stato a fine partita (per continuare a San Donato)
  readonly giorni: number; // i giorni giocati
}

const conSito = (s: StatoGioco, sito: string): StatoGioco => statoCitta.scrivi(s, { ...statoCitta.leggi(s), sito, movimenti: 0 });
const esegui = (s: StatoGioco, tipo: string, dati: Record<string, unknown>, ctx: Contesto): StatoGioco | null => {
  const e = eseguiAzione(s, { tipo, dati }, ctx);
  if (!e.ok && tipo === "compraOggetto") ULTIMO_ERRORE.valore = `${e.errore.chiave} ${e.errore.dettaglio ?? ""}`;
  return e.ok ? e.stato : null;
};
export const ULTIMO_ERRORE = { valore: "" };

const puntiPezzo = (e: { readonly linea: string; readonly livello: number } | null | undefined): number => {
  const linea = e ? LINEE.find((l) => l.id === e.linea) : undefined;
  return e && linea ? calcolaPunti(linea, e.livello) : 0;
};

// Pronto al prossimo livello? Ai livelli chiave serve l'equipaggiamento giusto (o il massimo possibile della sua linea).
function prontoAlDuello(stato: StatoGioco): boolean {
  const prossimo = stato.personaggio.livello + 1;
  if (!eLivelloChiave(prossimo)) return true;
  const eq = statoEquipaggiamento.leggi(stato);
  const bersaglio = PUNTI_PER_DUELLO[prossimo] ?? 20;
  return puntiPezzo(eq.arma) >= bersaglio - 0.5 && puntiPezzo(eq.armatura) >= bersaglio - 0.5;
}

// Sale di livello finché si può. Ritorna lo stato aggiornato.
function saliSePuoi(stato: StatoGioco, classe: string, ctx: Contesto, conAbilita = false): StatoGioco {
  let s = stato;
  for (let i = 0; i < 4; i++) {
    const p = s.personaggio;
    if (p.livello >= PARAMETRI_LIVELLI.livelloMax || p.esperienza < esperienzaPerSalire(p.livello) || p.oro < rettaAttuale(s) || !prontoAlDuello(s)) return s;
    const inGilda = conSito(s, GILDA[classe]!);
    const prossimo = eLivelloChiave(p.livello + 1)
      ? esegui(inGilda, "sfidaCapogilda", {}, ctx)
      : esegui(inGilda, "saliDiLivello", {}, ctx);
    if (prossimo === null) return s;
    s = prossimo.personaggio.hp > 0 ? finisciScontro(prossimo, ctx, conAbilita) : prossimo;
  }
  return s;
}

// Regola semplice delle abilità (0.34.0), applicata a inizio scontro: (1) le abilità a uso singolo, prima quelle che saltano il turno (difensive) e poi
// quelle d'attacco (la Cura solo sotto il 50% degli HP); (2) poi chi ha mana (il Mistico) alterna le abilità illimitate (Concentrazione, Dardo)
// finché il mana resta sopra la riserva. Ogni uso che il motore rifiuta (livello, mana, già usata) si salta.
function usaAbilitaDiScontro(stato: StatoGioco, ctx: Contesto): StatoGioco {
  const voci = abilitaDellaClasse(stato, ctx).map((v, i) => ({ ...v, posizione: i + 1 }));
  const singole = voci.filter((v) => v.abilita.usiPerScontro !== undefined).sort((a, b) => Number(a.abilita.azione === "attacco") - Number(b.abilita.azione === "attacco"));
  const illimitate = voci.filter((v) => v.abilita.usiPerScontro === undefined && v.abilita.costoMana > 0);
  let s = stato;
  for (const v of singole) {
    if (!scontroInCorso(s)) return s;
    const { hpMax } = calcolaStatistiche(s, ctx);
    if (v.abilita.cura !== undefined && s.personaggio.hp >= hpMax * 0.5) continue;
    s = esegui(s, "usaAbilita", { posizione: v.posizione }, ctx) ?? s;
  }
  for (let giro = 0; giro < 12 && scontroInCorso(s); giro++) {
    const dopo = primaRiuscita(s, illimitate.map((v) => v.posizione), (v) => illimitate.find((i) => i.posizione === v)!.abilita.costoMana, ctx);
    if (dopo === null) break;
    s = dopo;
  }
  return s;
}

const scontroInCorso = (s: StatoGioco): boolean => statoCombattimento.leggi(s).scontro !== null && !s.personaggio.morto;

// Prova le abilità nell'ordine indicato (se il mana resta sopra la riserva) e restituisce lo stato dopo la prima che il motore accetta.
function primaRiuscita(s: StatoGioco, posizioni: readonly number[], costo: (posizione: number) => number, ctx: Contesto): StatoGioco | null {
  for (const posizione of posizioni) {
    if (manaAttuale(s, ctx) - costo(posizione) < RISERVA_MANA) continue;
    const dopo = esegui(s, "usaAbilita", { posizione }, ctx);
    if (dopo !== null) return dopo;
  }
  return null;
}

// Combatte con il freno di sicurezza al 35% degli HP: se la fuga è consentita fugge, altrimenti (capigilda) combatte fino alla fine.
function finisciScontro(stato: StatoGioco, ctx: Contesto, conAbilita = false): StatoGioco {
  let s = conAbilita && statoCombattimento.leggi(stato).scontro !== null ? usaAbilitaDiScontro(stato, ctx) : stato;
  for (let i = 0; i < 8 && statoCombattimento.leggi(s).scontro !== null && !s.personaggio.morto; i++) {
    s = esegui(s, "combattiFinoAllaFine", {}, ctx) ?? s;
    if (statoCombattimento.leggi(s).scontro === null || s.personaggio.morto) break;
    const fuga = esegui(s, "fuggi", {}, ctx);
    if (fuga !== null) { s = fuga; continue; }
    s = statoCombattimento.scrivi(s, { ...statoCombattimento.leggi(s), soglia: 0 });
    s = esegui(s, "combattiFinoAllaFine", {}, ctx) ?? s;
    s = statoCombattimento.scrivi(s, { ...statoCombattimento.leggi(s), soglia: SOGLIA_FRENO });
  }
  return s;
}

// Compra, finché conviene, il pezzo naturale più debole tenendo da parte la retta per salire.
function compra(stato: StatoGioco, classe: string, ctx: Contesto): StatoGioco {
  let s = stato;
  for (let i = 0; i < 12; i++) {
    const riserva = s.personaggio.esperienza >= esperienzaPerSalire(s.personaggio.livello) && prontoAlDuello(s) ? rettaAttuale(s) : 0;
    const eq = statoEquipaggiamento.leggi(s);
    const ordine = [...LINEE_CLASSE[classe]!].sort((a, b) => (a === eq.arma?.linea ? 1 : 0) - (b === eq.arma?.linea ? 1 : 0) || (eq.armatura?.livello ?? 0) - (eq.arma?.livello ?? 0));
    const scelta = ordine.map((l) => ({ l, o: calcolaOfferta(s, l, ctx) })).find((x) => x.o !== undefined && x.o.prezzoNetto <= s.personaggio.oro - riserva);
    if (scelta === undefined) return s;
    const dopo = esegui(s, "compraOggetto", { linea: scelta.l }, ctx);
    if (dopo === null) return s;
    s = dopo;
  }
  return s;
}

// Dove va a esplorare: la foresta; la piana di Capannori dal livello 12 con entrambi i pezzi d'acciaio di brace.
const dueBrace = (s: StatoGioco): boolean => {
  const eq = statoEquipaggiamento.leggi(s);
  return (eq.arma?.linea.endsWith("-brace") ?? false) && (eq.armatura?.linea.endsWith("-brace") ?? false);
};
// Le colline si aprono al livello 16 (0.28.0); prima la piana (dal 12) e la foresta.
const LIVELLO_COLLINE = 16;
const luogoDiEsplorazione = (s: StatoGioco): string => {
  if (!dueBrace(s)) return "foresta";
  if (s.personaggio.livello >= LIVELLO_COLLINE) return "colline";
  return s.personaggio.livello >= PARAMETRI_LIVELLI.livelloDegno ? "piana" : "foresta";
};

function esplora(stato: StatoGioco, ctx: Contesto, opz: OpzioniSimulatore = {}): StatoGioco {
  let s = stato;
  let n = 0;
  while (leggiAzioniResidue(s) > 0 && !s.personaggio.morto) {
    const { hpMax } = calcolaStatistiche(s, ctx);
    const luogo = luogoDiEsplorazione(s);
    if (s.personaggio.hp < hpMax * RIPOSO[luogo as keyof typeof RIPOSO]) {
      if (!CURA_A_PAGAMENTO) return s; // riposa fino a domani (il nuovo giorno cura tutto)
      const curato = esegui(s, "curaGuaritore", { quantita: "tutto" }, ctx);
      if (curato === null) return s; // senza soldi per curarsi: riposa fino a domani
      s = curato;
    }
    // «Cerca guai» (0.34.0 nella foresta dal livello 2; 0.35.0 anche in piana e colline): a turno con l'esplorazione normale.
    const guai = opz.guai === true && (luogo !== "foresta" || s.personaggio.livello >= 2) && n++ % 2 === 1;
    const dopo = esegui(s, "esploraForesta", { luogoId: guai ? `${luogo}-guai` : luogo }, ctx) ?? (guai ? esegui(s, "esploraForesta", { luogoId: luogo }, ctx) : null);
    if (dopo === null) return s;
    s = finisciScontro(dopo, ctx, opz.abilita === true);
  }
  return s;
}

// Compra l'acciaio di brace (Fabbro) appena si può. Ritorna lo stato e quanti pezzi ha ora.
function compraBrace(stato: StatoGioco, ctx: Contesto): { readonly stato: StatoGioco; readonly pezzi: number } {
  let s = conSito(stato, "fabbro");
  for (const l of [LINEA_FUCINA_ARMA, LINEA_FUCINA_ARMATURA]) s = esegui(s, "compraOggetto", { linea: l }, ctx) ?? s;
  const eq = statoEquipaggiamento.leggi(s);
  return { stato: s, pezzi: Number(eq.arma?.linea.endsWith("-brace") ?? false) + Number(eq.armatura?.linea.endsWith("-brace") ?? false) };
}

export function simulaRun(classe: string, seme: number, giorniMax: number, traccia?: string[], opz: OpzioniSimulatore = {}): RisultatoRun {
  const base = statoClassi.scrivi(creaStatoIniziale(registro, "Sim", INIZIO), { classeId: classe });
  let stato = statoCombattimento.scrivi(base, { ...statoCombattimento.leggi(base), automatico: opz.abilita !== true, soglia: SOGLIA_FRENO });
  const giornoLivello: Record<number, number> = { 1: 0 };
  const oro: Record<number, number[]> = {};
  const esp: Record<number, number[]> = {};
  let primo: number | null = null, due: number | null = null, morti = 0, giorno = 0;
  for (; giorno < giorniMax && stato.personaggio.livello < PARAMETRI_LIVELLI.livelloMax; giorno++) {
    const ctx = creaContestoDiProva(registro, seme * 1000 + giorno, INIZIO + giorno * DURATA_CICLO_MS);
    const morto = stato.personaggio.morto;
    const e = giorno === 0 ? { ok: true as const, stato } : applicaGiorno(stato, ctx);
    stato = e.ok ? e.stato : stato;
    if (morto) morti++;
    stato = compra(saliSePuoi(stato, classe, ctx, opz.abilita === true), classe, ctx);
    const prima = { oro: stato.personaggio.oro, esp: stato.personaggio.esperienza, livello: stato.personaggio.livello };
    stato = esplora(stato, ctx, opz);
    (oro[prima.livello] ??= []).push(stato.personaggio.oro - prima.oro);
    (esp[prima.livello] ??= []).push(stato.personaggio.esperienza - prima.esp);
    stato = compra(saliSePuoi(stato, classe, ctx, opz.abilita === true), classe, ctx);
    const livello = stato.personaggio.livello;
    traccia?.push(`g${giorno + 1} L${livello} esp ${stato.personaggio.esperienza}/${esperienzaPerSalire(livello)} oro ${stato.personaggio.oro} retta ${rettaAttuale(stato)} hp ${stato.personaggio.hp} arma ${JSON.stringify(statoEquipaggiamento.leggi(stato).arma)} arm ${JSON.stringify(statoEquipaggiamento.leggi(stato).armatura)}`);
    if (giornoLivello[livello] === undefined) giornoLivello[livello] = giorno + 1;
    if (livello >= PARAMETRI_LIVELLI.livelloDegno) {
      const b = compraBrace(stato, ctx);
      stato = b.stato;
      if (b.pezzi >= 1 && primo === null) primo = giorno + 1;
      if (b.pezzi >= 2 && due === null) due = giorno + 1;
    }
  }
  const media = (v: number[]): number => Math.round(v.reduce((a, b) => a + b, 0) / Math.max(1, v.length));
  const aMedia = (r: Record<number, number[]>): Record<number, number> => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, media(v)]));
  return { giornoLivello, giornoPrimoPezzoBrace: primo, giornoDuePezziBrace: due, morti, orodelGiorno: aMedia(oro), espDelGiorno: aMedia(esp), stato, giorni: giorno };
}


// --- San Donato (0.35.0): dal livello 20 il giocatore simulato affronta ogni giorno i luoghi leggendari (la Tana quando si apre). ---
export interface RisultatoSanDonato {
  // Per creatura: scontri, vittorie e sconfitte (morte).
  readonly esiti: Readonly<Record<string, { scontri: number; vittorie: number; morti: number }>>;
  readonly giorniAllaTana: number | null; // giorni (dopo il livello 20) per sbloccare la Tana
  readonly oroPerGiorno: number;
}

export function simulaSanDonato(classe: string, seme: number, giorniMax: number, giorniSD: number, opz: OpzioniSimulatore = {}): RisultatoSanDonato | null {
  const run = simulaRun(classe, seme, giorniMax, undefined, opz);
  if (run.stato.personaggio.livello < PARAMETRI_LIVELLI.livelloMax) return null;
  let stato = run.stato;
  const esiti: Record<string, { scontri: number; vittorie: number; morti: number }> = {};
  let giorniAllaTana: number | null = null, oroTotale = 0;
  for (let g = 0; g < giorniSD; g++) {
    const ctx = creaContestoDiProva(registro, seme * 1000 + run.giorni + g, INIZIO + (run.giorni + g) * DURATA_CICLO_MS);
    const e = applicaGiorno(stato, ctx);
    stato = conSito(e.ok ? e.stato : stato, "porta-no");
    const oroInizio = stato.personaggio.oro;
    const LUOGHI = ["pascolo-capra", "grotta-serpe-motro", "orrido-botri", "castelvecchio", "vicolo-cane", "tetto-gatto", "tana-serpe-volastro"];
    // L'ordine ruota ogni giorno, così ogni luogo viene misurato; sotto metà HP il giocatore si cura (a pagamento: al 20 l'oro non manca).
    for (const luogo of [...LUOGHI.slice(g % 7), ...LUOGHI.slice(0, g % 7)]) {
      const { hpMax } = calcolaStatistiche(stato, ctx);
      if (stato.personaggio.morto) break;
      if (stato.personaggio.hp < hpMax * 0.5) stato = esegui(stato, "curaGuaritore", { quantita: "tutto" }, ctx) ?? stato;
      const avvio = esegui(stato, "sfidaLuogoSanDonato", { luogoId: luogo }, ctx);
      if (avvio === null) continue;
      const creatura = statoCombattimento.leggi(avvio).scontro?.creaturaId ?? luogo;
      const oroPrima = avvio.personaggio.oro;
      stato = finisciScontro(avvio, ctx, opz.abilita === true);
      const r = (esiti[creatura] ??= { scontri: 0, vittorie: 0, morti: 0 });
      r.scontri++;
      if (stato.personaggio.morto) r.morti++; else if (stato.personaggio.oro > oroPrima) r.vittorie++;
      if (luogo === "tana-serpe-volastro" && giorniAllaTana === null) giorniAllaTana = g + 1;
    }
    oroTotale += stato.personaggio.oro - oroInizio;
  }
  return { esiti, giorniAllaTana, oroPerGiorno: Math.round(oroTotale / giorniSD) };
}
