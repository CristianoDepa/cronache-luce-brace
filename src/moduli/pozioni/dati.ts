import type { VoceContenuto } from "../../core/indice";
import { PARAMETRI_POZIONI } from "./parametri";

export type TipoPozione = "forza" | "destrezza" | "corazza" | "fortuna" | "mana" | "curaLeggera" | "curaRobusta";
export type Statistica = "forza" | "velocita" | "difesa" | "fortuna";

// Una pozione: cosa fa e quanto pesa nel bottino. Il prezzo delle cure dipende dal livello (vedi prezzoPozione).
export interface DefinizionePozione {
  readonly tipo: TipoPozione;
  readonly effetto: { readonly genere: "statistica"; readonly statistica: Statistica } | { readonly genere: "cura"; readonly dadi: number } | { readonly genere: "mana"; readonly dadi: number };
  // Peso nel bottino (probabilità proporzionale).
  readonly pesoBottino: number;
}

// Cure e mana lanciano dadi a sei facce (mana a quattro): "dadi" è il numero di dadi, la faccia sta in FACCE.
export const POZIONI: readonly DefinizionePozione[] = [
  { tipo: "curaLeggera", effetto: { genere: "cura", dadi: 1 }, pesoBottino: 40 },
  { tipo: "curaRobusta", effetto: { genere: "cura", dadi: 2 }, pesoBottino: 15 },
  { tipo: "mana", effetto: { genere: "mana", dadi: 1 }, pesoBottino: 15 },
  { tipo: "forza", effetto: { genere: "statistica", statistica: "forza" }, pesoBottino: 10 },
  { tipo: "destrezza", effetto: { genere: "statistica", statistica: "velocita" }, pesoBottino: 10 },
  { tipo: "corazza", effetto: { genere: "statistica", statistica: "difesa" }, pesoBottino: 10 },
  { tipo: "fortuna", effetto: { genere: "statistica", statistica: "fortuna" }, pesoBottino: 10 },
];

export const FACCE_CURA = 6;
export const FACCE_MANA = 4;

export const idPozione = (tipo: TipoPozione): string => `pozione.${tipo}`;
export const tipoDaId = (id: string): TipoPozione | undefined => POZIONI.find((p) => idPozione(p.tipo) === id)?.tipo;
export const definizione = (tipo: TipoPozione): DefinizionePozione => POZIONI.find((p) => p.tipo === tipo)!;

// Prezzo di una pozione al livello del personaggio. Le cure costano il doppio del Guaritore (livello per HP) a pari HP medi.
export function prezzoPozione(tipo: TipoPozione, livello: number): number {
  const p = definizione(tipo);
  if (p.effetto.genere === "cura") return Math.round(livello * p.effetto.dadi * ((FACCE_CURA + 1) / 2) * PARAMETRI_POZIONI.moltiplicatorePrezzoCura);
  return p.effetto.genere === "mana" ? PARAMETRI_POZIONI.prezzoMana : PARAMETRI_POZIONI.prezzoEffetto;
}

// Il bonus di una pozione di effetto (0 per cure e mana): +2 forza, destrezza e corazza, +5 la fortuna. Un solo posto per i due usi: statistiche e riquadro.
export function bonusPozione(tipo: TipoPozione): number {
  const e = definizione(tipo).effetto;
  if (e.genere !== "statistica") return 0;
  return e.statistica === "fortuna" ? PARAMETRI_POZIONI.bonusFortuna : PARAMETRI_POZIONI.bonusEffetto;
}

// Le pozioni sono oggetti dello zaino: nome e descrizione nei testi.
export const OGGETTI_POZIONI: readonly VoceContenuto[] = POZIONI.map((p) => ({
  tipo: "oggettoInventario",
  id: idPozione(p.tipo),
  dati: { nomeChiave: `pozioni.nome.${p.tipo}`, descrizioneChiave: `pozioni.descrizione.${p.tipo}` },
}));
