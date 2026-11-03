import type { Risultato, Riferimento, TipoContenuto } from "../../core/indice";
import { chiudi, comeOggetto, elencoStringhe, fallisci, stringa, stringaOpzionale } from "../../core/indice";

export const ID_LUOGHI = "luoghi";

// Un luogo è puro dato: nome, azioni disponibili e creature che vi si incontrano.
export interface Luogo {
  readonly nomeChiave: string;
  readonly azioni: readonly string[];
  readonly creature: readonly string[];
  // Id dell'illustrazione che rappresenta il luogo.
  readonly scenaId?: string;
}

export const tipoLuogo: TipoContenuto<Luogo> = {
  nome: "luogo",
  valida(dati): Risultato<Luogo> {
    const o = comeOggetto(dati);
    if (!o) return fallisci("oggetto atteso");
    const errori: string[] = [];
    const scenaId = stringaOpzionale(o, "scenaId", errori);
    const luogo: Luogo = {
      nomeChiave: stringa(o, "nomeChiave", errori),
      azioni: elencoStringhe(o, "azioni", errori),
      creature: elencoStringhe(o, "creature", errori),
      ...(scenaId !== undefined ? { scenaId } : {}),
    };
    return chiudi(errori, luogo);
  },
  riferimenti(l): readonly Riferimento[] {
    const scena: Riferimento[] = l.scenaId !== undefined ? [{ categoria: "contenuto", tipo: "illustrazione", id: l.scenaId }] : [];
    return [
      ...scena,
      { categoria: "testo", id: l.nomeChiave },
      ...l.azioni.map((id): Riferimento => ({ categoria: "azione", id })),
      ...l.creature.map((id): Riferimento => ({ categoria: "contenuto", tipo: "creatura", id })),
    ];
  },
};
