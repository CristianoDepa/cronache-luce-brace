import type { DefinizioneModulo, InterfacciaModulo, PannelloVista, Risultato } from "../../core/indice";
import { VERSIONE_API, chiudi, comeOggetto, definisciAzione, esitoErrore, esitoOk, fallisci, numero, puntoInizioGiorno, regola } from "../../core/indice";
import { PARAMETRI_AZIONI } from "./parametri";
import { ID_AZIONI, consumaAzioni, leggiAzioniResidue, ripristinaAzioni, statoAzioni } from "./tipi";

export { ID_AZIONI, consumaAzioni, leggiAzioniResidue, ripristinaAzioni, statoAzioni } from "./tipi";
export type { StatoAzioni } from "./tipi";
export { PARAMETRI_AZIONI } from "./parametri";

const CONTESTO_INFO_PERSONAGGIO = "info:personaggio";

function validaValore(dati: unknown): Risultato<{ readonly valore: number }> {
  const o = comeOggetto(dati);
  if (!o) return fallisci("oggetto atteso");
  const errori: string[] = [];
  return chiudi(errori, { valore: numero(o, "valore", errori) });
}

// Cambia le azioni al giorno. L'effetto è immediato: le azioni rimaste oggi variano della differenza.
const azioneImpostaAzioni = definisciAzione(
  "impostaAzioni",
  validaValore,
  (stato, dati) => {
    const { valore } = dati;
    const ammesso = Number.isInteger(valore) && valore >= PARAMETRI_AZIONI.azioniMin && valore <= PARAMETRI_AZIONI.azioniMax;
    if (!ammesso) return esitoErrore("azioni.errore.fuori_intervallo");
    const corrente = statoAzioni.leggi(stato);
    const residue = Math.min(valore, Math.max(0, corrente.residue + (valore - corrente.giorno)));
    return esitoOk(statoAzioni.scrivi(stato, { giorno: valore, residue }), [
      { chiave: "azioni.impostate", parametri: { valore, azioni: residue } },
    ]);
  },
  { consentitaDaMorto: true },
);

// A ogni nuovo giorno le azioni tornano al massimo.
const regolaAzioniGiornaliere = regola(puntoInizioGiorno, 100, (stato) => ripristinaAzioni(stato));

const interfaccia: InterfacciaModulo = {
  impostazioni: [
    {
      id: "azioni.giorno",
      etichettaChiave: "azioni.impostazione.giorno",
      tasto: "T",
      min: PARAMETRI_AZIONI.azioniMin,
      max: PARAMETRI_AZIONI.azioniMax,
      azioneTipo: "impostaAzioni",
      allaCreazione: true,
      leggi: (stato) => statoAzioni.leggi(stato).giorno,
    },
  ],
  // Nella colonna di destra: "Azioni 42/50".
  laterale: (stato) => [
    {
      tipo: "riga",
      riga: { chiave: "azioni.laterale", parametri: { residue: leggiAzioniResidue(stato), giorno: statoAzioni.leggi(stato).giorno } },
      ordine: 21,
    },
  ],
  pannelli(stato): readonly PannelloVista[] {
    const s = statoAzioni.leggi(stato);
    return [
      {
        titoloChiave: "azioni.pannello.titolo",
        contesti: [CONTESTO_INFO_PERSONAGGIO],
        righe: [{ chiave: "azioni.pannello.riga", parametri: { residue: s.residue, giorno: s.giorno } }],
      },
    ];
  },
};

export const moduloAzioni: DefinizioneModulo = {
  id: ID_AZIONI,
  versioneApi: VERSIONE_API,
  dipende: [],
  azioni: [azioneImpostaAzioni],
  regole: [regolaAzioniGiornaliere],
  testi: {
    it: {
      "azioni.impostazione.giorno": "Azioni al giorno (ora: {valore})",
      "azioni.impostate": "Azioni al giorno impostate a {valore}. Oggi ne restano {azioni}.",
      "azioni.laterale": "Azioni {residue}/{giorno}",
      "azioni.pannello.titolo": "Azioni",
      "azioni.pannello.riga": "Azioni rimaste oggi: {residue}/{giorno}",
      "azioni.errore.fuori_intervallo": "Le azioni al giorno devono essere un numero intero tra 5 e 100.",
      "azioni.errore.esaurite": "Sei esausto: riposa fino a domani.",
    },
    en: {
      "azioni.impostazione.giorno": "Actions per day (now: {valore})",
      "azioni.impostate": "Actions per day set to {valore}. {azioni} left today.",
      "azioni.laterale": "Actions {residue}/{giorno}",
      "azioni.pannello.titolo": "Actions",
      "azioni.pannello.riga": "Actions left today: {residue}/{giorno}",
      "azioni.errore.fuori_intervallo": "Actions per day must be a whole number between 5 and 100.",
      "azioni.errore.esaurite": "You are exhausted: rest until tomorrow.",
    },
  },
  stato: statoAzioni,
  interfaccia,
};
