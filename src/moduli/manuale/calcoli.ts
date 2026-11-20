import type { Classe } from "../classi/indice";
import { PARAMETRI_COMBATTIMENTO } from "../combattimento/parametri";
import { CRESCITA, PARAMETRI_LIVELLI } from "../livelli/indice";
import { guadagniTotali } from "../livelli/calcolo";

// Calcoli puri del manuale: usati sia dalle pagine del gioco sia dal generatore di docs/manuale.md e manuale.html (strumenti/manuale),
// così il manuale non può disallinearsi dai dati. Valori teorici: classe e livelli, senza equipaggiamento, pozioni né oggetti magici.
export type Skill = "hp" | "forza" | "difesa" | "velocita" | "mana" | "fortuna" | "scasso";

// I valori di base del personaggio prima della classe (nello stato iniziale).
export interface BasePersonaggio {
  readonly hpMaxBase: number;
  readonly forzaBase: number;
  readonly difesaBase: number;
}

export function valoreTeorico(skill: Skill, base: BasePersonaggio, classeId: string, classe: Classe, livello: number): number {
  const m = classe.modificatori;
  const g = guadagniTotali(CRESCITA[classeId], livello);
  switch (skill) {
    case "hp": return Math.max(1, base.hpMaxBase + m.hpMax) + g.hp;
    case "forza": return Math.max(0, base.forzaBase + m.forza) + g.forza;
    case "difesa": return Math.max(0, base.difesaBase + m.difesa) + g.difesa;
    case "velocita": return PARAMETRI_COMBATTIMENTO.velocitaBase + m.velocita + g.velocita;
    case "mana": return m.mana + g.mana;
    case "fortuna": return m.fortuna + g.fortuna;
    case "scasso": return g.scasso;
  }
}

// La classe ha questa skill? (il mana non esiste per chi non ne ha; lo scasso solo per chi lo fa crescere).
export function haLaSkill(skill: Skill, classeId: string, classe: Classe): boolean {
  if (skill === "mana") return classe.modificatori.mana > 0 || CRESCITA[classeId]?.mana !== undefined;
  if (skill === "scasso") return CRESCITA[classeId]?.scasso !== undefined;
  return true;
}

export const LIVELLO_MASSIMO = PARAMETRI_LIVELLI.livelloMax;
