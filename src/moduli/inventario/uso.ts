import type { Id, StatoGioco } from "../../core/indice";
import { leggiSlot, statoInventario } from "./tipi";

// Mette un oggetto nel primo slot libero. Restituisce undefined se lo zaino è pieno.
export function aggiungiOggetto(stato: StatoGioco, oggettoId: Id): StatoGioco | undefined {
  const slot = [...leggiSlot(stato)];
  const libero = slot.indexOf(null);
  if (libero < 0) return undefined;
  slot[libero] = oggettoId;
  return statoInventario.scrivi(stato, { slot });
}

// Toglie l'oggetto da uno slot (posizione da 0).
export function rimuoviOggetto(stato: StatoGioco, posizione: number): StatoGioco {
  const slot = [...leggiSlot(stato)];
  slot[posizione] = null;
  return statoInventario.scrivi(stato, { slot });
}

export function oggettoInSlot(stato: StatoGioco, posizione: number): Id | null {
  return leggiSlot(stato)[posizione] ?? null;
}

export function slotLiberi(stato: StatoGioco): number {
  return leggiSlot(stato).filter((s) => s === null).length;
}
