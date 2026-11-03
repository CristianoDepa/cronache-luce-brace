import type { Id, Riferimento, Risultato, TipoContenuto } from "../../core/indice";
import { booleano, chiudi, comeOggetto, definisciStato, fallisci, numero, ok, stringa, stringaOpzionale } from "../../core/indice";

export const ID_COMBATTIMENTO = "combattimento";

export interface Creatura {
  readonly nomeChiave: string;
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
    };
    return chiudi(errori, creatura);
  },
  riferimenti(c): readonly Riferimento[] {
    const base: Riferimento[] = [{ categoria: "testo", id: c.nomeChiave }];
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

export interface StatoCombattimento {
  readonly scontro: ScontroAttivo | null;
}

function convalidaStato(dati: unknown): Risultato<StatoCombattimento> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  if (o["scontro"] === null) return ok({ scontro: null });
  const s = comeOggetto(o["scontro"]);
  if (!s) return fallisci("scontro non valido");
  const errori: string[] = [];
  const scenaId = stringaOpzionale(s, "scenaId", errori);
  const scontro: ScontroAttivo = {
    creaturaId: stringa(s, "creaturaId", errori),
    hpNemico: numero(s, "hpNemico", errori, { min: 0 }),
    round: numero(s, "round", errori, { min: 1 }),
    ...(scenaId !== undefined ? { scenaId } : {}),
  };
  return chiudi(errori, { scontro });
}

export const statoCombattimento = definisciStato<StatoCombattimento>(
  ID_COMBATTIMENTO,
  1,
  () => ({ scontro: null }),
  convalidaStato,
);
