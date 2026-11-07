import { TIPI_DANNO } from "./tipi";
import type { TipoDanno } from "./tipi";

// Nomi dei tipi di danno nelle due lingue.
export const NOMI_TIPI: Readonly<Record<"it" | "en", Readonly<Record<TipoDanno, string>>>> = {
  it: { taglio: "taglio", contundente: "contundente", perforante: "perforante", magico: "magico" },
  en: { taglio: "slashing", contundente: "blunt", perforante: "piercing", magico: "magic" },
};

export const chiaveTipo = (tipo: TipoDanno): string => `combattimento.tipo.${tipo}`;

// Chiave di testo di un insieme di tipi ("taglio, perforante"); l'insieme vuoto è "nessuno".
export function chiaveInsiemeTipi(tipi: readonly TipoDanno[]): string {
  return tipi.length === 0 ? "combattimento.natura.nessuno" : `combattimento.natura.${[...tipi].sort().join("+")}`;
}

// Tutti i sottoinsiemi non vuoti dei tipi, per generare i testi (quindi si possono combinare liberamente nei dati).
function sottoinsiemi(): TipoDanno[][] {
  const risultato: TipoDanno[][] = [];
  for (let m = 1; m < 1 << TIPI_DANNO.length; m++) risultato.push(TIPI_DANNO.filter((_, i) => (m & (1 << i)) !== 0));
  return risultato;
}

// Testi generati: nomi dei tipi e di ogni insieme, nelle due lingue.
export function testiNatura(lingua: "it" | "en"): Record<string, string> {
  const testi: Record<string, string> = { "combattimento.natura.nessuno": lingua === "it" ? "nessuno" : "none" };
  for (const t of TIPI_DANNO) testi[chiaveTipo(t)] = NOMI_TIPI[lingua][t];
  for (const insieme of sottoinsiemi()) testi[chiaveInsiemeTipi(insieme)] = [...insieme].sort().map((t) => NOMI_TIPI[lingua][t]).join(", ");
  return testi;
}
