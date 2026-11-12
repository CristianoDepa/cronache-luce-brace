import type { Risultato } from "../../core/indice";
import { chiudi, comeOggetto, definisciStato, fallisci } from "../../core/indice";
import { amuletoDaId } from "./dati";

export const ID_AMULETI = "amuleti";

// L'amuleto indossato (uno solo alla volta): l'id dell'oggetto, o null.
export interface StatoAmuleti {
  readonly indossato: string | null;
}

function convalidaStato(dati: unknown): Risultato<StatoAmuleti> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const id = o["indossato"];
  if (id === null || id === undefined) return chiudi([], { indossato: null });
  return typeof id === "string" && amuletoDaId(id) !== undefined ? chiudi([], { indossato: id }) : fallisci("amuleto non valido");
}

export const statoAmuleti = definisciStato<StatoAmuleti>(ID_AMULETI, 1, () => ({ indossato: null }), convalidaStato);
