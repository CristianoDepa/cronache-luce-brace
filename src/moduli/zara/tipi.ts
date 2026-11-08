import type { Risultato } from "../../core/indice";
import { chiudi, comeOggetto, definisciStato, fallisci } from "../../core/indice";
import { PARAMETRI_ZARA } from "./parametri";

export const ID_ZARA = "zara";

export interface StatoZara {
  // Quale puntata è scelta (0 = piccola, 1 = media, 2 = grossa).
  readonly puntata: number;
  // Gli ultimi dadi tirati (vuoto se non si è ancora giocato): servono a disegnarli sul tavolo.
  readonly tiro: readonly number[];
}

function convalidaStato(dati: unknown): Risultato<StatoZara> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const p = typeof o["puntata"] === "number" ? Math.floor(o["puntata"]) : 0;
  const grezzo = Array.isArray(o["tiro"]) ? o["tiro"] : [];
  const tiro = grezzo.length === PARAMETRI_ZARA.dadi && grezzo.every((d) => typeof d === "number" && d >= 1 && d <= 6) ? (grezzo as number[]) : [];
  return chiudi([], { puntata: p >= 0 && p < PARAMETRI_ZARA.puntate.length ? p : 0, tiro });
}

export const statoZara = definisciStato<StatoZara>(ID_ZARA, 1, () => ({ puntata: 0, tiro: [] }), convalidaStato);
