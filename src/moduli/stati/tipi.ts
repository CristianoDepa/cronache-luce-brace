import type { Risultato, StatoGioco } from "../../core/indice";
import { chiudi, comeOggetto, definisciStato, fallisci } from "../../core/indice";
import { DURATA, pattoPerId } from "./dati";
import type { TipoStato } from "./dati";

export const ID_STATI = "stati";

// Veleno e paura: le azioni che restano (0 = non c'è). Il patto è quello stretto con il Diavolo (null = nessuno), permanente.
export interface StatoStati {
  readonly veleno: number;
  readonly paura: number;
  readonly patto: string | null;
}

const VUOTO: StatoStati = { veleno: 0, paura: 0, patto: null };
const durata = (v: unknown): number => (typeof v === "number" && v > 0 ? Math.floor(v) : 0);

function convalidaStato(dati: unknown): Risultato<StatoStati> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const patto = typeof o["patto"] === "string" && pattoPerId(o["patto"]) !== undefined ? o["patto"] : null;
  return chiudi([], { veleno: durata(o["veleno"]), paura: durata(o["paura"]), patto });
}

export const statoStati = definisciStato<StatoStati>(ID_STATI, 1, () => VUOTO, convalidaStato);

export const azioniResidue = (stato: StatoGioco, tipo: TipoStato): number => statoStati.leggi(stato)[tipo];
export const èAvvelenato = (stato: StatoGioco): boolean => azioniResidue(stato, "veleno") > 0;
export const èSpaventato = (stato: StatoGioco): boolean => azioniResidue(stato, "paura") > 0;

// Infligge uno stato: se c'è già, la durata si rinnova (non si somma).
export const infliggiStato = (stato: StatoGioco, tipo: TipoStato): StatoGioco => statoStati.scrivi(stato, { ...statoStati.leggi(stato), [tipo]: DURATA[tipo] });

// Toglie uno o tutti gli stati (un rimedio, un riposo).
export function curaStati(stato: StatoGioco, quali: readonly TipoStato[] = ["veleno", "paura"]): StatoGioco {
  const corrente = statoStati.leggi(stato);
  return statoStati.scrivi(stato, { ...corrente, ...Object.fromEntries(quali.map((q) => [q, 0])) });
}

export const stringiPatto = (stato: StatoGioco, id: string): StatoGioco => statoStati.scrivi(stato, { ...statoStati.leggi(stato), patto: id });
export const pattoStretto = (stato: StatoGioco): string | null => statoStati.leggi(stato).patto;
