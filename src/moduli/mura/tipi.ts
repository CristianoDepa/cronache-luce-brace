import type { Id, Riferimento, Risultato, TipoContenuto } from "../../core/indice";
import { booleano, chiudi, comeOggetto, definisciStato, fallisci, numero, stringa } from "../../core/indice";

export const ID_MURA = "mura";

export type TipoEffetto = "oro" | "hp" | "esperienza" | "forzaTemp" | "difesaTemp";
const TIPI_EFFETTO: readonly string[] = ["oro", "hp", "esperienza", "forzaTemp", "difesaTemp"];

export interface EffettoIncontro {
  readonly tipo: TipoEffetto;
  readonly valore: number;
}

export interface Incontro {
  readonly testoChiave: string;
  readonly tono?: "positivo" | "negativo";
  readonly effetti: readonly EffettoIncontro[];
}

// Un NPC delle mura: nome, descrizione, disegno e i suoi incontri possibili.
export interface Npc {
  readonly nomeChiave: string;
  readonly descrizioneChiave: string;
  readonly immagineId: string;
  readonly incontri: readonly Incontro[];
}

function convalidaEffetto(dati: unknown, errori: string[]): EffettoIncontro[] {
  const o = comeOggetto(dati);
  const tipo = o?.["tipo"];
  const valore = o?.["valore"];
  if (!o || typeof tipo !== "string" || !TIPI_EFFETTO.includes(tipo) || typeof valore !== "number") {
    errori.push(`effetto non valido (tipi ammessi: ${TIPI_EFFETTO.join(", ")})`);
    return [];
  }
  return [{ tipo: tipo as TipoEffetto, valore }];
}

function convalidaIncontro(dati: unknown, errori: string[]): Incontro[] {
  const o = comeOggetto(dati);
  if (!o) {
    errori.push("incontro: oggetto atteso");
    return [];
  }
  const effetti = Array.isArray(o["effetti"]) ? o["effetti"].flatMap((e) => convalidaEffetto(e, errori)) : [];
  if (!Array.isArray(o["effetti"])) errori.push('incontro: campo "effetti" atteso');
  const tono = o["tono"];
  return [
    {
      testoChiave: stringa(o, "testoChiave", errori),
      ...(tono === "positivo" || tono === "negativo" ? { tono } : {}),
      effetti,
    },
  ];
}

export const tipoNpc: TipoContenuto<Npc> = {
  nome: "npc",
  valida(dati): Risultato<Npc> {
    const o = comeOggetto(dati);
    if (!o) return fallisci("oggetto atteso");
    const errori: string[] = [];
    const grezzi = Array.isArray(o["incontri"]) ? o["incontri"] : [];
    if (grezzi.length === 0) errori.push('campo "incontri": elenco non vuoto atteso');
    const npc: Npc = {
      nomeChiave: stringa(o, "nomeChiave", errori),
      descrizioneChiave: stringa(o, "descrizioneChiave", errori),
      immagineId: stringa(o, "immagineId", errori),
      incontri: grezzi.flatMap((i) => convalidaIncontro(i, errori)),
    };
    return chiudi(errori, npc);
  },
  riferimenti(n): readonly Riferimento[] {
    return [
      { categoria: "testo", id: n.nomeChiave },
      { categoria: "testo", id: n.descrizioneChiave },
      { categoria: "contenuto", tipo: "illustrazione", id: n.immagineId },
      ...n.incontri.map((i): Riferimento => ({ categoria: "testo", id: i.testoChiave })),
    ];
  },
};

export interface StatoMura {
  // NPC di oggi; null finché non è avvenuto il primo cambio di giorno (vale il primo dell'elenco).
  readonly npcId: Id | null;
  readonly incontroFatto: boolean;
  // Effetti temporanei degli incontri, validi fino al nuovo giorno.
  readonly bonusForza: number;
  readonly bonusDifesa: number;
}

function convalidaStato(dati: unknown): Risultato<StatoMura> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  const npcId = o["npcId"];
  if (npcId !== null && typeof npcId !== "string") errori.push('campo "npcId": stringa o null atteso');
  const stato: StatoMura = {
    npcId: typeof npcId === "string" ? npcId : null,
    incontroFatto: booleano(o, "incontroFatto", errori),
    bonusForza: numero(o, "bonusForza", errori),
    bonusDifesa: numero(o, "bonusDifesa", errori),
  };
  return chiudi(errori, stato);
}

export const statoMura = definisciStato<StatoMura>(
  ID_MURA,
  1,
  () => ({ npcId: null, incontroFatto: false, bonusForza: 0, bonusDifesa: 0 }),
  convalidaStato,
);
