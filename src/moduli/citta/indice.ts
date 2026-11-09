import type { DefinizioneModulo } from "../../core/indice";
import { VERSIONE_API, puntoInizioGiorno, puntoRinascita, regola } from "../../core/indice";
import { ID_AZIONI } from "../azioni/indice";
import { azioneEntra, azioneEsci, azioneEsciEdificio, azioneRientra, azioneViaggia } from "./azioni";
import { ILLUSTRAZIONI_CIFRE } from "./cifre";
import { SITI, testiSiti } from "./dati";
import { ILLUSTRAZIONI_CITTA } from "./grafica";
import { interfacciaCitta } from "./interfaccia";
import { PARAMETRI_CITTA } from "./parametri";
import { ID_CITTA, statoCitta, tipoSito } from "./tipi";

export { ID_CITTA, statoCitta, tipoSito } from "./tipi";
export { puntoMovimento } from "./punti";
export type { CalcoloMovimento } from "./punti";
export type { CategoriaSito, Sito } from "./tipi";
export { DEFINIZIONI_SITI, chiaveDirezione, chiaveMappa, chiaveNome } from "./dati";
export { PARAMETRI_CITTA } from "./parametri";
export { calcolaCostoViaggio, costruisciGrafo, distanzeDa } from "./percorsi";
export { distanzeCitta, elencaSiti, leggiSito, origineViaggio, sitoCorrente, spostaIn } from "./uso";
import { spostaIn } from "./uso";
export { CONTESTO_MAPPA } from "./interfaccia";

// Al nuovo giorno il resto dei movimenti si azzera.
const regolaMovimentiGiornalieri = regola(puntoInizioGiorno, 95, (stato) => statoCitta.scrivi(stato, { ...statoCitta.leggi(stato), movimenti: 0 }));

// Dopo la morte si rinasce alla porta di partenza.
const regolaRinascita = regola(puntoRinascita, 100, (stato, ctx) => spostaIn(ctx.registro, stato, PARAMETRI_CITTA.sitoIniziale, 0));

const testi = testiSiti();

export const moduloCitta: DefinizioneModulo = {
  id: ID_CITTA,
  versioneApi: VERSIONE_API,
  dipende: [ID_AZIONI],
  tipiContenuto: [tipoSito],
  contenuti: [...SITI, ...ILLUSTRAZIONI_CITTA, ...ILLUSTRAZIONI_CIFRE],
  azioni: [azioneViaggia, azioneEsci, azioneRientra, azioneEntra, azioneEsciEdificio],
  regole: [regolaMovimentiGiornalieri, regolaRinascita],
  testi: {
    it: {
      ...testi.it,
      "citta.mappa.titolo": "Mappa e viaggi",
      "citta.mappa.porte.titolo": "Mappa: le porte",
      "citta.mappa.mura.titolo": "Mappa: le mura",
      "citta.mappa.piazze.titolo": "Mappa: piazze, vie e torre",
      "citta.cat.porte": "Le porte",
      "citta.cat.mura": "Le mura",
      "citta.cat.piazze": "Piazze, vie e Torre",
      "citta.cat.edifici": "Gli edifici",
      "citta.menu.mappa": "Mappa e viaggi",
      "citta.menu.rientra": "Torna alla porta",
      "citta.pannello.edifici": "Edifici qui",
      "citta.uscitaEdificio": "Esci: sei di nuovo {doveChiave}.",
      "citta.laterale": "Luogo: {luogoChiave}",
      "citta.pannello.descrizione": "{descrizioneChiave}",
      "citta.pannello.seiQui": "Sei qui: {luogoChiave}",
      "citta.pannello.accumulo": "Movimenti accumulati: {movimenti}/{perAzione} ({perAzione} movimenti consumano 1 azione)",
      "citta.pannello.destinazioni": "Destinazioni",
      "citta.pannello.costo": "[{tasto}] {luogoChiave} - {movimenti} {movimenti#movimento|movimenti}, {azioni} {azioni#azione|azioni}",
      "citta.pannello.quiSei": "[{tasto}] {luogoChiave} - sei qui",
      "citta.pannello.quiSeiNoto": "[{tasto}] {luogoChiave}: {contieneChiave} - sei qui",
      "citta.pannello.costoNoto": "[{tasto}] {luogoChiave}: {contieneChiave} - {movimenti} {movimenti#movimento|movimenti}, {azioni} {azioni#azione|azioni}",
      "citta.pannello.irraggiungibile": "[{tasto}] {luogoChiave} - non raggiungibile",
      "citta.arrivo": "Arrivi {doveChiave} ({movimenti} {movimenti#movimento|movimenti}, {azioni} {azioni#azione|azioni}).",
      "citta.uscita": "Esci dalle mura: {luogoChiave}.",
      "citta.rientro": "Rientri in città da {luogoChiave}.",
      "citta.errore.sito_inesistente": "Quel luogo non esiste.",
      "citta.errore.gia_qui": "Sei già qui.",
      "citta.errore.fuori_dalle_mura": "Sei fuori dalle mura: torna prima alla porta.",
      "citta.errore.non_raggiungibile": "Non c'è modo di arrivare fin lì.",
      "citta.errore.troppo_stanco": "Sei troppo stanco per arrivare fin lì: servono più azioni di quelle che hai.",
      "citta.errore.non_qui": "Non sei a quella porta.",
      "citta.errore.nessuna_uscita": "Da qui non si esce.",
      "citta.errore.non_in_area": "Non sei fuori dalle mura.",
      "citta.errore.edificio_non_qui": "Da qui non si entra in quell'edificio.",
      "citta.errore.non_in_edificio": "Non sei dentro un edificio.",
    },
    en: {
      ...testi.en,
      "citta.mappa.titolo": "Map and travel",
      "citta.mappa.porte.titolo": "Map: the gates",
      "citta.mappa.mura.titolo": "Map: the walls",
      "citta.mappa.piazze.titolo": "Map: squares, streets and tower",
      "citta.cat.porte": "The gates",
      "citta.cat.mura": "The walls",
      "citta.cat.piazze": "Squares, streets and Tower",
      "citta.cat.edifici": "The buildings",
      "citta.menu.mappa": "Map and travel",
      "citta.menu.rientra": "Return to the gate",
      "citta.pannello.edifici": "Buildings here",
      "citta.uscitaEdificio": "You step out: you are back {doveChiave}.",
      "citta.laterale": "Place: {luogoChiave}",
      "citta.pannello.descrizione": "{descrizioneChiave}",
      "citta.pannello.seiQui": "You are here: {luogoChiave}",
      "citta.pannello.accumulo": "Accumulated moves: {movimenti}/{perAzione} ({perAzione} moves use 1 action)",
      "citta.pannello.destinazioni": "Destinations",
      "citta.pannello.costo": "[{tasto}] {luogoChiave} - {movimenti} {movimenti#move|moves}, {azioni} {azioni#action|actions}",
      "citta.pannello.quiSei": "[{tasto}] {luogoChiave} - you are here",
      "citta.pannello.quiSeiNoto": "[{tasto}] {luogoChiave}: {contieneChiave} - you are here",
      "citta.pannello.costoNoto": "[{tasto}] {luogoChiave}: {contieneChiave} - {movimenti} {movimenti#move|moves}, {azioni} {azioni#action|actions}",
      "citta.pannello.irraggiungibile": "[{tasto}] {luogoChiave} - unreachable",
      "citta.arrivo": "You arrive {doveChiave} ({movimenti} {movimenti#move|moves}, {azioni} {azioni#action|actions}).",
      "citta.uscita": "You leave the walls: {luogoChiave}.",
      "citta.rientro": "You return to the city through {luogoChiave}.",
      "citta.errore.sito_inesistente": "That place does not exist.",
      "citta.errore.gia_qui": "You are already here.",
      "citta.errore.fuori_dalle_mura": "You are outside the walls: go back to the gate first.",
      "citta.errore.non_raggiungibile": "There is no way to get there.",
      "citta.errore.troppo_stanco": "You are too tired to get there: you need more actions than you have.",
      "citta.errore.non_qui": "You are not at that gate.",
      "citta.errore.nessuna_uscita": "You cannot leave from here.",
      "citta.errore.non_in_area": "You are not outside the walls.",
      "citta.errore.edificio_non_qui": "You cannot enter that building from here.",
      "citta.errore.non_in_edificio": "You are not inside a building.",
    },
  },
  stato: statoCitta,
  interfaccia: interfacciaCitta,
};

