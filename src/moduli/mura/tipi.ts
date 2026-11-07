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

// Un NPC presente oggi in un luogo; "fatto" è vero se il giocatore ci ha già parlato (una volta al giorno per NPC).
export interface Presenza {
  readonly npcId: Id;
  readonly sito: Id;
  readonly fatto: boolean;
}

export interface StatoMura {
  // Gli NPC di oggi (uno per luogo); vuoto finché non c'è stato un cambio di giorno (vale il primo giorno, vedi presenzeOggi).
  readonly presenze: readonly Presenza[];
  // Tentativi di ascolto delle chiacchiere in locanda fatti oggi (si azzera col giorno).
  readonly chiacchiere: number;
  // Effetti temporanei degli incontri, validi fino al nuovo giorno.
  readonly bonusForza: number;
  readonly bonusDifesa: number;
}

function convalidaPresenza(dati: unknown, errori: string[]): Presenza[] {
  const o = comeOggetto(dati);
  if (!o) {
    errori.push("presenza: oggetto atteso");
    return [];
  }
  return [{ npcId: stringa(o, "npcId", errori), sito: stringa(o, "sito", errori), fatto: booleano(o, "fatto", errori) }];
}

function convalidaStato(dati: unknown): Risultato<StatoMura> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  const grezze = o["presenze"];
  if (grezze !== undefined && !Array.isArray(grezze)) errori.push('campo "presenze": elenco atteso');
  const stato: StatoMura = {
    presenze: Array.isArray(grezze) ? grezze.flatMap((p) => convalidaPresenza(p, errori)) : [],
    chiacchiere: numero(o, "chiacchiere", errori, { min: 0, predefinito: 0 }),
    bonusForza: numero(o, "bonusForza", errori),
    bonusDifesa: numero(o, "bonusDifesa", errori),
  };
  return chiudi(errori, stato);
}

export const statoMura = definisciStato<StatoMura>(
  ID_MURA,
  1,
  () => ({ presenze: [], chiacchiere: 0, bonusForza: 0, bonusDifesa: 0 }),
  convalidaStato,
);
