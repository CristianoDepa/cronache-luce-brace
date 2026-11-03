import type { DefinizioneModulo, InterfacciaModulo } from "../../core/indice";
import { VERSIONE_API, puntoInizioGiorno, regola } from "../../core/indice";
import { ID_COMBATTIMENTO } from "../combattimento/indice";
import { ID_LUOGHI } from "../luoghi/indice";
import { azioneEsploraForesta, azioneImpostaTurni } from "./azioni";
import { LUOGHI_FORESTA } from "./dati";
import { ILLUSTRAZIONI_FORESTA } from "./grafica";
import { PARAMETRI_FORESTA } from "./parametri";
import { TESTI_FORESTA } from "./testi";
import { ID_FORESTA, statoForesta } from "./tipi";

export { ID_FORESTA, consumaTurni, leggiTurniResidui, statoForesta } from "./tipi";
export type { StatoForesta } from "./tipi";
export { PARAMETRI_FORESTA } from "./parametri";

const CONTESTO_LUOGO = "luogo:foresta";

const interfaccia: InterfacciaModulo = {
  titoliContesto: { [CONTESTO_LUOGO]: "foresta.luogo.foresta" },
  illustrazioniContesto: { [CONTESTO_LUOGO]: "scena.foresta" },
  impostazioni: [
    {
      id: "foresta.turni",
      etichettaChiave: "foresta.impostazione.turni",
      tasto: "T",
      min: PARAMETRI_FORESTA.turniMin,
      max: PARAMETRI_FORESTA.turniMax,
      azioneTipo: "impostaTurni",
      allaCreazione: true,
      leggi: (stato) => statoForesta.leggi(stato).turniGiorno,
    },
  ],
  menu: [
    {
      id: "foresta.vai",
      contesto: "villaggio",
      etichettaChiave: "foresta.menu.vai",
      tasto: "F",
      ordine: 10,
      comando: { tipo: "naviga", verso: CONTESTO_LUOGO },
    },
    {
      id: "foresta.esplora",
      contesto: CONTESTO_LUOGO,
      etichettaChiave: "foresta.menu.esplora",
      tasto: "E",
      comando: { tipo: "azione", azione: { tipo: "esploraForesta", dati: { luogoId: "foresta" } } },
    },
  ],
  pannelli(stato) {
    return [
      {
        titoloChiave: "foresta.pannello.titolo",
        contesti: ["villaggio", CONTESTO_LUOGO, "info:personaggio"],
        righe: [
          {
            chiave: "foresta.pannello.turni",
            parametri: { turni: statoForesta.leggi(stato).turniResidui, turniMax: statoForesta.leggi(stato).turniGiorno },
          },
        ],
      },
    ];
  },
};

// A ogni nuovo giorno gli incontri tornano al massimo.
const regolaTurniGiornalieri = regola(puntoInizioGiorno, 100, (stato) => {
  const { turniGiorno } = statoForesta.leggi(stato);
  return statoForesta.scrivi(stato, { turniGiorno, turniResidui: turniGiorno });
});

export const moduloForesta: DefinizioneModulo = {
  id: ID_FORESTA,
  versioneApi: VERSIONE_API,
  dipende: [ID_COMBATTIMENTO, ID_LUOGHI],
  contenuti: [...LUOGHI_FORESTA, ...ILLUSTRAZIONI_FORESTA],
  azioni: [azioneEsploraForesta, azioneImpostaTurni],
  regole: [regolaTurniGiornalieri],
  testi: TESTI_FORESTA,
  stato: statoForesta,
  interfaccia,
};
