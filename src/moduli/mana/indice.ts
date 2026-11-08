import type { Contesto, DefinizioneModulo, InterfacciaModulo, PannelloVista, StatoGioco } from "../../core/indice";
import { VERSIONE_API, puntoInizioGiorno, regola } from "../../core/indice";
import { ID_COMBATTIMENTO, puntoFineScontro } from "../combattimento/indice";
import { manaAttuale, manaMassimo, ripristinaMana } from "./calcolo";
import { PARAMETRI_MANA } from "./parametri";
import { ID_MANA, statoMana } from "./tipi";

export { ID_MANA, statoMana } from "./tipi";
export { PARAMETRI_MANA } from "./parametri";
export type { StatoMana } from "./tipi";
export { aggiungiMana, manaAttuale, manaMassimo, puntoManaMassimo, ripristinaMana, spendiMana } from "./calcolo";
export type { CalcoloManaMassimo } from "./calcolo";

const CONTESTO_INFO_PERSONAGGIO = "info:personaggio";

// Il mana si recupera a ogni nuovo giorno.
const regolaManaGiornaliero = regola(puntoInizioGiorno, 90, (stato: StatoGioco, ctx: Contesto) => ripristinaMana(stato, ctx));

// Ogni scontro vinto restituisce un po' di mana (fino al massimo): chi ha mana può usare le abilità molto più spesso.
const regolaManaPerVittoria = regola(puntoFineScontro, 90, (calcolo, ctx) => {
  const massimo = manaMassimo(calcolo.stato, ctx);
  if (calcolo.esito !== "vittoria" || massimo === 0) return calcolo;
  const attuale = manaAttuale(calcolo.stato, ctx);
  const nuovo = Math.min(massimo, attuale + PARAMETRI_MANA.recuperoPerVittoria);
  return nuovo === attuale ? calcolo : { ...calcolo, stato: statoMana.scrivi(calcolo.stato, { attuale: nuovo }) };
});

// Nella scheda del personaggio compare solo per chi ha mana.
const interfacciaMana: InterfacciaModulo = {
  // Barra del mana sotto gli HP, solo per chi ha mana.
  laterale(stato, ctx) {
    const massimo = manaMassimo(stato, ctx);
    return massimo === 0
      ? []
      : [{ tipo: "barra", etichettaChiave: "mana.laterale.etichetta", attuale: manaAttuale(stato, ctx), massimo, stile: "mana", ordine: 10 }];
  },
  pannelli(stato, ctx): readonly PannelloVista[] {
    const massimo = manaMassimo(stato, ctx);
    if (massimo === 0) return [];
    return [
      {
        titoloChiave: "interfaccia.scheda.statistiche",
        contesti: [CONTESTO_INFO_PERSONAGGIO],
        righe: [{ chiave: "mana.scheda.riga", parametri: { attuale: manaAttuale(stato, ctx), massimo, base: 0, bonus: `+${massimo}` } }],
      },
    ];
  },
};

export const moduloMana: DefinizioneModulo = {
  id: ID_MANA,
  versioneApi: VERSIONE_API,
  dipende: [ID_COMBATTIMENTO],
  regole: [regolaManaGiornaliero, regolaManaPerVittoria],
  testi: {
    it: { "mana.scheda.titolo": "Mana", "mana.scheda.riga": "Mana: {attuale}/{massimo} (base {base}, bonus {bonus})", "mana.laterale.etichetta": "Mana" },
    en: { "mana.scheda.titolo": "Mana", "mana.scheda.riga": "Mana: {attuale}/{massimo} (base {base}, bonus {bonus})", "mana.laterale.etichetta": "Mana" },
  },
  stato: statoMana,
  interfaccia: interfacciaMana,
};
