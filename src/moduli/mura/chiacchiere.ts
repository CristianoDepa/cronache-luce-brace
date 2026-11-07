import type { EventoGioco, Id } from "../../core/indice";
import { PARAMETRI_MURA } from "./parametri";
import type { Presenza } from "./tipi";

// Le chiacchiere della locanda: puro (nessuno stato, nessun I/O). I tiri casuali arrivano già estratti, tutti in [0, 1).

// Probabilità che la locanda non dica niente al tentativo n (1, 2, 3...): dal tentativo oltre la curva vale l'ultimo valore.
export function probabilitaSilenzio(tentativo: number, curva: readonly number[] = PARAMETRI_MURA.chiacchiere.probabilitaSilenzio): number {
  const indice = Math.min(Math.max(tentativo, 1), curva.length) - 1;
  return curva[indice] ?? 1;
}

export interface TiriChiacchiere {
  readonly silenzio: number;
  readonly npc: number;
  readonly esatto: number;
  readonly tipo: number;
}

// Cosa serve sapere di un luogo per costruire un indizio.
export interface InfoSito {
  readonly nomeChiave: string;
  readonly categoria: string;
  readonly direzione?: string;
}

export type Indizio =
  | { readonly tipo: "silenzio" }
  | { readonly tipo: "esatto"; readonly npcId: Id; readonly sito: Id }
  | { readonly tipo: "direzione"; readonly npcId: Id; readonly direzione: string }
  | { readonly tipo: "categoria"; readonly npcId: Id; readonly categoria: string };

const indiceDa = (tiro: number, n: number): number => Math.min(n - 1, Math.floor(tiro * n));

// Sceglie cosa si sente al tentativo n. Silenzio se la locanda tace (con la probabilità della curva) o se non resta nessun NPC
// da indicare (quelli già incontrati oggi sono esclusi). Altrimenti un NPC a caso tra i restanti: indizio esatto (il luogo)
// o "di zona" (la direzione, se il luogo ne ha una, oppure il tipo di luogo).
export function scegliIndizio(
  presenze: readonly Presenza[],
  tentativo: number,
  tiri: TiriChiacchiere,
  info: (sito: Id) => InfoSito | undefined,
): Indizio {
  const candidati = presenze.filter((p) => !p.fatto);
  if (candidati.length === 0 || tiri.silenzio < probabilitaSilenzio(tentativo)) return { tipo: "silenzio" };
  const scelto = candidati[indiceDa(tiri.npc, candidati.length)];
  const luogo = scelto ? info(scelto.sito) : undefined;
  if (!scelto || !luogo) return { tipo: "silenzio" };
  if (tiri.esatto < PARAMETRI_MURA.chiacchiere.probabilitaIndizioEsatto) return { tipo: "esatto", npcId: scelto.npcId, sito: scelto.sito };
  const zone: Indizio[] = [
    ...(luogo.direzione !== undefined ? [{ tipo: "direzione" as const, npcId: scelto.npcId, direzione: luogo.direzione }] : []),
    { tipo: "categoria" as const, npcId: scelto.npcId, categoria: luogo.categoria },
  ];
  return zone[indiceDa(tiri.tipo, zone.length)] ?? { tipo: "silenzio" };
}

export interface Riferimenti {
  readonly nomeNpc: (npcId: Id) => string;
  readonly nomeSito: (sito: Id) => string;
  readonly nomeDirezione: (direzione: string) => string;
}

// L'evento da mostrare per un indizio.
export function eventoIndizio(indizio: Indizio, rif: Riferimenti): EventoGioco {
  switch (indizio.tipo) {
    case "silenzio":
      return { chiave: "mura.chiacchiere.silenzio" };
    case "esatto":
      return { chiave: "mura.chiacchiere.esatto", parametri: { npcChiave: rif.nomeNpc(indizio.npcId), luogoChiave: rif.nomeSito(indizio.sito) } };
    case "direzione":
      return { chiave: "mura.chiacchiere.direzione", parametri: { npcChiave: rif.nomeNpc(indizio.npcId), direzioneChiave: rif.nomeDirezione(indizio.direzione) } };
    case "categoria":
      return { chiave: `mura.chiacchiere.categoria.${indizio.categoria}`, parametri: { npcChiave: rif.nomeNpc(indizio.npcId) } };
  }
}
