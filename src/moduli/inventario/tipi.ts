import type { Id, Riferimento, Risultato, StatoGioco, TipoContenuto } from "../../core/indice";
import { chiudi, comeOggetto, definisciStato, fallisci, stringa } from "../../core/indice";
import { PARAMETRI_INVENTARIO } from "./parametri";

export const ID_INVENTARIO = "inventario";

// Un oggetto che si può portare nello zaino: i moduli (es. le pozioni) dichiarano i propri come contenuti di questo tipo.
export interface OggettoInventario {
  readonly nomeChiave: string;
  readonly descrizioneChiave: string;
}

export const tipoOggettoInventario: TipoContenuto<OggettoInventario> = {
  nome: "oggettoInventario",
  valida(dati): Risultato<OggettoInventario> {
    const o = comeOggetto(dati);
    if (!o) return fallisci("oggetto atteso");
    const errori: string[] = [];
    return chiudi(errori, { nomeChiave: stringa(o, "nomeChiave", errori), descrizioneChiave: stringa(o, "descrizioneChiave", errori) });
  },
  riferimenti(o): readonly Riferimento[] {
    return [{ categoria: "testo", id: o.nomeChiave }, { categoria: "testo", id: o.descrizioneChiave }];
  },
};

// Gli slot dello zaino: l'id dell'oggetto portato o null se vuoto.
export interface StatoInventario {
  readonly slot: readonly (Id | null)[];
}

function convalidaStato(dati: unknown): Risultato<StatoInventario> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const grezzo = o["slot"];
  if (!Array.isArray(grezzo)) return fallisci('campo "slot": elenco atteso');
  const slot = grezzo.map((v): Id | null => (typeof v === "string" ? v : null));
  return chiudi([], { slot });
}

export const statoInventario = definisciStato<StatoInventario>(
  ID_INVENTARIO,
  1,
  () => ({ slot: Array.from({ length: PARAMETRI_INVENTARIO.slot }, () => null) }),
  convalidaStato,
);

// Gli slot dello zaino, sempre nel numero previsto dai parametri (se il salvataggio ne ha meno si completano con slot vuoti).
export function leggiSlot(stato: StatoGioco): readonly (Id | null)[] {
  const slot = statoInventario.leggi(stato).slot;
  return Array.from({ length: PARAMETRI_INVENTARIO.slot }, (_, i) => slot[i] ?? null);
}
