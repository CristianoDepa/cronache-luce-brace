import type { DefinizioneModulo, InterfacciaModulo, PannelloVista, RigaVista } from "../../core/indice";
import { VERSIONE_API } from "../../core/indice";
import { ID_AZIONI } from "../azioni/indice";
import { CONTESTO_BESTIARIO_SCHEDA, ID_COMBATTIMENTO, statoCombattimento } from "../combattimento/indice";
import { ID_FORTUNA } from "../fortuna/indice";
import { CREATURE_CHE_INFLIGGONO, PATTI } from "./dati";
import { PARAMETRI_STATI } from "./parametri";
import { regolaColpoStati, regolaFortunaPatto, regolaGiornoStati, regolaOroPatto, regolaStatisticheStati, regolaTempoStati } from "./regole";
import { ID_STATI, statoStati } from "./tipi";

export { CREATURE_CHE_INFLIGGONO, PATTI, pattoPerId } from "./dati";
export type { DefinizionePatto, TipoStato } from "./dati";
export { PARAMETRI_STATI } from "./parametri";
export const prezzoCuraGuaritore = (livello: number): number => PARAMETRI_STATI.curaGuaritorePerLivello * livello;
export const prezzoCuraChiesa = (livello: number): number => PARAMETRI_STATI.curaChiesaPerLivello * livello;
export { ID_STATI, azioniResidue, curaStati, infliggiStato, pattoStretto, statoStati, stringiPatto, èAvvelenato, èSpaventato } from "./tipi";

const CONTESTO_INFO = "info:personaggio";

const interfaccia: InterfacciaModulo = {
  // Nella colonna di destra, sotto le azioni: compaiono solo finché lo stato dura, così si vedono anche negli scontri.
  laterale: (stato) => {
    const s = statoStati.leggi(stato);
    const riga = (chiave: string, azioni: number, ordine: number) => ({ tipo: "riga" as const, riga: { chiave, parametri: { azioni }, tono: "negativo" as const }, ordine });
    return [...(s.veleno > 0 ? [riga("stati.laterale.veleno", s.veleno, 22)] : []), ...(s.paura > 0 ? [riga("stati.laterale.paura", s.paura, 23)] : [])];
  },
  pannelli(stato): readonly PannelloVista[] {
    const patto = statoStati.leggi(stato).patto;
    const scheda: PannelloVista[] = [];
    // Nella scheda di un mostro del bestiario: se avvelena o spaventa (si vede solo dei mostri già incontrati, perché la scheda si apre solo da quelli).
    const mostro = statoCombattimento.leggi(stato).bestiario?.mostro;
    const tipo = mostro === null || mostro === undefined ? undefined : CREATURE_CHE_INFLIGGONO[mostro];
    if (tipo !== undefined) scheda.push({ contesti: [CONTESTO_BESTIARIO_SCHEDA], righe: [{ chiave: `stati.bestiario.${tipo}`, tono: "negativo" }] });
    if (patto === null) return scheda;
    const righe: RigaVista[] = [{ chiave: `stati.patto.${patto}`, tono: "speciale" }];
    return [{ contesti: [CONTESTO_INFO], righe }, ...scheda];
  },
};

// Stati (0.23.0): veleno e paura, che durano azioni, e il patto del Diavolo, permanente.
export const moduloStati: DefinizioneModulo = {
  id: ID_STATI,
  versioneApi: VERSIONE_API,
  dipende: [ID_AZIONI, ID_COMBATTIMENTO, ID_FORTUNA],
  regole: [regolaStatisticheStati, regolaFortunaPatto, regolaOroPatto, regolaGiornoStati, regolaTempoStati, regolaColpoStati],
  stato: statoStati,
  interfaccia,
  testi: {
    it: {
      "stati.bestiario.veleno": "Il suo colpo può avvelenarti.",
      "stati.bestiario.paura": "La sua vista può spaventarti.",
      "stati.laterale.veleno": "Avvelenato ({azioni} azioni)",
      "stati.laterale.paura": "Spaventato ({azioni} azioni)",
      "stati.log.avvelenato": `Il colpo ti avvelena! Per ${PARAMETRI_STATI.veleno.azioni} azioni perderai salute a ogni azione.`,
      "stati.log.spaventato": `Un brivido di terrore ti gela: per ${PARAMETRI_STATI.paura.azioni} azioni sei più debole e meno protetto.`,
      "stati.log.velenoDanno": "Il veleno ti brucia: perdi {hp} HP.",
      "stati.log.velenoFinito": "Il veleno ha smesso di fare effetto.",
      "stati.log.pauraFinita": "La paura passa: ti senti di nuovo saldo.",
      "stati.patto.forza": "Patto con il Diavolo: Forza (+3 forza, −6 HP massimi).",
      "stati.patto.difesa": "Patto con il Diavolo: Difesa (+3 difesa, −3 forza).",
      "stati.patto.fortuna": "Patto con il Diavolo: Fortuna (+2 Fortuna, −25% delle monete dei mostri).",
    },
    en: {
      "stati.bestiario.veleno": "Its blow can poison you.",
      "stati.bestiario.paura": "Its sight can frighten you.",
      "stati.laterale.veleno": "Poisoned ({azioni} actions)",
      "stati.laterale.paura": "Frightened ({azioni} actions)",
      "stati.log.avvelenato": `The blow poisons you! For ${PARAMETRI_STATI.veleno.azioni} actions you will lose health with every action.`,
      "stati.log.spaventato": `A chill of terror grips you: for ${PARAMETRI_STATI.paura.azioni} actions you are weaker and less protected.`,
      "stati.log.velenoDanno": "The poison burns you: you lose {hp} HP.",
      "stati.log.velenoFinito": "The poison has worn off.",
      "stati.log.pauraFinita": "The fear fades: you feel steady again.",
      "stati.patto.forza": "Pact with the Devil: Strength (+3 strength, −6 max HP).",
      "stati.patto.difesa": "Pact with the Devil: Defense (+3 defense, −3 strength).",
      "stati.patto.fortuna": "Pact with the Devil: Luck (+2 Luck, −25% of monsters' coins).",
    },
  },
};
