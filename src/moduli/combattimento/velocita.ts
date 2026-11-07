import type { Contesto, StatoGioco } from "../../core/indice";
import { applicaRegole } from "../../core/indice";
import { calcolaProbabilitaFuga, chiAttaccaPerPrimo } from "./calcolo";
import type { Iniziativa } from "./calcolo";
import { PARAMETRI_COMBATTIMENTO } from "./parametri";
import { puntoFuga, puntoVelocita } from "./punti";
import type { Creatura } from "./tipi";

// Velocità del giocatore: base + classe + oggetti (le regole dei moduli la modificano).
export function velocitaGiocatore(stato: StatoGioco, ctx: Contesto): number {
  return applicaRegole(ctx, puntoVelocita, { stato, velocita: PARAMETRI_COMBATTIMENTO.velocitaBase }).velocita;
}

// Probabilità di fuga contro una creatura: dipende dalla differenza di velocità; altre regole possono ancora modificarla.
export function probabilitaFugaContro(stato: StatoGioco, creatura: Creatura, ctx: Contesto): number {
  const limiti = {
    base: PARAMETRI_COMBATTIMENTO.probabilitaFugaBase,
    perPunto: PARAMETRI_COMBATTIMENTO.fugaPerPuntoVelocita,
    minima: PARAMETRI_COMBATTIMENTO.fugaMinima,
    massima: PARAMETRI_COMBATTIMENTO.fugaMassima,
  };
  const iniziale = calcolaProbabilitaFuga(velocitaGiocatore(stato, ctx), creatura.velocita, limiti);
  const regolata = applicaRegole(ctx, puntoFuga, { stato, probabilita: iniziale }).probabilita;
  return Math.min(limiti.massima, Math.max(limiti.minima, regolata));
}

// Chi colpisce per primo contro la creatura. Il tiro di sorte si consuma solo a parità di velocità.
export function iniziativaContro(stato: StatoGioco, creatura: Creatura, ctx: Contesto): Iniziativa {
  return chiAttaccaPerPrimo(velocitaGiocatore(stato, ctx), creatura.velocita, () => ctx.rng.prossimo());
}
