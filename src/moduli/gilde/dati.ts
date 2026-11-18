import type { VoceContenuto } from "../../core/indice";

// Una gilda per classe, una per piazza (i luoghi stanno nei dati della città). Ogni gilda ha il suo capogilda,
// che il giocatore deve battere ai livelli chiave: la creatura da affrontare per ciascun livello chiave.
export interface Gilda {
  readonly sito: string;
  readonly classe: string;
  readonly scenaId: string;
  readonly spriteId: string;
  // Livello chiave -> id della creatura (il capogilda di quel livello).
  readonly capogilda: Readonly<Record<number, string>>;
}

export const GILDE: readonly Gilda[] = [
  { sito: "gilda-cavaliere", classe: "cavaliere", scenaId: "scena.gilda.cavaliere", spriteId: "sprite.capogilda.cavaliere", capogilda: { 4: "capogilda-cavaliere-4", 8: "capogilda-cavaliere-8" } },
  { sito: "gilda-mistico", classe: "mistico", scenaId: "scena.gilda.mistico", spriteId: "sprite.capogilda.mistico", capogilda: { 4: "capogilda-mistico-4", 8: "capogilda-mistico-8" } },
  { sito: "gilda-ladro", classe: "ladro", scenaId: "scena.gilda.ladro", spriteId: "sprite.capogilda.ladro", capogilda: { 4: "capogilda-ladro-4", 8: "capogilda-ladro-8" } },
];

// I capigilda sono creature: non si può fuggire, perdere non uccide (si resta a 1 HP) e battere il capogilda è l'unico premio
// (si sale di livello): niente oro né esperienza. Tarati con la simulazione (tests/moduli/bilanciamentoLivelli.test.ts) sull'equipaggiamento
// naturale della classe, a gradini di punti per pezzo (8, 12, 16, 20): il giocatore vince circa il 10%, 40%, 70% e 95% dei duelli (curva graduale).
const capogilda = (id: string, chiave: string, immagineId: string, hp: number, forza: number, difesa: number, velocita: number): VoceContenuto => ({
  tipo: "creatura",
  id,
  dati: { nomeChiave: `gilde.capogilda.${chiave}`, nomeBreveChiave: `gilde.capogilda.${chiave}.breve`, hp, forza, difesa, oro: 0, esperienza: 0, velocita, fugaConsentita: false, nonLetale: true, immagineId },
});

export const CAPIGILDA: readonly VoceContenuto[] = [
  capogilda("capogilda-cavaliere-4", "cavaliere", "sprite.capogilda.cavaliere", 117, 16, 6, 7),
  capogilda("capogilda-mistico-4", "mistico", "sprite.capogilda.mistico", 55, 28, 3, 9),
  capogilda("capogilda-ladro-4", "ladro", "sprite.capogilda.ladro", 48, 27, 3, 14),
  // Livello 8 (0.18.0): valori di partenza, da tarare con la simulazione (circa 70% di vittorie per un personaggio di livello 7 con equipaggiamento di classe 6-7).
  capogilda("capogilda-cavaliere-8", "cavaliere8", "sprite.capogilda.cavaliere8", 105, 29, 14, 7),
  capogilda("capogilda-mistico-8", "mistico8", "sprite.capogilda.mistico8", 72, 31, 6, 10),
  capogilda("capogilda-ladro-8", "ladro8", "sprite.capogilda.ladro8", 86, 29, 6, 16),
];
