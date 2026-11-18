import type { DefinizioneModulo, InterfacciaModulo, PannelloVista, RigaVista, StatoGioco } from "../../core/indice";
import { VERSIONE_API } from "../../core/indice";
import { ID_CACCIATORE, missioneAttiva } from "../cacciatore/indice";
import { ID_CRONACHE, statoCronache } from "../cronache/indice";
import { ID_TORNEO, PARAMETRI_TORNEO, giorniAllaFine, statoTorneo, torneoDellaSettimana } from "../torneo/indice";
import { ILLUSTRAZIONI_BANDI } from "./grafica";

export const ID_BANDI = "bandi";
const CONTESTO_PALAZZO = "luogo:palazzo";

// Il personaggio è Gran Campione di Lucca se ha vinto tutti e quattro i tornei (come la scheda).
const eGranCampione = (stato: StatoGioco): boolean => {
  const albo = statoTorneo.leggi(stato).albo;
  return Array.from({ length: PARAMETRI_TORNEO.numeroTornei }, (_, t) => t).every((t) => (albo[String(t)]?.vittorie ?? 0) > 0);
};

// I bandi del Gonfaloniere (0.19.0): annunci ufficiali costruiti sullo stato di gioco, a differenza delle Cronache della Stamperia, che sono gossip.
function righeBandi(stato: StatoGioco): readonly RigaVista[] {
  const giorni = giorniAllaFine(stato);
  return [
    { chiave: "bandi.testata", tono: "speciale" },
    { chiave: "bandi.giorno", parametri: { giorni: statoCronache.leggi(stato).giorni + 1 } },
    { chiave: "bandi.torneo", parametri: { nomeChiave: `torneo.nome.${torneoDellaSettimana(stato)}`, giorni } },
    eGranCampione(stato) ? { chiave: "bandi.campione.si", parametri: { nome: stato.personaggio.nome }, tono: "positivo" } : { chiave: "bandi.campione.no" },
    { chiave: missioneAttiva(stato) ? "bandi.castruccio.si" : "bandi.castruccio.no" },
  ];
}

const interfaccia: InterfacciaModulo = {
  titoliContesto: { [CONTESTO_PALAZZO]: "bandi.titolo" },
  illustrazioniContesto: { [CONTESTO_PALAZZO]: "scena.palazzo" },
  pannelli: (stato): readonly PannelloVista[] => [{ titoloChiave: "bandi.pannello", contesti: [CONTESTO_PALAZZO], righe: righeBandi(stato) }],
};

// Il Palazzo degli Anziani (0.19.0): i bandi del Gonfaloniere, costruiti sullo stato di gioco (torneo, Gran Campione, incarichi di Castruccio).
export const moduloBandi: DefinizioneModulo = {
  id: ID_BANDI,
  versioneApi: VERSIONE_API,
  dipende: [ID_CACCIATORE, ID_CRONACHE, ID_TORNEO],
  contenuti: ILLUSTRAZIONI_BANDI,
  interfaccia,
  testi: {
    it: {
      "bandi.titolo": "Il Palazzo degli Anziani",
      "bandi.pannello": "Bandi del Gonfaloniere",
      "bandi.testata": "Per ordine del Gonfaloniere e degli Anziani della Repubblica di Lucca, si rende noto:",
      "bandi.giorno": "Si contano oggi {giorni} giorni dalla vostra venuta in città.",
      "bandi.torneo": "Questa settimana si tiene il {nomeChiave}: mancano {giorni} {giorni#giorno|giorni}.",
      "bandi.campione.si": "Gran Campione di Lucca è {nome}, che ha vinto tutti e quattro i tornei.",
      "bandi.campione.no": "Il titolo di Gran Campione di Lucca attende chi vincerà tutti e quattro i tornei.",
      "bandi.castruccio.si": "Castruccio Castracani ha affidato oggi un incarico: chi vuole servire la Repubblica lo trova da lui.",
      "bandi.castruccio.no": "Oggi Castruccio Castracani non ha affidato alcun incarico.",
    },
    en: {
      "bandi.titolo": "The Palace of the Elders",
      "bandi.pannello": "Proclamations of the Gonfalonier",
      "bandi.testata": "By order of the Gonfalonier and the Elders of the Republic of Lucca, let it be known:",
      "bandi.giorno": "Today marks {giorni} days since you arrived in the city.",
      "bandi.torneo": "This week the {nomeChiave} is held: {giorni} {giorni#day|days} left.",
      "bandi.campione.si": "{nome} is the Grand Champion of Lucca, having won all four tournaments.",
      "bandi.campione.no": "The title of Grand Champion of Lucca awaits whoever wins all four tournaments.",
      "bandi.castruccio.si": "Castruccio Castracani has assigned a task today: whoever wishes to serve the Republic will find him.",
      "bandi.castruccio.no": "Today Castruccio Castracani has assigned no task.",
    },
  },
};
