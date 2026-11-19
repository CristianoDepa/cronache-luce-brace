import type { VoceContenuto } from "../../core/indice";
import { PARAMETRI_POZIONI } from "./parametri";

export type TipoPozione = "forza" | "destrezza" | "corazza" | "fortuna" | "mana" | "curaLeggera" | "curaRobusta" | "antidoto";
export type Statistica = "forza" | "velocita" | "difesa" | "fortuna";

// Una pozione: cosa fa e quanto pesa nel bottino. Il prezzo delle cure dipende dal livello (vedi prezzoPozione).
export interface DefinizionePozione {
  readonly tipo: TipoPozione;
  readonly effetto: { readonly genere: "statistica"; readonly statistica: Statistica } | { readonly genere: "cura"; readonly dadi: number; readonly facce: number; readonly perLivello: number } | { readonly genere: "mana"; readonly dadi: number } | { readonly genere: "antidoto" };
  // Peso nel bottino (probabilità proporzionale).
  readonly pesoBottino: number;
}

// Le cure (0.25.0) lanciano "dadi" dadi a "facce" facce più "perLivello" HP per ogni livello del personaggio (leggera 1d6 + 1 per livello,
// robusta 1d8 + 2 per livello); il mana lancia dadi a quattro facce (FACCE_MANA).
export const POZIONI: readonly DefinizionePozione[] = [
  { tipo: "curaLeggera", effetto: { genere: "cura", dadi: 1, facce: 6, perLivello: 1 }, pesoBottino: 40 },
  { tipo: "curaRobusta", effetto: { genere: "cura", dadi: 1, facce: 8, perLivello: 2 }, pesoBottino: 15 },
  { tipo: "mana", effetto: { genere: "mana", dadi: 1 }, pesoBottino: 15 },
  { tipo: "forza", effetto: { genere: "statistica", statistica: "forza" }, pesoBottino: 10 },
  { tipo: "destrezza", effetto: { genere: "statistica", statistica: "velocita" }, pesoBottino: 10 },
  { tipo: "corazza", effetto: { genere: "statistica", statistica: "difesa" }, pesoBottino: 10 },
  { tipo: "fortuna", effetto: { genere: "statistica", statistica: "fortuna" }, pesoBottino: 10 },
  // L'antidoto (0.23.0) cura il veleno: lo Speziale lo vende sempre (non è una delle pozioni a caso del giorno) e non si trova nel bottino.
  { tipo: "antidoto", effetto: { genere: "antidoto" }, pesoBottino: 0 },
];

export const FACCE_MANA = 4;

export const idPozione = (tipo: TipoPozione): string => `pozione.${tipo}`;
export const tipoDaId = (id: string): TipoPozione | undefined => POZIONI.find((p) => idPozione(p.tipo) === id)?.tipo;
export const definizione = (tipo: TipoPozione): DefinizionePozione => POZIONI.find((p) => p.tipo === tipo)!;

// Cura media di una pozione di cura a un dato livello del personaggio (dadi medi + bonus per livello).
export function curaMedia(tipo: TipoPozione, livello: number): number {
  const e = definizione(tipo).effetto;
  if (e.genere !== "cura") return 0;
  return e.dadi * ((e.facce + 1) / 2) + e.perLivello * livello;
}

// Arrotonda per eccesso al multiplo indicato (monete).
const arrotondaSu = (valore: number, passo: number): number => Math.ceil(valore / passo - 1e-9) * passo;

// Prezzo di una pozione al livello del personaggio. Le cure (0.25.0) costano moltiplicatorePrezzoCura volte quello che chiederebbe il Guaritore
// (livello per HP) a pari cura media, arrotondate per eccesso alle 5 monete e con un tetto per tipo (250 la leggera, 450 la robusta, raggiunto al livello 11).
export function prezzoPozione(tipo: TipoPozione, livello: number): number {
  const p = definizione(tipo);
  if (p.effetto.genere === "cura") {
    const calcolato = arrotondaSu(PARAMETRI_POZIONI.moltiplicatorePrezzoCura * livello * curaMedia(tipo, livello), PARAMETRI_POZIONI.arrotondamentoPrezzoCura);
    return Math.min(calcolato, PARAMETRI_POZIONI.tettoPrezzoCura[tipo === "curaRobusta" ? "curaRobusta" : "curaLeggera"]);
  }
  if (p.effetto.genere === "antidoto") return PARAMETRI_POZIONI.prezzoAntidoto;
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
