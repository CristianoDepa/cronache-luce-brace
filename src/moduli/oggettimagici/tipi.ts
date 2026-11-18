import type { Risultato } from "../../core/indice";
import { chiudi, comeOggetto, definisciStato, fallisci } from "../../core/indice";
import type { SlotMagico } from "./dati";
import { oggettoMagicoDaId } from "./dati";

export const ID_OGGETTI_MAGICI = "oggettiMagici";

// Gli oggetti magici indossati (uno per slot): l'id dell'oggetto, o null.
export interface StatoOggettiMagici {
  readonly medaglione: string | null;
  readonly anello: string | null;
}

// Legge uno slot: assente o null = vuoto; altrimenti deve essere un oggetto magico di quello slot.
function leggiSlotIndossato(o: Readonly<Record<string, unknown>>, slot: SlotMagico): Risultato<string | null> {
  const id = o[slot];
  if (id === null || id === undefined) return chiudi([], null);
  return typeof id === "string" && oggettoMagicoDaId(id)?.slot === slot ? chiudi([], id) : fallisci(`${slot} non valido`);
}

function convalidaStato(dati: unknown): Risultato<StatoOggettiMagici> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const medaglione = leggiSlotIndossato(o, "medaglione");
  const anello = leggiSlotIndossato(o, "anello");
  if (!medaglione.ok) return medaglione;
  if (!anello.ok) return anello;
  return chiudi([], { medaglione: medaglione.valore, anello: anello.valore });
}

export const statoOggettiMagici = definisciStato<StatoOggettiMagici>(ID_OGGETTI_MAGICI, 1, () => ({ medaglione: null, anello: null }), convalidaStato);
