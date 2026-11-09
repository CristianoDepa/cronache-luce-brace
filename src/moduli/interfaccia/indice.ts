import type { Contesto, DefinizioneModulo, PannelloVista, RigaVista, StatoGioco } from "../../core/indice";
import { CONTESTO_INFO_INDICE, VERSIONE_API, calcolaStatistiche } from "../../core/indice";
import { ILLUSTRAZIONI_INTERFACCIA } from "./grafica";

export const ID_INTERFACCIA = "interfaccia";
// Contesti delle schermate che non fanno parte del gioco vero e proprio.
export const CONTESTO_AVVIO = "avvio";
export const CONTESTO_OPZIONI = "opzioni";
export const CONTESTO_INFO_PERSONAGGIO = "info:personaggio";

function segno(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

function rigaStatistica(chiave: string, totale: number, base: number): RigaVista {
  return { chiave, parametri: { totale, base, bonus: segno(totale - base) } };
}

// Statistiche con la scomposizione base / bonus: il dettaglio di classe, oggetti ed effetti lo danno i moduli.
function pannelloStatistiche(stato: StatoGioco, ctx: Contesto): PannelloVista {
  const t = calcolaStatistiche(stato, ctx);
  const p = stato.personaggio;
  return {
    titoloChiave: "interfaccia.scheda.statistiche",
    contesti: [CONTESTO_INFO_PERSONAGGIO],
    righe: [
      rigaStatistica("interfaccia.scheda.riga.hp", t.hpMax, p.hpMaxBase),
      rigaStatistica("interfaccia.scheda.riga.forza", t.forza, p.forzaBase),
      rigaStatistica("interfaccia.scheda.riga.difesa", t.difesa, p.difesaBase),
    ],
  };
}

// Testi del client (intestazioni, opzioni, messaggi) e titolo del contesto di partenza.
export const moduloInterfaccia: DefinizioneModulo = {
  id: ID_INTERFACCIA,
  versioneApi: VERSIONE_API,
  dipende: [],
  contenuti: ILLUSTRAZIONI_INTERFACCIA,
  interfaccia: {
    titoliContesto: {
      [CONTESTO_INFO_INDICE]: "interfaccia.info.titolo",
      [CONTESTO_INFO_PERSONAGGIO]: "interfaccia.scheda.titolo",
    },
    illustrazioniContesto: {
      [CONTESTO_AVVIO]: "scena.avvio",
      [CONTESTO_OPZIONI]: "scena.opzioni",
      [CONTESTO_INFO_INDICE]: "scena.creazione",
      [CONTESTO_INFO_PERSONAGGIO]: "scena.creazione",
    },
    // "Torna indietro" dalle schede INFO riporta all'elenco (e dall'elenco al luogo da cui si è venuti).
    contestiPadre: { [CONTESTO_INFO_PERSONAGGIO]: CONTESTO_INFO_INDICE },
    menu: [
      // Il gruppo INFO ha una sola voce, "I" Informazioni, che apre l'elenco numerato delle schede (le liberano le lettere P, N, C).
      { id: "interfaccia.info", contesto: "info", etichettaChiave: "interfaccia.info.menu", tasto: "I", ordine: 10, comando: { tipo: "naviga", verso: CONTESTO_INFO_INDICE } },
      { id: "interfaccia.info.personaggio", contesto: CONTESTO_INFO_INDICE, etichettaChiave: "interfaccia.scheda.menu", tasto: "1", ordine: 10, comando: { tipo: "naviga", verso: CONTESTO_INFO_PERSONAGGIO } },
    ],
    pannelli(stato, ctx): readonly PannelloVista[] {
      return [pannelloStatistiche(stato, ctx)];
    },
  },
  testi: {
    it: {
      "interfaccia.titolo": "CRONACHE DI LUCE E BRACE",
      "interfaccia.sceltaLingua": "Scegli la lingua / Choose your language",
      "interfaccia.menuIniziale.titolo": "Bentornato, avventuriero",
      "interfaccia.menuIniziale.continua": "Continua la partita",
      "interfaccia.menuIniziale.nuova": "Nuova partita (sovrascrive il salvataggio)",
      "interfaccia.menuIniziale.nuovaSemplice": "Nuova partita",
      "interfaccia.nome.domanda": "Come ti chiami, avventuriero?",
      "interfaccia.nome.suggerimento": "Scrivi il nome e premi Invio (massimo 20 caratteri)",
      "interfaccia.nome.nonValido": "Il nome deve avere da 1 a 20 caratteri.",
      "interfaccia.scheda.livello": "Livello {livello} - Esperienza {esperienza}",
      "interfaccia.scheda.livelloBreve": "Livello {livello}",
      "interfaccia.scheda.livelloProssimo": "Livello {livello} - Esperienza {esperienza}/{necessaria}",
      "interfaccia.scheda.livelloPronto": "Livello {livello} - Esperienza {esperienza}/{necessaria} ★",
      "interfaccia.scheda.oro": "Oro {oro}",
      "interfaccia.scheda.forzaDifesa": "Forza {forza} - Difesa {difesa}",
      "interfaccia.prossimoGiorno": "Nuovo giorno tra {ore}h {minuti}m",
      "interfaccia.morto": "Sei morto. Tornerai in forze al prossimo giorno.",
      "interfaccia.indietro": "Torna indietro",
      "interfaccia.opzioni": "Opzioni",
      "interfaccia.opzioni.titolo": "Opzioni",
      "interfaccia.opzioni.lingua": "Cambia lingua (ora: Italiano)",
      "interfaccia.opzioni.sviluppo": "Comandi di prova",
      "interfaccia.opzioni.effetti": "Effetti grafici (ora: {valore})",
      "interfaccia.effetti.pieni": "Pieni",
      "interfaccia.effetti.ridotti": "Ridotti",
      "interfaccia.effetti.spenti": "Spenti",
      "interfaccia.opzioni.crt": "Effetto CRT (ora: {valore})",
      "interfaccia.crt.si": "Sì",
      "interfaccia.crt.no": "No",
      "interfaccia.opzioni.esporta": "Esporta il salvataggio in un file",
      "interfaccia.opzioni.importa": "Importa un salvataggio da file",
      "interfaccia.esportato": "Salvataggio esportato.",
      "interfaccia.importato": "Salvataggio importato.",
      "interfaccia.errore.salvataggio_corrotto": "Il salvataggio è danneggiato e non può essere letto.",
      "interfaccia.errore.salvataggio_assente": "Non c'è nessun salvataggio.",
      "interfaccia.errore.importazione": "File non valido: il salvataggio non è stato importato.",
      "interfaccia.errore.registro": "Errore di configurazione dei moduli:",
      "interfaccia.premiTasto": "Premi un tasto per scegliere.",
      "interfaccia.gruppo.gioco": "GIOCO",
      "interfaccia.gruppo.info": "INFO",
      "interfaccia.versione": "Versione {versione}",
      "interfaccia.scheda.titolo": "Il personaggio",
      "interfaccia.scheda.menu": "Il personaggio",
      "interfaccia.info.menu": "Informazioni",
      "interfaccia.info.titolo": "Informazioni",
      "interfaccia.scheda.statistiche": "Statistiche",
      "interfaccia.scheda.riga.hp": "HP massimi: {totale} (base {base}, bonus {bonus})",
      "interfaccia.scheda.riga.forza": "Forza: {totale} (base {base}, bonus {bonus})",
      "interfaccia.scheda.riga.difesa": "Difesa: {totale} (base {base}, bonus {bonus})",
      "interfaccia.gruppo.settaggi": "SETTAGGI",
      "interfaccia.opzioni.tornaAlGioco": "Torna al gioco",
      "interfaccia.impostazione.suggerimento": "Scrivi un numero intero da {min} a {max} e premi Invio. Invio da solo conferma {valore}.",
      "interfaccia.impostazione.nonValido": "Valore non valido: scrivi un numero intero da {min} a {max}.",
    },
    en: {
      "interfaccia.titolo": "CHRONICLES OF LIGHT AND EMBER",
      "interfaccia.sceltaLingua": "Scegli la lingua / Choose your language",
      "interfaccia.menuIniziale.titolo": "Welcome back, adventurer",
      "interfaccia.menuIniziale.continua": "Continue your game",
      "interfaccia.menuIniziale.nuova": "New game (overwrites the save)",
      "interfaccia.menuIniziale.nuovaSemplice": "New game",
      "interfaccia.nome.domanda": "What is your name, adventurer?",
      "interfaccia.nome.suggerimento": "Type your name and press Enter (up to 20 characters)",
      "interfaccia.nome.nonValido": "The name must be 1 to 20 characters long.",
      "interfaccia.scheda.livello": "Level {livello} - Experience {esperienza}",
      "interfaccia.scheda.livelloBreve": "Level {livello}",
      "interfaccia.scheda.livelloProssimo": "Level {livello} - Experience {esperienza}/{necessaria}",
      "interfaccia.scheda.livelloPronto": "Level {livello} - Experience {esperienza}/{necessaria} ★",
      "interfaccia.scheda.oro": "Gold {oro}",
      "interfaccia.scheda.forzaDifesa": "Strength {forza} - Defense {difesa}",
      "interfaccia.prossimoGiorno": "New day in {ore}h {minuti}m",
      "interfaccia.morto": "You are dead. You will recover on the next day.",
      "interfaccia.indietro": "Go back",
      "interfaccia.opzioni": "Options",
      "interfaccia.opzioni.titolo": "Options",
      "interfaccia.opzioni.lingua": "Change language (now: English)",
      "interfaccia.opzioni.sviluppo": "Test commands",
      "interfaccia.opzioni.effetti": "Graphics effects (now: {valore})",
      "interfaccia.effetti.pieni": "Full",
      "interfaccia.effetti.ridotti": "Reduced",
      "interfaccia.effetti.spenti": "Off",
      "interfaccia.opzioni.crt": "CRT effect (now: {valore})",
      "interfaccia.crt.si": "On",
      "interfaccia.crt.no": "Off",
      "interfaccia.opzioni.esporta": "Export the save to a file",
      "interfaccia.opzioni.importa": "Import a save from a file",
      "interfaccia.esportato": "Save exported.",
      "interfaccia.importato": "Save imported.",
      "interfaccia.errore.salvataggio_corrotto": "The save is damaged and cannot be read.",
      "interfaccia.errore.salvataggio_assente": "There is no save.",
      "interfaccia.errore.importazione": "Invalid file: the save was not imported.",
      "interfaccia.errore.registro": "Module configuration error:",
      "interfaccia.premiTasto": "Press a key to choose.",
      "interfaccia.gruppo.gioco": "GAME",
      "interfaccia.gruppo.info": "INFO",
      "interfaccia.versione": "Version {versione}",
      "interfaccia.scheda.titolo": "The character",
      "interfaccia.scheda.menu": "The character",
      "interfaccia.info.menu": "Information",
      "interfaccia.info.titolo": "Information",
      "interfaccia.scheda.statistiche": "Statistics",
      "interfaccia.scheda.riga.hp": "Max HP: {totale} (base {base}, bonus {bonus})",
      "interfaccia.scheda.riga.forza": "Strength: {totale} (base {base}, bonus {bonus})",
      "interfaccia.scheda.riga.difesa": "Defense: {totale} (base {base}, bonus {bonus})",
      "interfaccia.gruppo.settaggi": "SETTINGS",
      "interfaccia.opzioni.tornaAlGioco": "Back to the game",
      "interfaccia.impostazione.suggerimento": "Type a whole number from {min} to {max} and press Enter. Enter alone confirms {valore}.",
      "interfaccia.impostazione.nonValido": "Invalid value: type a whole number from {min} to {max}.",
    },
  },
};
