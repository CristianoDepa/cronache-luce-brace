import type { DefinizioneModulo, InterfacciaModulo, VoceMenu } from "../../core/indice";
import { VERSIONE_API } from "../../core/indice";
import { ID_CLASSI } from "../classi/indice";
import { ID_COMBATTIMENTO } from "../combattimento/indice";
import { ID_FORTUNA } from "../fortuna/indice";
import { ID_INVENTARIO } from "../inventario/indice";
import { ID_LIVELLI } from "../livelli/indice";
import { ID_POZIONI } from "../pozioni/indice";
import { ID_SCOPERTA } from "../scoperta/indice";
import { azioneApriForziere } from "./azioni";
import { PARAMETRI_FORZIERE, parametriZona } from "./parametri";
import { regolaTrovaForziere } from "./regole";
import { ID_FORZIERE, statoForziere } from "./tipi";

export { ID_FORZIERE, statoForziere } from "./tipi";
export { PARAMETRI_FORZIERE, ZONE_FORZIERE, parametriZona, zonaDellaScena } from "./parametri";
export { probabilitaApertura, tentaApertura } from "./apertura";

// Il forziere si apre dalla porta da cui si accede alla zona: una voce per ogni porta, visibile solo se il forziere trovato è di una zona di quella porta.
const CONTESTI_PORTE: readonly string[] = [...new Set(Object.values(PARAMETRI_FORZIERE.zone).map((z) => z.contesto))];
const idVoce = (contesto: string): string => `forziere.apri.${contesto}`;

const menu: readonly VoceMenu[] = CONTESTI_PORTE.map((contesto) => ({
  id: idVoce(contesto),
  contesto,
  etichettaChiave: "forziere.menu.apri",
  tasto: "T",
  ordine: 6,
  comando: { tipo: "azione", azione: { tipo: "apriForziere" } },
}));

const contestoDelForziere = (zona: string | null): string | undefined => (zona === null ? undefined : parametriZona(zona)?.contesto);

const interfaccia: InterfacciaModulo = {
  menu,
  menuNascosto: (stato) => {
    const attivo = contestoDelForziere(statoForziere.leggi(stato).zona);
    return CONTESTI_PORTE.filter((c) => c !== attivo).map(idVoce);
  },
  pannelli: (stato) => {
    const contesto = contestoDelForziere(statoForziere.leggi(stato).zona);
    return contesto === undefined ? [] : [{ contesti: [contesto], righe: [{ chiave: "forziere.pannello", tono: "speciale" }] }];
  },
};

// Forziere: dopo una vittoria in una zona di caccia si può trovare un forziere; un solo tentativo di apertura (Fortuna e Ladro lo aiutano).
export const moduloForziere: DefinizioneModulo = {
  id: ID_FORZIERE,
  versioneApi: VERSIONE_API,
  dipende: [ID_CLASSI, ID_COMBATTIMENTO, ID_FORTUNA, ID_INVENTARIO, ID_LIVELLI, ID_POZIONI, ID_SCOPERTA],
  azioni: [azioneApriForziere],
  regole: [regolaTrovaForziere],
  testi: {
    it: {
      "forziere.trovato": "Dietro il nemico trovi un forziere chiuso!",
      "forziere.pannello": "Hai un forziere chiuso: puoi fare un solo tentativo di aprirlo.",
      "forziere.menu.apri": "Prova ad aprire il forziere",
      "forziere.aperto": "Il lucchetto cede: il forziere si apre!",
      "forziere.oro": "Dentro trovi {oro} monete.",
      "forziere.pozione": "Dentro trovi: {nomeChiave}!",
      "forziere.fallito": "Il lucchetto non cede: il forziere resta chiuso e lo abbandoni.",
      "forziere.errore.nessuno": "Non hai nessun forziere da aprire.",
    },
    en: {
      "forziere.trovato": "Behind the enemy you find a locked chest!",
      "forziere.pannello": "You have a locked chest: you can try to open it only once.",
      "forziere.menu.apri": "Try to open the chest",
      "forziere.aperto": "The lock gives way: the chest opens!",
      "forziere.oro": "Inside you find {oro} coins.",
      "forziere.pozione": "Inside you find: {nomeChiave}!",
      "forziere.fallito": "The lock will not give: the chest stays shut and you leave it behind.",
      "forziere.errore.nessuno": "You have no chest to open.",
    },
  },
  stato: statoForziere,
  interfaccia,
};
