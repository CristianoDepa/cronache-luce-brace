import type { DefinizioneModulo, InterfacciaModulo, PannelloVista } from "../../core/indice";
import { VERSIONE_API } from "../../core/indice";
import { fortunaBase, fortunaBonus, fortunaTotale } from "./calcolo";

export { PARAMETRI_FORTUNA } from "./parametri";
export { conFortuna, fortunaBase, fortunaBonus, fortunaTotale, probabilitaConFortuna, puntoFortunaBase, puntoFortunaBonus } from "./calcolo";
export type { CalcoloFortuna } from "./calcolo";

export const ID_FORTUNA = "fortuna";
const CONTESTO_INFO_PERSONAGGIO = "info:personaggio";

const segno = (n: number): string => (n > 0 ? `+${n}` : String(n));

// Nella scheda, nel gruppo Statistiche: "Fortuna: 8 (base 3, bonus +5)".
const interfacciaFortuna: InterfacciaModulo = {
  // Anche nella colonna di destra, dopo la Velocità: «Forza 5 - Difesa 4 - Velocità 6 - Fortuna 2».
  laterale: (stato, ctx) => [{ tipo: "statistica", etichettaChiave: "fortuna.laterale.etichetta", valore: fortunaTotale(stato, ctx), ordine: 20 }],
  pannelli(stato, ctx): readonly PannelloVista[] {
    const base = fortunaBase(stato, ctx);
    const bonus = fortunaBonus(stato, ctx);
    return [
      {
        titoloChiave: "interfaccia.scheda.statistiche",
        contesti: [CONTESTO_INFO_PERSONAGGIO],
        righe: [{ chiave: "fortuna.scheda.riga", parametri: { fortuna: base + bonus, base, bonus: segno(bonus) } }],
      },
    ];
  },
};

// Fortuna: una statistica che agisce solo su bottino e scoperte (pozioni trovate, forzieri, prede), non nel combattimento né nella Zara.
export const moduloFortuna: DefinizioneModulo = {
  id: ID_FORTUNA,
  versioneApi: VERSIONE_API,
  dipende: [],
  testi: {
    it: { "fortuna.scheda.riga": "Fortuna: {fortuna} (base {base}, bonus {bonus})", "fortuna.laterale.etichetta": "Fortuna" },
    en: { "fortuna.scheda.riga": "Luck: {fortuna} (base {base}, bonus {bonus})", "fortuna.laterale.etichetta": "Luck" },
  },
  interfaccia: interfacciaFortuna,
};
