import type { Id, Riferimento, Risultato, TipoContenuto } from "../../core/indice";
import { booleano, chiudi, comeOggetto, definisciStato, fallisci, numero, ok, stringa, stringaOpzionale } from "../../core/indice";

export const ID_COMBATTIMENTO = "combattimento";

export interface Creatura {
  readonly nomeChiave: string;
  // Nome senza articolo, per le tabelle (es. "Ratto gigante"); se manca si usa nomeChiave.
  readonly nomeBreveChiave?: string;
  readonly hp: number;
  readonly forza: number;
  readonly difesa: number;
  readonly oro: number;
  readonly esperienza: number;
  readonly fugaConsentita: boolean;
  // Id dell'illustrazione della creatura.
  readonly immagineId?: string;
  // Se presente, la creatura esiste solo mentre l'evento di calendario è attivo.
  readonly evento?: Id;
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
    const creatura: Creatura = {
      nomeChiave: stringa(o, "nomeChiave", errori),
      hp: numero(o, "hp", errori, { min: 1 }),
      forza: numero(o, "forza", errori, { min: 0 }),
      difesa: numero(o, "difesa", errori, { min: 0 }),
      oro: numero(o, "oro", errori, { min: 0 }),
      esperienza: numero(o, "esperienza", errori, { min: 0 }),
      fugaConsentita: booleano(o, "fugaConsentita", errori, true),
      ...(evento !== undefined ? { evento } : {}),
      ...(immagineId !== undefined ? { immagineId } : {}),
      ...(nomeBreveChiave !== undefined ? { nomeBreveChiave } : {}),
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

export interface ScontroAttivo {
  readonly creaturaId: Id;
  readonly hpNemico: number;
  readonly round: number;
  // Illustrazione del luogo in cui è iniziato lo scontro (sfondo del combattimento).
  readonly scenaId?: Id;
}

// Contatori degli scontri con un tipo di nemico, per la schermata "Statistiche incontri".
// I danni sono quelli effettivi (non conta l'eccedenza oltre gli HP rimasti).
export interface StatisticheNemico {
  readonly incontri: number;
  readonly sconfitti: number;
  readonly morti: number;
  readonly fugheRiuscite: number;
  readonly fugheFallite: number;
  readonly dannoInflitto: number;
  readonly dannoSubito: number;
}

export const STATISTICHE_VUOTE: StatisticheNemico = {
  incontri: 0,
  sconfitti: 0,
  morti: 0,
  fugheRiuscite: 0,
  fugheFallite: 0,
  dannoInflitto: 0,
  dannoSubito: 0,
};

export interface StatoCombattimento {
  readonly scontro: ScontroAttivo | null;
  // Per ogni creatura incontrata (id): i suoi contatori. I salvataggi precedenti non li hanno: partono da zero.
  readonly statistiche: Readonly<Record<Id, StatisticheNemico>>;
}

function convalidaStatisticheNemico(dati: unknown, errori: string[]): StatisticheNemico {
  const o = comeOggetto(dati) ?? {};
  const n = (campo: keyof StatisticheNemico): number => numero(o, campo, errori, { min: 0, predefinito: 0 });
  return {
    incontri: n("incontri"),
    sconfitti: n("sconfitti"),
    morti: n("morti"),
    fugheRiuscite: n("fugheRiuscite"),
    fugheFallite: n("fugheFallite"),
    dannoInflitto: n("dannoInflitto"),
    dannoSubito: n("dannoSubito"),
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

function convalidaStato(dati: unknown): Risultato<StatoCombattimento> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  const statistiche = convalidaStatistiche(o["statistiche"], errori);
  if (o["scontro"] === null) return chiudi(errori, { scontro: null, statistiche });
  const s = comeOggetto(o["scontro"]);
  if (!s) return fallisci("scontro non valido");
  const scenaId = stringaOpzionale(s, "scenaId", errori);
  const scontro: ScontroAttivo = {
    creaturaId: stringa(s, "creaturaId", errori),
    hpNemico: numero(s, "hpNemico", errori, { min: 0 }),
    round: numero(s, "round", errori, { min: 1 }),
    ...(scenaId !== undefined ? { scenaId } : {}),
  };
  return chiudi(errori, { scontro, statistiche });
}

export const statoCombattimento = definisciStato<StatoCombattimento>(
  ID_COMBATTIMENTO,
  1,
  () => ({ scontro: null, statistiche: {} }),
  convalidaStato,
);
