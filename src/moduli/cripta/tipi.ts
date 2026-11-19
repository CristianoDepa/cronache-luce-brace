import type { Risultato, StatoGioco } from "../../core/indice";
import { chiudi, comeOggetto, definisciStato, fallisci } from "../../core/indice";
import { oggettoMagicoDaId } from "../oggettimagici/indice";
import { POZIONI } from "../pozioni/indice";
import type { TipoPozione } from "../pozioni/indice";
import { PARAMETRI_CRIPTA } from "./parametri";

export const ID_CRIPTA = "cripta";

// Il bottino raccolto laggiù: sta nella borsa e diventa tuo solo se risali. Morendo (o salvato dalla grazia) la borsa resta nella cripta.
// Dalla 0.25.0 pozioni e oggetti sono già scelti quando li trovi (così la borsa dice cosa c'è): tipi di pozione e id di oggetto magico.
export interface BorsaCripta {
  readonly monete: number;
  readonly pozioni: readonly TipoPozione[];
  readonly oggetti: readonly string[];
}

// La spedizione nella cripta dimenticata (0.24.0).
export interface StatoCripta {
  // La scalinata è stata trovata oggi (si chiude al nuovo giorno o dopo la spedizione).
  readonly aperta: boolean;
  // Sei laggiù: finché dura non puoi spostarti né aprire altre schermate di gioco.
  readonly dentro: boolean;
  // Piano in cui ti trovi (1..profonditaMax); 0 se non sei nella cripta.
  readonly profondita: number;
  readonly borsa: BorsaCripta;
  // Piani dei cui forzieri hai già fatto il tentativo (un solo tentativo per forziere).
  readonly forzieri: readonly number[];
  // Il Guardiano è stato battuto in questa spedizione.
  readonly guardiano: boolean;
  // Le monete in tasca prima dell'ultimo scontro: serve a spostare nella borsa il bottino della vittoria.
  readonly oroPrima: number;
  // La cripta ti ha rigettato al nuovo giorno (la borsa è salva): una riga lo racconta una volta.
  readonly rigettato: boolean;
  // Esplorazioni fatte in ciascun piano (indice = piano - 1): al massimo esplorazioniPerPiano, e almeno una per poter scendere (0.25.0).
  readonly esplorazioni: readonly number[];
  // L'ultima creatura incontrata nel piano in cui sei ("" se nessuna): nello stesso piano non ne escono due uguali di fila.
  readonly ultimaCreatura: string;
}

export const BORSA_VUOTA: BorsaCripta = { monete: 0, pozioni: [], oggetti: [] };
export const ESPLORAZIONI_INIZIALI: readonly number[] = Array.from({ length: PARAMETRI_CRIPTA.profonditaMax }, () => 0);
export const STATO_CRIPTA_INIZIALE: StatoCripta = { aperta: false, dentro: false, profondita: 0, borsa: BORSA_VUOTA, forzieri: [], guardiano: false, oroPrima: 0, rigettato: false, esplorazioni: ESPLORAZIONI_INIZIALI, ultimaCreatura: "" };

const naturale = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);

function convalidaBorsa(dati: unknown): BorsaCripta {
  const o = comeOggetto(dati);
  if (!o) return BORSA_VUOTA;
  const oggetti = Array.isArray(o["oggetti"]) ? o["oggetti"].filter((id): id is string => typeof id === "string" && oggettoMagicoDaId(id) !== undefined) : [];
  const pozioni = Array.isArray(o["pozioni"]) ? o["pozioni"].flatMap((t): TipoPozione[] => POZIONI.filter((p) => p.tipo === t).map((p) => p.tipo)) : [];
  return { monete: naturale(o["monete"]), pozioni, oggetti };
}

function convalidaStato(dati: unknown): Risultato<StatoCripta> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const forzieri = Array.isArray(o["forzieri"]) ? o["forzieri"].filter((n): n is number => typeof n === "number") : [];
  return chiudi([], {
    aperta: o["aperta"] === true,
    dentro: o["dentro"] === true,
    profondita: naturale(o["profondita"]),
    borsa: convalidaBorsa(o["borsa"]),
    forzieri,
    guardiano: o["guardiano"] === true,
    oroPrima: naturale(o["oroPrima"]),
    rigettato: o["rigettato"] === true,
    esplorazioni: ESPLORAZIONI_INIZIALI.map((_, i) => (Array.isArray(o["esplorazioni"]) ? naturale(o["esplorazioni"][i]) : 0)),
    ultimaCreatura: typeof o["ultimaCreatura"] === "string" ? o["ultimaCreatura"] : "",
  });
}

export const statoCripta = definisciStato<StatoCripta>(ID_CRIPTA, 1, () => STATO_CRIPTA_INIZIALE, convalidaStato);

export const siamoNellaCripta = (stato: StatoGioco): boolean => statoCripta.leggi(stato).dentro;
