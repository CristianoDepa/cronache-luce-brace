import type { Id } from "../../core/indice";
import type { Presenza } from "./tipi";

// Scelta casuale senza ripetizioni di "quanti" elementi (mescolamento parziale). "intero(max)" restituisce un intero in [0, max].
function scegliSenzaRipetizioni<T>(elenco: readonly T[], quanti: number, intero: (max: number) => number): T[] {
  const copia = [...elenco];
  const n = Math.min(quanti, copia.length);
  for (let i = 0; i < n; i++) {
    const j = i + intero(copia.length - 1 - i);
    const a = copia[i];
    const b = copia[j];
    if (a !== undefined && b !== undefined) {
      copia[i] = b;
      copia[j] = a;
    }
  }
  return copia.slice(0, n);
}

// I NPC di un giorno: "quanti" NPC a caso, ciascuno in un luogo diverso scelto a caso tra quelli che li ospitano.
export function scegliPresenze(npc: readonly Id[], siti: readonly Id[], quanti: number, intero: (max: number) => number): Presenza[] {
  const scelti = scegliSenzaRipetizioni(npc, quanti, intero);
  const luoghi = scegliSenzaRipetizioni(siti, scelti.length, intero);
  return scelti.flatMap((npcId, i): Presenza[] => {
    const sito = luoghi[i];
    return sito === undefined ? [] : [{ npcId, sito, fatto: false }];
  });
}

// Le presenze del primo giorno (prima di qualsiasi cambio di giorno): i primi NPC dell'elenco nei luoghi indicati.
export function presenzePrimoGiorno(npc: readonly Id[], luoghiPrimoGiorno: readonly Id[], ospitanti: readonly Id[]): Presenza[] {
  const validi = luoghiPrimoGiorno.filter((s) => ospitanti.includes(s));
  return validi.flatMap((sito, i): Presenza[] => {
    const npcId = npc[i];
    return npcId === undefined ? [] : [{ npcId, sito, fatto: false }];
  });
}
