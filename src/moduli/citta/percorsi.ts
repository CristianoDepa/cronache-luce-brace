import type { Id } from "../../core/indice";
import type { Sito } from "./tipi";

// Collegamenti in entrambi i sensi: dalla lista di siti al grafo "da -> [(verso, distanza)]".
export function costruisciGrafo(siti: readonly { readonly id: Id; readonly dati: Sito }[]): ReadonlyMap<Id, readonly { verso: Id; distanza: number }[]> {
  const grafo = new Map<Id, { verso: Id; distanza: number }[]>();
  const aggiungi = (da: Id, verso: Id, distanza: number): void => {
    const lista = grafo.get(da) ?? [];
    lista.push({ verso, distanza });
    grafo.set(da, lista);
  };
  for (const { id, dati } of siti) {
    if (!grafo.has(id)) grafo.set(id, []);
    for (const c of dati.collegamenti) {
      aggiungi(id, c.verso, c.distanza);
      aggiungi(c.verso, id, c.distanza);
    }
  }
  return grafo;
}

// Distanza (in movimenti) del percorso più breve da "da" a ogni luogo raggiungibile. Puro: nessuno stato, nessun I/O.
export function distanzeDa(grafo: ReadonlyMap<Id, readonly { verso: Id; distanza: number }[]>, da: Id): Map<Id, number> {
  const distanze = new Map<Id, number>([[da, 0]]);
  const daVisitare = new Set<Id>([da]);
  while (daVisitare.size > 0) {
    let corrente: Id | undefined;
    for (const id of daVisitare) if (corrente === undefined || (distanze.get(id) ?? Infinity) < (distanze.get(corrente) ?? Infinity)) corrente = id;
    if (corrente === undefined) break;
    daVisitare.delete(corrente);
    const base = distanze.get(corrente) ?? 0;
    for (const { verso, distanza } of grafo.get(corrente) ?? []) {
      if (base + distanza < (distanze.get(verso) ?? Infinity)) {
        distanze.set(verso, base + distanza);
        daVisitare.add(verso);
      }
    }
  }
  return distanze;
}

// Costo di un viaggio in azioni: ogni "perAzione" movimenti (compreso il resto accumulato) consumano un'azione.
export function calcolaCostoViaggio(accumulati: number, distanza: number, perAzione: number): { readonly azioni: number; readonly resto: number } {
  const totale = accumulati + distanza;
  const azioni = Math.floor(totale / perAzione);
  return { azioni, resto: totale - azioni * perAzione };
}
