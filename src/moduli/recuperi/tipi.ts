import type { Risultato } from "../../core/indice";
import { chiudi, comeOggetto, definisciStato, fallisci, numero, stringa } from "../../core/indice";
import { NUMERO_STORIE, OGGETTI_RECUPERI } from "./dati";

export const ID_RECUPERI = "recuperi";

// Una missione accettata: l'oggetto da cercare, il prezzo fissato all'accettazione, se l'hai già trovato e se l'hai accettata in un giorno di mercato
// (serve al bonus per la consegna di entrambi gli oggetti).
export interface MissioneRecupero {
  readonly oggettoId: string;
  readonly prezzo: number;
  readonly trovato: boolean;
  readonly mercato: boolean;
  // Offerta rara: ritrovamento all'1%, compenso triplo.
  readonly raro: boolean;
}

// Gli oggetti già consegnati nel giorno indicato (il giorno è il seme di offerte.ts): contano nel limite giornaliero e non si riofferono.
export interface ConsegnatiDelGiorno {
  readonly giorno: number;
  readonly ids: readonly string[];
}

// Le chiacchiere con il mercante: il giorno dell'ultima (seme di offerte.ts) e le storie già raccontate nel giro in corso.
export interface ChiacchiereMercante {
  readonly giorno: number;
  readonly raccontate: readonly number[];
}

export interface StatoRecuperi {
  readonly missioni: readonly MissioneRecupero[];
  readonly consegnati: ConsegnatiDelGiorno;
  // Fiducia e registro: totale degli oggetti consegnati, spunte del giro in corso (si azzerano dopo il premio),
  // nomi già scoperti (restano per sempre) e numero di premi del registro già ritirati (ogni giro completo ne vale uno).
  readonly consegneTotali: number;
  readonly registro: readonly string[];
  readonly scoperti: readonly string[];
  readonly premiRegistro: number;
  readonly chiacchiere: ChiacchiereMercante;
  // Comando di prova: forza il giorno di mercato.
  readonly mercatoProva: boolean;
}

function convalidaStato(dati: unknown): Risultato<StatoRecuperi> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  const grezze = Array.isArray(o["missioni"]) ? (o["missioni"] as unknown[]) : [];
  const missioni: MissioneRecupero[] = [];
  for (const g of grezze) {
    const m = comeOggetto(g);
    if (!m) continue;
    const oggettoId = stringa(m, "oggettoId", errori);
    if (!OGGETTI_RECUPERI.some((x) => x.id === oggettoId)) { errori.push(`oggetto sconosciuto "${oggettoId}"`); continue; }
    missioni.push({ oggettoId, prezzo: numero(m, "prezzo", errori, { min: 0 }), trovato: m["trovato"] === true, mercato: m["mercato"] === true, raro: m["raro"] === true });
  }
  const c = comeOggetto(o["consegnati"]);
  const ids = Array.isArray(c?.["ids"]) ? (c["ids"] as unknown[]).filter((x): x is string => typeof x === "string" && OGGETTI_RECUPERI.some((g) => g.id === x)) : [];
  const giorno = typeof c?.["giorno"] === "number" ? c["giorno"] : 0;
  const ch = comeOggetto(o["chiacchiere"]);
  const raccontate = Array.isArray(ch?.["raccontate"]) ? (ch["raccontate"] as unknown[]).filter((x): x is number => Number.isInteger(x) && (x as number) >= 0 && (x as number) < NUMERO_STORIE) : [];
  const registro = Array.isArray(o["registro"]) ? (o["registro"] as unknown[]).filter((x): x is string => typeof x === "string" && OGGETTI_RECUPERI.some((g) => g.id === x)) : [];
  const scoperti = Array.isArray(o["scoperti"]) ? (o["scoperti"] as unknown[]).filter((x): x is string => typeof x === "string" && OGGETTI_RECUPERI.some((g) => g.id === x)) : [];
  const premiRegistro = typeof o["premiRegistro"] === "number" && o["premiRegistro"] >= 0 ? Math.floor(o["premiRegistro"]) : 0;
  const consegneTotali = typeof o["consegneTotali"] === "number" && o["consegneTotali"] >= 0 ? Math.floor(o["consegneTotali"]) : 0;
  return chiudi(errori, {
    missioni,
    consegnati: { giorno, ids },
    consegneTotali,
    registro,
    scoperti: [...new Set([...scoperti, ...registro])],
    premiRegistro,
    chiacchiere: { giorno: typeof ch?.["giorno"] === "number" ? ch["giorno"] : 0, raccontate },
    mercatoProva: o["mercatoProva"] === true,
  });
}

export const statoRecuperi = definisciStato<StatoRecuperi>(ID_RECUPERI, 1, () => ({ missioni: [], consegnati: { giorno: 0, ids: [] }, consegneTotali: 0, registro: [], scoperti: [], premiRegistro: 0, chiacchiere: { giorno: 0, raccontate: [] }, mercatoProva: false }), convalidaStato);
