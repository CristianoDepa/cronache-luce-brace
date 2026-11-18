import type { DefinizioneModulo, InterfacciaModulo, PannelloVista, RigaVista } from "../../core/indice";
import { VERSIONE_API } from "../../core/indice";
import { ID_COMBATTIMENTO } from "../combattimento/indice";
import { azioneChiediIntercessione, costoOfferta } from "./azioni";
import { ILLUSTRAZIONI_CATTEDRALE } from "./grafica";
import { regolaFineGiornoCattedrale, regolaProtezioneDivina } from "./regole";
import { ID_CATTEDRALE, protezioneAttiva, statoCattedrale } from "./tipi";

export { PARAMETRI_CATTEDRALE } from "./parametri";
export { costoOfferta } from "./azioni";
export { ID_CATTEDRALE, protezioneAttiva, statoCattedrale } from "./tipi";

const CONTESTO_CATTEDRALE = "luogo:cattedrale";
const CONTESTO_INFO = "info:personaggio";

const interfaccia: InterfacciaModulo = {
  titoliContesto: { [CONTESTO_CATTEDRALE]: "cattedrale.titolo" },
  illustrazioniContesto: { [CONTESTO_CATTEDRALE]: "scena.cattedrale" },
  // La voce c'è sempre: se la grazia c'è già o mancano le monete, Padre Bartolomeo risponde e non cambia nulla.
  menu: [{ id: "cattedrale.intercessione", contesto: CONTESTO_CATTEDRALE, etichettaChiave: "cattedrale.menu.intercessione", tasto: "1", ordine: 1, comando: { tipo: "azione", azione: { tipo: "chiediIntercessione" } } }],
  pannelli(stato): readonly PannelloVista[] {
    const s = statoCattedrale.leggi(stato);
    const righe: RigaVista[] = [{ chiave: "cattedrale.saluto", tono: "speciale" }];
    if (s.attiva) righe.push({ chiave: "cattedrale.protetto", tono: "positivo" });
    else if (s.svanita) righe.push({ chiave: "cattedrale.svanita", tono: "negativo" });
    else if (!s.richiestaOggi) righe.push({ chiave: "cattedrale.proposta", parametri: { costo: costoOfferta(stato) }, tono: "speciale" });
    const scheda: PannelloVista[] = s.attiva ? [{ contesti: [CONTESTO_INFO], righe: [{ chiave: "cattedrale.scheda", tono: "positivo" }] }] : [];
    return [{ contesti: [CONTESTO_CATTEDRALE], righe }, ...scheda];
  },
};

// La Cattedrale di San Martino (0.19.0): Padre Bartolomeo, l'arciprete, intercede per te: la protezione divina (50 monete per livello, una volta al giorno).
export const moduloCattedrale: DefinizioneModulo = {
  id: ID_CATTEDRALE,
  versioneApi: VERSIONE_API,
  dipende: [ID_COMBATTIMENTO],
  contenuti: ILLUSTRAZIONI_CATTEDRALE,
  azioni: [azioneChiediIntercessione],
  regole: [regolaProtezioneDivina, regolaFineGiornoCattedrale],
  stato: statoCattedrale,
  interfaccia,
  testi: {
    it: {
      "cattedrale.titolo": "La cattedrale di San Martino",
      "cattedrale.menu.intercessione": "Chiedi l'intercessione",
      "cattedrale.saluto": "Padre Bartolomeo ti guarda senza fretta. «Parla. Il tempo non manca, ma non è infinito.»",
      "cattedrale.proposta": "«Posso intercedere per te, per oggi. L'offerta è di {costo} monete.»",
      "cattedrale.oro": "«L'offerta è di {costo} monete. Torna quando potrai versarla.»",
      "cattedrale.gia": "«La grazia ti copre già, per oggi. Non c'è altro da chiedere.»",
      "cattedrale.accettata": "«L'offerta è congrua. Per oggi la grazia ti coprirà: non ti dirò di più.»",
      "cattedrale.scattata": "La grazia ti ha coperto. Ti rialzi con 1 HP, e il pericolo si allontana.",
      "cattedrale.protetto": "Sei sotto la grazia di Padre Bartolomeo, fino a domani.",
      "cattedrale.svanita": "La protezione è svanita: oggi nessuna grazia ti copre.",
      "cattedrale.scheda": "Sotto la grazia di Padre Bartolomeo, fino a domani.",
    },
    en: {
      "cattedrale.titolo": "St Martin's Cathedral",
      "cattedrale.menu.intercessione": "Ask for intercession",
      "cattedrale.saluto": "Father Bartolomeo looks at you without haste. \"Speak. Time is not lacking, but neither is it infinite.\"",
      "cattedrale.proposta": "\"I can intercede for you, for today. The offering is {costo} coins.\"",
      "cattedrale.oro": "\"The offering is {costo} coins. Come back when you can pay it.\"",
      "cattedrale.gia": "\"Grace already covers you, for today. There is nothing more to ask.\"",
      "cattedrale.accettata": "\"The offering is fitting. For today grace will cover you: I will say no more.\"",
      "cattedrale.scattata": "Grace has covered you. You rise with 1 HP, and the danger moves away.",
      "cattedrale.protetto": "You are under Father Bartolomeo's grace, until tomorrow.",
      "cattedrale.svanita": "The protection has faded: today no grace covers you.",
      "cattedrale.scheda": "Under Father Bartolomeo's grace, until tomorrow.",
    },
  },
};
