import type { Contesto, Esito, EventoGioco, Id, StatoGioco } from "../../core/indice";
import { applicaRegole, calcolaStatistiche, esitoErrore, esitoOk, eventiAttivi, leggiContenuto } from "../../core/indice";
import { calcolaDannoBase, calcolaOroPerso, moltiplicatoreTipo } from "./calcolo";
import { PARAMETRI_COMBATTIMENTO } from "./parametri";
import { aggiungiEffetti, applicaMoltiplicatoreDanno, calcolaPrecisione, consumaColpi, modificatoriAttaccante } from "./effetti";
import type { Attaccante } from "./effetti";
import { puntoColpoSubito, puntoDanno, puntoFineRound, puntoFineScontro, puntoOro, puntoPrecisione, puntoProtezione, puntoTipoDanno, puntoTipoSecondario } from "./punti";
import { iniziativaContro } from "./velocita";
import type { Creatura, EffettoScontro, Potenziamento, ScontroAttivo, TipoDanno } from "./tipi";
import { registraStatistiche, impostaScontro } from "./statistiche";
import { statoCombattimento, tipoCreatura } from "./tipi";

export interface ScontroCorrente {
  readonly scontro: ScontroAttivo;
  readonly creatura: Creatura;
  readonly creaturaId: Id;
}

export function creaturaDisponibile(creatura: Creatura, ctx: Contesto): boolean {
  return creatura.evento === undefined || eventiAttivi(ctx).includes(creatura.evento);
}

// Avvia uno scontro con la creatura indicata. Riusabile da altri moduli (es. foresta).
// scenaId è l'illustrazione del luogo, usata come sfondo del combattimento.
export function iniziaScontro(stato: StatoGioco, creaturaId: Id, ctx: Contesto, scenaId?: Id, moltiplicatorePremio = 1, potenziamento?: Potenziamento): Esito {
  if (statoCombattimento.leggi(stato).scontro) return esitoErrore("combattimento.errore.combattimento_in_corso");
  const creatura = leggiContenuto(ctx.registro, tipoCreatura, creaturaId);
  if (!creatura) return esitoErrore("combattimento.errore.creatura_sconosciuta", creaturaId);
  if (!creaturaDisponibile(creatura, ctx)) {
    return esitoErrore("combattimento.errore.creatura_non_disponibile", creaturaId);
  }
  const scontro: ScontroAttivo = { creaturaId, hpNemico: Math.round(creatura.hp * (potenziamento?.hp ?? 1)), round: 1, effetti: [], usi: {}, ...(scenaId !== undefined ? { scenaId } : {}), ...(moltiplicatorePremio !== 1 ? { moltiplicatorePremio } : {}), ...(potenziamento ? { potenziamento } : {}) };
  // L'avviso del primo incontro si legge prima di registrare l'incontro.
  const primoIncontro = (statoCombattimento.leggi(stato).statistiche[creaturaId]?.incontri ?? 0) === 0;
  const nuovo = registraStatistiche(impostaScontro(stato, scontro), creaturaId, { incontri: 1 });
  const inizio: EventoGioco = potenziamento?.soprannomeChiave
    ? { chiave: "combattimento.inizioNome", parametri: { creaturaChiave: creatura.nomeChiave, soprannomeChiave: potenziamento.soprannomeChiave } }
    : { chiave: "combattimento.inizio", parametri: { creaturaChiave: creatura.nomeChiave } };
  const avviso: EventoGioco[] = primoIncontro && creatura.avvisoPrimoIncontroChiave ? [{ chiave: creatura.avvisoPrimoIncontroChiave, tono: "speciale" }] : [];
  return esitoOk(nuovo, [inizio, ...avviso]);
}

export function caricaScontro(stato: StatoGioco, ctx: Contesto): ScontroCorrente | undefined {
  const scontro = statoCombattimento.leggi(stato).scontro;
  if (!scontro) return undefined;
  const creatura = leggiContenuto(ctx.registro, tipoCreatura, scontro.creaturaId);
  if (!creatura) return undefined;
  // Un nemico potenziato ha HP e forza moltiplicati: tutti i calcoli del combattimento usano queste statistiche.
  const p = scontro.potenziamento;
  const potenziata = p ? { ...creatura, hp: Math.round(creatura.hp * p.hp), forza: Math.round(creatura.forza * p.forza) } : creatura;
  return { scontro, creatura: potenziata, creaturaId: scontro.creaturaId };
}

// Danno del giocatore dopo le regole dei moduli (es. magia, equipaggiamento).
export function calcolaDannoGiocatore(stato: StatoGioco, creatura: Creatura, ctx: Contesto): number {
  const { forza } = calcolaStatistiche(stato, ctx);
  const tiro = ctx.rng.intero(0, PARAMETRI_COMBATTIMENTO.dadoMax);
  const base = calcolaDannoBase(forza, tiro, creatura.difesa);
  return applicaRegole(ctx, puntoDanno, { stato, attaccante: "giocatore", danno: base }).danno;
}

// Tipo di danno del colpo del giocatore: quello dell'arma (regole dei moduli), o quello di un effetto attivo (es. la magia dopo la Concentrazione).
export function tipoDannoGiocatore(stato: StatoGioco, effetti: readonly EffettoScontro[], ctx: Contesto): TipoDanno {
  const dalleRegole = applicaRegole(ctx, puntoTipoDanno, { stato, tipo: "contundente" as TipoDanno }).tipo;
  return effetti.find((e) => e.bersaglio === "giocatore" && e.tipoDanno !== undefined)?.tipoDanno ?? dalleRegole;
}

// Moltiplicatore di natura del colpo del giocatore. Se un effetto attivo impone un tipo (la magia dopo la Concentrazione) conta solo quello;
// altrimenti il MIGLIORE tra il tipo dell'arma e l'eventuale secondo tipo (arma incantata: magico), così l'incantamento non peggiora mai il danno.
export function moltiplicatoreDelColpo(stato: StatoGioco, effetti: readonly EffettoScontro[], natura: Creatura["natura"], ctx: Contesto): number {
  const primario = moltiplicatoreTipo(natura, tipoDannoGiocatore(stato, effetti, ctx));
  if (effetti.some((e) => e.bersaglio === "giocatore" && e.tipoDanno !== undefined)) return primario;
  const secondo = applicaRegole(ctx, puntoTipoSecondario, { stato, tipo: undefined }).tipo;
  return secondo === undefined ? primario : Math.max(primario, moltiplicatoreTipo(natura, secondo));
}

// Il potenziamento dello scontro in corso, nella forma che serve alla regola di fine scontro (vuoto se non c'è).
function scenaDi(stato: StatoGioco): { readonly scenaId?: Id } {
  const s = statoCombattimento.leggi(stato).scontro?.scenaId;
  return s === undefined ? {} : { scenaId: s };
}

function potenziamentoDi(stato: StatoGioco): { readonly potenziamento?: Potenziamento } {
  const p = statoCombattimento.leggi(stato).scontro?.potenziamento;
  return p ? { potenziamento: p } : {};
}

export function scontroFinito(stato: StatoGioco): boolean {
  return statoCombattimento.leggi(stato).scontro === null;
}

// Probabilità di colpire di "chi" contro la creatura: precisione base, regole dei moduli, poi gli effetti attivi.
export function precisioneAttaccante(stato: StatoGioco, chi: Attaccante, creatura: Creatura, ctx: Contesto): number {
  const effetti = statoCombattimento.leggi(stato).scontro?.effetti ?? [];
  const base = chi === "giocatore" ? PARAMETRI_COMBATTIMENTO.precisioneBase : creatura.precisione;
  const regolata = applicaRegole(ctx, puntoPrecisione, { stato, attaccante: chi, probabilita: base }).probabilita;
  return calcolaPrecisione(regolata, modificatoriAttaccante(effetti, chi));
}

function conScontro(stato: StatoGioco, modifica: (s: ScontroAttivo) => ScontroAttivo): StatoGioco {
  const scontro = statoCombattimento.leggi(stato).scontro;
  return scontro ? impostaScontro(stato, modifica(scontro)) : stato;
}

export function conEffetti(stato: StatoGioco, nuovi: readonly EffettoScontro[]): StatoGioco {
  return nuovi.length === 0 ? stato : conScontro(stato, (s) => ({ ...s, effetti: aggiungiEffetti(s.effetti, nuovi) }));
}

// Contatore di usi nello scontro (per le abilità "n volte per scontro"): sparisce con lo scontro.
export function registraUsoScontro(stato: StatoGioco, chiave: string): StatoGioco {
  return conScontro(stato, (s) => ({ ...s, usi: { ...s.usi, [chiave]: (s.usi[chiave] ?? 0) + 1 } }));
}

export function usiScontro(stato: StatoGioco, chiave: string): number {
  return statoCombattimento.leggi(stato).scontro?.usi[chiave] ?? 0;
}

// Applica un colpo del giocatore; se il nemico sopravvive e "rispondeNemico" è vero, il nemico colpisce a sua volta.
function applicaColpoGiocatore(
  stato: StatoGioco,
  danno: number,
  ctx: Contesto,
  eventiPrecedenti: readonly EventoGioco[],
  rispondeNemico: boolean,
  // Se l'attacco è potenziato da un'abilità: il nome dell'abilità (chiave di testo), per evidenziare la riga.
  potenziatoDa?: string,
): Esito {
  const corrente = caricaScontro(stato, ctx);
  if (!corrente) return esitoErrore("combattimento.errore.nessun_combattimento");
  const { scontro, creatura, creaturaId } = corrente;
  const hpNemico = Math.max(0, scontro.hpNemico - danno);
  const registrato = registraStatistiche(stato, creaturaId, { dannoInflitto: scontro.hpNemico - hpNemico });
  const colpo: EventoGioco = potenziatoDa
    ? { chiave: "combattimento.colpoGiocatorePotenziato", parametri: { danno, abilitaChiave: potenziatoDa }, tono: "speciale" }
    : { chiave: "combattimento.colpoGiocatore", parametri: { danno } };
  const eventi: EventoGioco[] = [...eventiPrecedenti, colpo];
  if (hpNemico === 0) return concludiVittoria(registrato, creatura, creaturaId, ctx, eventi);
  const aggiornato = impostaScontro(registrato, { ...scontro, hpNemico, round: scontro.round + 1 });
  return rispondeNemico ? turnoNemico(aggiornato, creatura, creaturaId, ctx, eventi) : esitoOk(aggiornato, eventi);
}

// Applica un colpo del giocatore (di qualsiasi origine, sempre a segno) e fa seguire il turno del nemico.
// È anche il punto d'ingresso per i moduli che infliggono danno senza tirare per colpire (es. incantesimi).
export function risolviColpoGiocatore(stato: StatoGioco, danno: number, ctx: Contesto): Esito {
  return applicaColpoGiocatore(stato, danno, ctx, [], true);
}

// L'attacco del giocatore: prima si tira la probabilità di colpire, poi (se va a segno) il danno. Un attacco
// mancato consuma comunque gli effetti temporanei.
function attaccoGiocatore(stato: StatoGioco, ctx: Contesto, eventiPrecedenti: readonly EventoGioco[]): Esito {
  const corrente = caricaScontro(stato, ctx);
  if (!corrente) return esitoErrore("combattimento.errore.nessun_combattimento");
  const { scontro, creatura } = corrente;
  const modificatori = modificatoriAttaccante(scontro.effetti, "giocatore");
  const potenziatoDa = scontro.effetti.find((e) => e.bersaglio === "giocatore" && e.etichettaChiave !== undefined)?.etichettaChiave;
  const probabilita = precisioneAttaccante(stato, "giocatore", creatura, ctx);
  const consumato = conScontro(stato, (s) => ({ ...s, effetti: consumaColpi(s.effetti, "giocatore") }));
  if (ctx.rng.prossimo() >= probabilita) {
    const senzaColpo = conScontro(consumato, (s) => ({ ...s, round: s.round + 1 }));
    const mancato: EventoGioco = potenziatoDa
      ? { chiave: "combattimento.mancatoGiocatorePotenziato", parametri: { abilitaChiave: potenziatoDa }, tono: "speciale" }
      : { chiave: "combattimento.mancatoGiocatore" };
    return esitoOk(senzaColpo, [...eventiPrecedenti, mancato]);
  }
  const danno = applicaMoltiplicatoreDanno(calcolaDannoGiocatore(stato, creatura, ctx), modificatori.moltiplicatoreDanno * moltiplicatoreDelColpo(stato, scontro.effetti, creatura.natura, ctx));
  return applicaColpoGiocatore(consumato, danno, ctx, eventiPrecedenti, false, potenziatoDa);
}

// Il giocatore salta l'attacco di questo round (es. si concentra).
function attesaGiocatore(stato: StatoGioco, eventiPrecedenti: readonly EventoGioco[]): Esito {
  return esitoOk(conScontro(stato, (s) => ({ ...s, round: s.round + 1 })), eventiPrecedenti);
}

// Opzioni di un round: le abilità aggiungono effetti prima del round o subito dopo l'azione del giocatore,
// e possono far saltare l'attacco.
export interface OpzioniRound {
  readonly salta?: boolean;
  readonly prima?: readonly EffettoScontro[];
  readonly dopo?: readonly EffettoScontro[];
}

function passoGiocatore(stato: StatoGioco, ctx: Contesto, opzioni: OpzioniRound, eventi: readonly EventoGioco[]): Esito {
  const r = opzioni.salta ? attesaGiocatore(stato, eventi) : attaccoGiocatore(stato, ctx, eventi);
  if (!r.ok || scontroFinito(r.stato)) return r;
  return esitoOk(conEffetti(r.stato, opzioni.dopo ?? []), r.eventi);
}

// Un round di combattimento: colpisce per primo il più veloce (a parità, a sorte). Se il primo colpo
// uccide, l'altro non risponde. Se è il nemico a colpire per primo e il giocatore sopravvive, risponde.
export function risolviRound(stato: StatoGioco, ctx: Contesto, opzioni: OpzioniRound = {}): Esito {
  return conteggioRound(risolviRoundBase(stato, ctx, opzioni), ctx);
}

// Dopo ogni round le regole dei moduli contano il turno giocato (es. le pozioni di effetto durano un numero di turni di combattimento).
export function conteggioRound(esito: Esito, ctx: Contesto): Esito {
  if (!esito.ok) return esito;
  const dopo = applicaRegole(ctx, puntoFineRound, { stato: esito.stato, eventi: [] });
  return { ...esito, stato: dopo.stato, eventi: [...esito.eventi, ...dopo.eventi] };
}

function risolviRoundBase(stato: StatoGioco, ctx: Contesto, opzioni: OpzioniRound = {}): Esito {
  const corrente = caricaScontro(stato, ctx);
  if (!corrente) return esitoErrore("combattimento.errore.nessun_combattimento");
  const { scontro, creatura, creaturaId } = corrente;
  const iniziale = conEffetti(stato, opzioni.prima ?? []);
  if (iniziativaContro(iniziale, creatura, ctx) === "giocatore") {
    const r = passoGiocatore(iniziale, ctx, opzioni, []);
    return !r.ok || scontroFinito(r.stato) ? r : turnoNemico(r.stato, creatura, creaturaId, ctx, r.eventi);
  }
  const annuncio: EventoGioco[] = scontro.round === 1 ? [{ chiave: "combattimento.nemicoPrimo" }] : [];
  const subito = turnoNemico(iniziale, creatura, creaturaId, ctx, annuncio);
  if (!subito.ok || scontroFinito(subito.stato)) return subito;
  return passoGiocatore(subito.stato, ctx, opzioni, subito.eventi);
}

// Il nemico attacca: tira per colpire, poi calcola il danno. Gli effetti del nemico si consumano comunque.
export function turnoNemico(
  stato: StatoGioco,
  creatura: Creatura,
  creaturaId: Id,
  ctx: Contesto,
  eventiPrecedenti: readonly EventoGioco[],
): Esito {
  const effetti = statoCombattimento.leggi(stato).scontro?.effetti ?? [];
  const probabilita = precisioneAttaccante(stato, "nemico", creatura, ctx);
  const consumato = conScontro(stato, (s) => ({ ...s, effetti: consumaColpi(s.effetti, "nemico") }));
  if (ctx.rng.prossimo() >= probabilita) {
    return esitoOk(consumato, [...eventiPrecedenti, { chiave: "combattimento.mancatoNemico", tono: "positivo" }]);
  }
  const moltiplicatore = modificatoriAttaccante(effetti, "nemico").moltiplicatoreDanno;
  return colpoNemico(consumato, creatura, creaturaId, ctx, eventiPrecedenti, moltiplicatore);
}

function colpoNemico(
  stato: StatoGioco,
  creatura: Creatura,
  creaturaId: Id,
  ctx: Contesto,
  eventiPrecedenti: readonly EventoGioco[],
  moltiplicatore: number,
): Esito {
  const { difesa } = calcolaStatistiche(stato, ctx);
  const tiro = ctx.rng.intero(0, PARAMETRI_COMBATTIMENTO.dadoMax);
  const base = calcolaDannoBase(creatura.forza, tiro, difesa);
  const regolato = applicaRegole(ctx, puntoDanno, { stato, attaccante: "nemico", danno: base }).danno;
  const danno = applicaMoltiplicatoreDanno(regolato, moltiplicatore);
  const hp = Math.max(0, stato.personaggio.hp - danno);
  const colpo: EventoGioco = { chiave: "combattimento.colpoNemico", parametri: { danno }, tono: "negativo" };
  const eventi = [...eventiPrecedenti, colpo];
  const subito = stato.personaggio.hp - hp;
  const colpito = registraStatistiche({ ...stato, personaggio: { ...stato.personaggio, hp } }, creaturaId, { dannoSubito: subito });
  if (hp === 0) return concludiSconfitta(colpito, creatura, creaturaId, ctx, eventi);
  // Chi è ancora in piedi può subire un effetto del colpo (veleno, paura...): lo decidono le regole dei moduli.
  const effetto = applicaRegole(ctx, puntoColpoSubito, { stato: colpito, creaturaId, danno: subito, eventi: [] });
  return esitoOk(effetto.stato, [...eventi, ...effetto.eventi]);
}

function concludiVittoria(
  stato: StatoGioco,
  creatura: Creatura,
  creaturaId: Id,
  ctx: Contesto,
  eventi: readonly EventoGioco[],
): Esito {
  // Il premio può essere maggiorato dal luogo e dall'ora (es. +25% di notte nel cimitero): vale per monete ed esperienza.
  const premio = statoCombattimento.leggi(stato).scontro?.moltiplicatorePremio ?? 1;
  const calcoloOro = applicaRegole(ctx, puntoOro, { stato, oro: creatura.oro });
  const oro = Math.round(calcoloOro.oro * premio);
  const esperienza = Math.round(creatura.esperienza * premio);
  const p = stato.personaggio;
  const vinto: StatoGioco = {
    ...stato,
    personaggio: { ...p, oro: p.oro + oro, esperienza: p.esperienza + esperienza },
  };
  const finale = registraStatistiche(impostaScontro(vinto, null), creaturaId, { sconfitti: 1 });
  // Senza monete né esperienza (es. un duello del torneo, che ha i suoi premi) basta "Vittoria!".
  const evento: EventoGioco = {
    chiave: oro === 0 && esperienza === 0 ? "combattimento.vittoriaSola" : "combattimento.vittoria",
    parametri: { oro, esperienza },
    tono: "positivo",
  };
  const fine = applicaRegole(ctx, puntoFineScontro, { stato: finale, creaturaId, esito: "vittoria", eventi: [], ...potenziamentoDi(stato), ...scenaDi(stato) });
  return esitoOk(fine.stato, [...eventi, evento, ...(calcoloOro.eventi ?? []), ...fine.eventi]);
}

// La penalità di esperienza sarà aggiunta dal modulo di progressione tramite una regola (M4).
function concludiSconfitta(stato: StatoGioco, creatura: Creatura, creaturaId: Id, ctx: Contesto, eventi: readonly EventoGioco[]): Esito {
  const p = stato.personaggio;
  // La protezione divina (0.19.0) salva dalla morte vera, non serve nei duelli (già non letali).
  const protezione = creatura.nonLetale ? undefined : applicaRegole(ctx, puntoProtezione, { stato, protetta: false, eventi: [] });
  if (creatura.nonLetale || protezione?.protetta) {
    // Duello non letale (o grazia ricevuta): si resta vivi a 1 HP, senza perdere monete né esperienza, e lo scontro finisce.
    const base = protezione?.protetta ? protezione.stato : stato;
    const vivo: StatoGioco = { ...base, personaggio: { ...base.personaggio, hp: 1 } };
    const registrato = registraStatistiche(impostaScontro(vivo, null), creaturaId, { perse: 1 });
    const fine = applicaRegole(ctx, puntoFineScontro, { stato: registrato, creaturaId, esito: "sconfitta", eventi: [], ...potenziamentoDi(stato), ...(protezione?.protetta ? { protetta: true } : {}) });
    const messaggio: EventoGioco[] = protezione?.protetta ? [...protezione.eventi] : [{ chiave: creatura.messaggioSconfittaChiave ?? "combattimento.sconfittaNonLetale", tono: "negativo" }];
    return esitoOk(fine.stato, [...eventi, ...messaggio, ...fine.eventi]);
  }
  const oroPerso = calcolaOroPerso(p.oro, PARAMETRI_COMBATTIMENTO.penalitaOroMorte);
  const morto: StatoGioco = {
    ...stato,
    personaggio: { ...p, hp: 0, morto: true, oro: p.oro - oroPerso },
  };
  const finale = registraStatistiche(impostaScontro(morto, null), creaturaId, { morti: 1 });
  const fine = applicaRegole(ctx, puntoFineScontro, { stato: finale, creaturaId, esito: "sconfitta", eventi: [], ...potenziamentoDi(stato), ...scenaDi(stato), oroPerso });
  return esitoOk(fine.stato, [...eventi, { chiave: "combattimento.sconfitta", parametri: { oroPerso }, tono: "negativo" }, ...fine.eventi]);
}
