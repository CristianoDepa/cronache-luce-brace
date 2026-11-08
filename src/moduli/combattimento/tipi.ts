import type { Id, Riferimento, Risultato, TipoContenuto } from "../../core/indice";
import { booleano, chiudi, comeOggetto, definisciStato, fallisci, numero, ok, stringa, stringaOpzionale } from "../../core/indice";

import { èFamiglia } from "./famiglie";
import { PARAMETRI_COMBATTIMENTO } from "./parametri";

export const ID_COMBATTIMENTO = "combattimento";

// Tipi di danno: le tre armi fisiche e la magia. Ogni creatura ha una natura (debole, resistente) per tipo.
export const TIPI_DANNO = ["taglio", "contundente", "perforante", "magico"] as const;
export type TipoDanno = (typeof TIPI_DANNO)[number];
// Moltiplicatore del danno per tipo (1 se manca): 0,5 resiste, 1,5 è debole.
export type NaturaCreatura = Readonly<Partial<Record<TipoDanno, number>>>;

export interface Creatura {
  readonly nomeChiave: string;
  // Nome senza articolo, per le tabelle (es. "Ratto gigante"); se manca si usa nomeChiave.
  readonly nomeBreveChiave?: string;
  readonly hp: number;
  readonly forza: number;
  readonly difesa: number;
  readonly oro: number;
  readonly esperienza: number;
  // Chi è più veloce colpisce per primo in ogni round; conta anche per la fuga del giocatore.
  readonly velocita: number;
  // Probabilità di colpire il giocatore (0-1); se manca vale la precisione base.
  readonly precisione: number;
  readonly fugaConsentita: boolean;
  // Se vero, perdere non uccide: si resta a 1 HP, senza perdere monete (es. il duello con un capogilda).
  readonly nonLetale: boolean;
  // Id dell'illustrazione della creatura.
  readonly immagineId?: string;
  // Natura rispetto ai tipi di danno (solo i tipi diversi da 1).
  readonly natura?: NaturaCreatura;
  // Famiglia nel bestiario (animali, umanoidi, nonmorti, spiriti, boss); i duelli con i capigilda non ne hanno.
  readonly famiglia?: string;
  // Se presente, la creatura esiste solo mentre l'evento di calendario è attivo.
  readonly evento?: Id;
}

function convalidaNatura(dati: unknown, errori: string[]): NaturaCreatura | undefined {
  if (dati === undefined) return undefined;
  const o = comeOggetto(dati);
  if (!o) {
    errori.push('campo "natura": oggetto atteso');
    return undefined;
  }
  const natura: Partial<Record<TipoDanno, number>> = {};
  for (const chiave of Object.keys(o)) {
    if (!(TIPI_DANNO as readonly string[]).includes(chiave)) errori.push(`natura: tipo di danno sconosciuto "${chiave}"`);
  }
  for (const tipo of TIPI_DANNO) {
    if (o[tipo] !== undefined) natura[tipo] = numero(o, tipo, errori, { min: 0 });
  }
  return natura;
}

export const tipoCreatura: TipoContenuto<Creatura> = {
  nome: "creatura",
  valida(dati): Risultato<Creatura> {
    const o = comeOggetto(dati);
    if (!o) return fallisci("oggetto atteso");
    const errori: string[] = [];
    const evento = stringaOpzionale(o, "evento", errori);
    const immagineId = stringaOpzionale(o, "immagineId", errori);
    const nomeBreveChiave = stringaOpzionale(o, "nomeBreveChiave", errori);
    const natura = convalidaNatura(o["natura"], errori);
    const famiglia = stringaOpzionale(o, "famiglia", errori);
    if (famiglia !== undefined && !èFamiglia(famiglia)) errori.push(`famiglia sconosciuta "${famiglia}"`);
    const creatura: Creatura = {
      nomeChiave: stringa(o, "nomeChiave", errori),
      hp: numero(o, "hp", errori, { min: 1 }),
      forza: numero(o, "forza", errori, { min: 0 }),
      difesa: numero(o, "difesa", errori, { min: 0 }),
      oro: numero(o, "oro", errori, { min: 0 }),
      esperienza: numero(o, "esperienza", errori, { min: 0 }),
      velocita: numero(o, "velocita", errori, { min: 0, predefinito: PARAMETRI_COMBATTIMENTO.velocitaBase }),
      precisione: numero(o, "precisione", errori, { min: 0, max: 1, predefinito: PARAMETRI_COMBATTIMENTO.precisioneBase }),
      fugaConsentita: booleano(o, "fugaConsentita", errori, true),
      nonLetale: booleano(o, "nonLetale", errori, false),
      ...(evento !== undefined ? { evento } : {}),
      ...(immagineId !== undefined ? { immagineId } : {}),
      ...(nomeBreveChiave !== undefined ? { nomeBreveChiave } : {}),
      ...(natura !== undefined ? { natura } : {}),
      ...(famiglia !== undefined ? { famiglia } : {}),
    };
    return chiudi(errori, creatura);
  },
  riferimenti(c): readonly Riferimento[] {
    const base: Riferimento[] = [{ categoria: "testo", id: c.nomeChiave }];
    if (c.nomeBreveChiave !== undefined) base.push({ categoria: "testo", id: c.nomeBreveChiave });
    if (c.immagineId !== undefined) base.push({ categoria: "contenuto", tipo: "illustrazione", id: c.immagineId });
    if (c.evento !== undefined) base.push({ categoria: "evento", id: c.evento });
    return base;
  },
};

// Modificatore temporaneo di uno scontro (abilità, veleni, benedizioni...): vale per i prossimi "colpi" dell'attaccante
// indicato e poi scade. La probabilità di colpire diventa (base x moltiplicatore + delta), il danno si moltiplica.
export interface EffettoScontro {
  readonly bersaglio: "giocatore" | "nemico";
  readonly moltiplicatoreDanno: number;
  readonly moltiplicatorePrecisione: number;
  readonly deltaPrecisione: number;
  // Quanti attacchi dell'attaccante consumano l'effetto (un attacco mancato lo consuma comunque).
  readonly colpi: number;
  // Chi lo ha creato (es. l'id di un'abilità): finché dura, lo stesso creatore non può riattivarlo.
  readonly origine?: string;
  // Testi per il registro e il pannello (es. il nome e l'effetto di un'abilità): se ci sono, l'effetto si evidenzia.
  readonly etichettaChiave?: string;
  readonly descrizioneChiave?: string;
  // Se presente, i colpi del giocatore sotto questo effetto sono di questo tipo (es. magico dopo la Concentrazione).
  readonly tipoDanno?: TipoDanno;
}

export function convalidaEffettoScontro(dati: unknown, errori: string[]): EffettoScontro | undefined {
  const o = comeOggetto(dati);
  if (!o) {
    errori.push("effetto: oggetto atteso");
    return undefined;
  }
  const bersaglio = o["bersaglio"];
  if (bersaglio !== "giocatore" && bersaglio !== "nemico") {
    errori.push('effetto: "bersaglio" deve essere "giocatore" o "nemico"');
    return undefined;
  }
  const origine = stringaOpzionale(o, "origine", errori);
  const etichetta = stringaOpzionale(o, "etichettaChiave", errori);
  const descrizione = stringaOpzionale(o, "descrizioneChiave", errori);
  const tipoDanno = stringaOpzionale(o, "tipoDanno", errori);
  if (tipoDanno !== undefined && !(TIPI_DANNO as readonly string[]).includes(tipoDanno)) errori.push(`effetto: tipo di danno sconosciuto "${tipoDanno}"`);
  return {
    bersaglio,
    ...(tipoDanno !== undefined && (TIPI_DANNO as readonly string[]).includes(tipoDanno) ? { tipoDanno: tipoDanno as TipoDanno } : {}),
    ...(origine !== undefined ? { origine } : {}),
    ...(etichetta !== undefined ? { etichettaChiave: etichetta } : {}),
    ...(descrizione !== undefined ? { descrizioneChiave: descrizione } : {}),
    moltiplicatoreDanno: numero(o, "moltiplicatoreDanno", errori, { min: 0, predefinito: 1 }),
    moltiplicatorePrecisione: numero(o, "moltiplicatorePrecisione", errori, { min: 0, predefinito: 1 }),
    deltaPrecisione: numero(o, "deltaPrecisione", errori, { predefinito: 0 }),
    colpi: numero(o, "colpi", errori, { min: 1, predefinito: 1 }),
  };
}

// Potenziamento di uno scontro: HP e forza del nemico moltiplicati (es. la preda di un cacciatore di taglie), con un soprannome da mostrare.
export interface Potenziamento {
  readonly hp: number;
  readonly forza: number;
  readonly soprannomeChiave?: string;
}

export interface ScontroAttivo {
  readonly creaturaId: Id;
  readonly hpNemico: number;
  readonly round: number;
  // Effetti temporanei attivi e usi per scontro (es. abilità "una volta per scontro"): spariscono con lo scontro.
  readonly effetti: readonly EffettoScontro[];
  readonly usi: Readonly<Record<string, number>>;
  // Illustrazione del luogo in cui è iniziato lo scontro (sfondo del combattimento).
  readonly scenaId?: Id;
  // Moltiplicatore di monete ed esperienza della vittoria (es. di notte nel cimitero); se manca vale 1.
  readonly moltiplicatorePremio?: number;
  // Nemico potenziato (HP e forza moltiplicati) e, se ha un nome proprio, il suo soprannome.
  readonly potenziamento?: Potenziamento;
}

// Contatori degli scontri con un tipo di nemico, per la schermata "Statistiche incontri".
// I danni sono quelli effettivi (non conta l'eccedenza oltre gli HP rimasti).
export interface StatisticheNemico {
  readonly incontri: number;
  readonly sconfitti: number;
  readonly morti: number;
  // Duelli non letali persi (es. contro un capogilda): non sono morti, ma contano come sconfitte.
  readonly perse: number;
  readonly fugheRiuscite: number;
  readonly fugheFallite: number;
  readonly dannoInflitto: number;
  readonly dannoSubito: number;
  // Danno inflitto nell'ultimo scontro contro questa creatura (si azzera a ogni nuovo incontro): serve a dire "l'ultima volta gli hai tolto X HP".
  readonly ultimoInflitto: number;
  // Ordine di scoperta (1 = il primo mostro incontrato; 0 per i salvataggi vecchi): serve a mostrare i più recenti nel bestiario.
  readonly ordine: number;
}

export const STATISTICHE_VUOTE: StatisticheNemico = {
  incontri: 0,
  sconfitti: 0,
  morti: 0,
  perse: 0,
  fugheRiuscite: 0,
  fugheFallite: 0,
  dannoInflitto: 0,
  dannoSubito: 0,
  ultimoInflitto: 0,
  ordine: 0,
};

export interface StatoCombattimento {
  readonly scontro: ScontroAttivo | null;
  // Per ogni creatura incontrata (id): i suoi contatori. I salvataggi precedenti non li hanno: partono da zero.
  readonly statistiche: Readonly<Record<Id, StatisticheNemico>>;
  // Impostazioni del combattimento automatico (se mancano valgono: spento, soglia di sicurezza al 35% degli HP).
  readonly automatico?: boolean;
  readonly soglia?: number;
  // Cosa si sta guardando nel bestiario (famiglia, pagina dell'elenco, mostro della scheda): serve alle schermate a più livelli.
  readonly bestiario?: SelezioneBestiario;
}

export interface SelezioneBestiario {
  readonly famiglia: string | null;
  readonly pagina: number;
  readonly mostro: string | null;
}

function convalidaPotenziamento(dati: unknown, errori: string[]): Potenziamento | undefined {
  if (dati === undefined) return undefined;
  const o = comeOggetto(dati);
  if (!o) {
    errori.push('campo "potenziamento": oggetto atteso');
    return undefined;
  }
  const soprannome = stringaOpzionale(o, "soprannomeChiave", errori);
  return { hp: numero(o, "hp", errori, { min: 0.1 }), forza: numero(o, "forza", errori, { min: 0.1 }), ...(soprannome !== undefined ? { soprannomeChiave: soprannome } : {}) };
}

function convalidaSelezione(dati: unknown): SelezioneBestiario {
  const o = comeOggetto(dati);
  return {
    famiglia: typeof o?.["famiglia"] === "string" ? o["famiglia"] : null,
    pagina: typeof o?.["pagina"] === "number" && o["pagina"] >= 0 ? Math.floor(o["pagina"]) : 0,
    mostro: typeof o?.["mostro"] === "string" ? o["mostro"] : null,
  };
}

function convalidaStatisticheNemico(dati: unknown, errori: string[]): StatisticheNemico {
  const o = comeOggetto(dati) ?? {};
  const n = (campo: keyof StatisticheNemico): number => numero(o, campo, errori, { min: 0, predefinito: 0 });
  return {
    incontri: n("incontri"),
    sconfitti: n("sconfitti"),
    morti: n("morti"),
    perse: n("perse"),
    fugheRiuscite: n("fugheRiuscite"),
    fugheFallite: n("fugheFallite"),
    dannoInflitto: n("dannoInflitto"),
    dannoSubito: n("dannoSubito"),
    ultimoInflitto: n("ultimoInflitto"),
    ordine: n("ordine"),
  };
}

function convalidaStatistiche(dati: unknown, errori: string[]): Record<Id, StatisticheNemico> {
  const o = comeOggetto(dati ?? {});
  if (!o) {
    errori.push('campo "statistiche": oggetto atteso');
    return {};
  }
  const risultato: Record<Id, StatisticheNemico> = {};
  for (const [id, valori] of Object.entries(o)) risultato[id] = convalidaStatisticheNemico(valori, errori);
  return risultato;
}

// I salvataggi precedenti non hanno effetti né usi: partono vuoti.
function convalidaEffetti(dati: unknown, errori: string[]): EffettoScontro[] {
  if (dati === undefined) return [];
  if (!Array.isArray(dati)) {
    errori.push('campo "effetti": elenco atteso');
    return [];
  }
  return dati.flatMap((e) => convalidaEffettoScontro(e, errori) ?? []);
}

function convalidaUsi(dati: unknown, errori: string[]): Record<string, number> {
  const o = comeOggetto(dati ?? {});
  if (!o) {
    errori.push('campo "usi": oggetto atteso');
    return {};
  }
  return Object.fromEntries(Object.keys(o).map((k) => [k, numero(o, k, errori, { min: 0 })]));
}

function convalidaStato(dati: unknown): Risultato<StatoCombattimento> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  const statistiche = convalidaStatistiche(o["statistiche"], errori);
  const automatico = booleano(o, "automatico", errori, false);
  const soglia = numero(o, "soglia", errori, { min: 0, max: 90, predefinito: PARAMETRI_COMBATTIMENTO.sogliaSicurezza });
  const bestiario = convalidaSelezione(o["bestiario"]);
  if (o["scontro"] === null) return chiudi(errori, { scontro: null, statistiche, automatico, soglia, bestiario });
  const s = comeOggetto(o["scontro"]);
  if (!s) return fallisci("scontro non valido");
  const scenaId = stringaOpzionale(s, "scenaId", errori);
  const scontro: ScontroAttivo = {
    creaturaId: stringa(s, "creaturaId", errori),
    hpNemico: numero(s, "hpNemico", errori, { min: 0 }),
    round: numero(s, "round", errori, { min: 1 }),
    effetti: convalidaEffetti(s["effetti"], errori),
    usi: convalidaUsi(s["usi"], errori),
    ...(scenaId !== undefined ? { scenaId } : {}),
    ...(s["moltiplicatorePremio"] !== undefined ? { moltiplicatorePremio: numero(s, "moltiplicatorePremio", errori, { min: 0.1 }) } : {}),
    ...(convalidaPotenziamento(s["potenziamento"], errori) ? { potenziamento: convalidaPotenziamento(s["potenziamento"], errori) as Potenziamento } : {}),
  };
  return chiudi(errori, { scontro, statistiche, automatico, soglia, bestiario });
}

export const statoCombattimento = definisciStato<StatoCombattimento>(
  ID_COMBATTIMENTO,
  1,
  () => ({ scontro: null, statistiche: {}, automatico: false, soglia: PARAMETRI_COMBATTIMENTO.sogliaSicurezza, bestiario: { famiglia: null, pagina: 0, mostro: null } }),
  convalidaStato,
);
