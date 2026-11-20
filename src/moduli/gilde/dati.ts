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
  { sito: "gilda-cavaliere", classe: "cavaliere", scenaId: "scena.gilda.cavaliere", spriteId: "sprite.capogilda.cavaliere", capogilda: { 4: "capogilda-cavaliere-4", 8: "capogilda-cavaliere-8", 12: "capogilda-cavaliere-12", 16: "capogilda-cavaliere-16", 20: "capogilda-cavaliere-20" } },
  { sito: "gilda-mistico", classe: "mistico", scenaId: "scena.gilda.mistico", spriteId: "sprite.capogilda.mistico", capogilda: { 4: "capogilda-mistico-4", 8: "capogilda-mistico-8", 12: "capogilda-mistico-12", 16: "capogilda-mistico-16", 20: "capogilda-mistico-20" } },
  { sito: "gilda-ladro", classe: "ladro", scenaId: "scena.gilda.ladro", spriteId: "sprite.capogilda.ladro", capogilda: { 4: "capogilda-ladro-4", 8: "capogilda-ladro-8", 12: "capogilda-ladro-12", 16: "capogilda-ladro-16", 20: "capogilda-ladro-20" } },
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
  // Livello 12 (0.25.0): valori di partenza, da tarare con la simulazione (tests/moduli/bilanciamentoLivelli12.test.ts) sull'equipaggiamento naturale a ~20 punti per pezzo.
  capogilda("capogilda-cavaliere-12", "cavaliere12", "sprite.capogilda.cavaliere12", 140, 34, 16, 7),
  capogilda("capogilda-mistico-12", "mistico12", "sprite.capogilda.mistico12", 85, 34, 7, 11),
  capogilda("capogilda-ladro-12", "ladro12", "sprite.capogilda.ladro12", 98, 32, 7, 17),
  // Livello 16 (0.27.0): valori di partenza, da tarare con il simulatore (equipaggiamento e brace al livello 16).
  capogilda("capogilda-cavaliere-16", "cavaliere16", "sprite.capogilda.cavaliere16", 180, 43, 21, 7),
  capogilda("capogilda-mistico-16", "mistico16", "sprite.capogilda.mistico16", 120, 44, 10, 12),
  capogilda("capogilda-ladro-16", "ladro16", "sprite.capogilda.ladro16", 125, 41, 10, 18),
  // Livello 20 (0.28.0): valori di partenza, da tarare con il simulatore (equipaggiamento di brace al livello 19).
  capogilda("capogilda-cavaliere-20", "cavaliere20", "sprite.capogilda.cavaliere20", 198, 46, 22, 7),
  capogilda("capogilda-mistico-20", "mistico20", "sprite.capogilda.mistico20", 125, 46, 11, 12),
  capogilda("capogilda-ladro-20", "ladro20", "sprite.capogilda.ladro20", 127, 42, 10, 18),
];
