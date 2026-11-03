import { describe, expect, it } from "vitest";
import type { Lingua } from "../../src/core/indice";
import { DURATA_CICLO_MS, creaRng, creaStatoIniziale } from "../../src/core/indice";
import { creaArchivioStorage } from "../../src/adattatori/locale/archivioStorage";
import { creaGatewayLocale } from "../../src/adattatori/locale/gatewayLocale";
import { creaApp } from "../../src/client/app";
import type { Piattaforma, PreferenzeUi } from "../../src/client/app";
import { creaPreferenzeStorage } from "../../src/client/preferenze";
import type { Schermata } from "../../src/client/schermata";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { serializzaPartita } from "../../src/porte/archivio";
import { LUGLIO, contenitoreInMemoria, orologioModificabile, registroDa } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);

interface Ambiente {
  readonly contenitore: ReturnType<typeof contenitoreInMemoria>;
  readonly orologio: ReturnType<typeof orologioModificabile>;
  readonly scaricati: { nomeFile: string; testo: string }[];
  fileDaScegliere: string | undefined;
  nuovaApp(): ReturnType<typeof creaApp>;
}

function creaAmbiente(lingua?: Lingua): Ambiente {
  const contenitore = contenitoreInMemoria();
  const orologio = orologioModificabile(LUGLIO);
  const preferenze: PreferenzeUi = creaPreferenzeStorage(contenitore);
  if (lingua) preferenze.salvaLingua(lingua);
  const ambiente: Ambiente = {
    contenitore,
    orologio,
    scaricati: [],
    fileDaScegliere: undefined,
    nuovaApp() {
      const gateway = creaGatewayLocale(registro, creaArchivioStorage(contenitore), orologio, creaRng(5));
      const piattaforma: Piattaforma = {
        adesso: () => orologio.adesso(),
        scarica: (nomeFile, testo) => void ambiente.scaricati.push({ nomeFile, testo }),
        scegliFile: async () => ambiente.fileDaScegliere,
      };
      return creaApp(gateway, creaPreferenzeStorage(contenitore), piattaforma, () => undefined);
    },
  };
  return ambiente;
}

// Avvio di una partita nuova: lingua già scelta, "Nuova partita", nome, turni al giorno (Invio = valore proposto).
async function iniziaPartita(app: ReturnType<typeof creaApp>, nome: string, turni = ""): Promise<void> {
  await app.avvia();
  await app.premiTasto("2");
  await app.inviaTesto(nome);
  await app.inviaTesto(turni);
}

const testo = (s: Schermata): string => s.righe.map((r) => r.map((x) => x.testo).join("")).join("\n");
const tasti = (s: Schermata): string[] => s.scelte.map((x) => x.tasto);

describe("flusso di avvio", () => {
  it("al primo avvio chiede la lingua, poi il nome, poi la classe", async () => {
    const amb = creaAmbiente();
    const app = amb.nuovaApp();
    await app.avvia();
    expect(app.stato().fase).toBe("lingua");
    expect(tasti(app.schermata())).toEqual(["1", "2"]);

    await app.premiTasto("2");
    expect(app.stato().lingua).toBe("en");
    expect(creaPreferenzeStorage(amb.contenitore).leggiLingua()).toBe("en");
    expect(app.stato().fase).toBe("menuIniziale");
    expect(tasti(app.schermata())).toEqual(["2", "I"]);

    await app.premiTasto("2");
    expect(app.stato().fase).toBe("nome");
    expect(app.schermata().input).toBe(true);

    await app.inviaTesto("Zed");
    // Alla creazione si chiedono anche gli incontri al giorno: 30 è già proposto.
    expect(app.stato().fase).toBe("impostazione");
    expect(testo(app.schermata())).toContain("Encounters per day (now: 30)");
    for (const sbagliato of ["3", "101", "abc", "12.5"]) {
      await app.inviaTesto(sbagliato);
      expect(app.stato().fase, sbagliato).toBe("impostazione");
      expect(testo(app.schermata())).toContain("Invalid value");
    }
    await app.inviaTesto("40");
    expect(app.stato().fase).toBe("gioco");
    expect(app.stato().vista?.impostazioni[0]?.valore).toBe(40);
    const creazione = app.schermata();
    expect(testo(creazione)).toContain("Choose your class");
    expect(testo(creazione)).toContain("Knight");
    expect(tasti(creazione)).toEqual(["1", "2", "3", "O"]);
  });

  it("rifiuta nomi vuoti o troppo lunghi e accetta quello valido", async () => {
    const app = creaAmbiente("it").nuovaApp();
    await app.avvia();
    await app.premiTasto("2");
    expect(app.stato().fase).toBe("nome");
    for (const nome of ["", "   ", "x".repeat(21)]) {
      await app.inviaTesto(nome);
      expect(app.stato().fase).toBe("nome");
      expect(testo(app.schermata())).toContain("da 1 a 20 caratteri");
    }
    await app.inviaTesto("  Aldo ");
    expect(app.stato().vista?.personaggio.nome).toBe("Aldo");
  });

  it("con un salvataggio esistente mostra il menu iniziale e permette di continuare", async () => {
    const amb = creaAmbiente("en");
    const prima = amb.nuovaApp();
    await iniziaPartita(prima, "Zed");
    await prima.premiTasto("2");
    const dopo = amb.nuovaApp();
    await dopo.avvia();
    expect(dopo.stato().fase).toBe("menuIniziale");
    expect(tasti(dopo.schermata())).toEqual(["1", "2", "I"]);
    expect(testo(dopo.schermata())).toContain("Welcome back");
    await dopo.premiTasto("1");
    expect(dopo.stato().fase).toBe("gioco");
    expect(dopo.stato().vista?.contestoForzato).toBeUndefined();
  });

  it("segnala un salvataggio danneggiato e offre solo nuova partita o importazione", async () => {
    const amb = creaAmbiente("it");
    amb.contenitore.dati.set("clb.partita", "{ rotto");
    const app = amb.nuovaApp();
    await app.avvia();
    expect(app.stato().fase).toBe("menuIniziale");
    expect(testo(app.schermata())).toContain("danneggiato");
    expect(tasti(app.schermata())).toEqual(["2", "I"]);
  });

  it("dopo 24 ore continuare applica il nuovo giorno e lo racconta", async () => {
    const amb = creaAmbiente("it");
    const prima = amb.nuovaApp();
    await iniziaPartita(prima, "Aldo");
    amb.orologio.avanza(DURATA_CICLO_MS);
    const dopo = amb.nuovaApp();
    await dopo.avvia();
    await dopo.premiTasto("1");
    expect(testo(dopo.schermata())).toContain("Un nuovo giorno comincia.");
  });
});

describe("una giornata nel villaggio e nella foresta", () => {
  async function giocatore(lingua: Lingua = "it") {
    const app = creaAmbiente(lingua).nuovaApp();
    await iniziaPartita(app, "Aldo");
    await app.premiTasto("1"); // Cavaliere
    return app;
  }

  it("il villaggio mostra il menu dei moduli e gli incontri rimasti", async () => {
    const app = await giocatore();
    const s = app.schermata();
    expect(tasti(s)).toEqual(["F", "A", "S", "G", "B", "L", "M", "O"]);
    expect(testo(s)).toContain("Il Villaggio");
    expect(testo(s)).toContain("Incontri rimasti oggi: 30/30");
    expect(testo(s)).toContain("HP 30/30");
  });

  it("si naviga nella foresta, si incontra un nemico e si torna indietro con 0", async () => {
    const app = await giocatore();
    await app.premiTasto("f"); // le minuscole funzionano
    expect(testo(app.schermata())).toContain("La Foresta");
    expect(tasti(app.schermata())).toEqual(["E", "0", "O"]);
    await app.premiTasto("0");
    expect(app.stato().navigazione).toBe("villaggio");
    await app.premiTasto("F");
    await app.premiTasto("E");
    const combattimento = app.schermata();
    expect(tasti(combattimento)).toEqual(["A", "F", "O"]);
    expect(testo(combattimento)).toContain("Combattimento");
    expect(testo(combattimento)).toContain("Il nemico");
    expect(testo(combattimento)).toContain("Round 1");
  });

  it("combattendo fino alla fine si torna alla foresta con l'esito nel registro", async () => {
    const app = await giocatore();
    await app.premiTasto("F");
    await app.premiTasto("E");
    for (let i = 0; i < 40 && app.stato().vista?.contestoForzato === "combattimento"; i++) {
      await app.premiTasto("A");
    }
    expect(app.stato().vista?.contestoForzato).toBeUndefined();
    expect(testo(app.schermata())).toMatch(/Vittoria!|sconfitto/);
    expect(testo(app.schermata())).toContain("Incontri rimasti oggi: 29/30");
  });

  it("i tasti sconosciuti non fanno nulla", async () => {
    const app = await giocatore();
    const prima = app.stato();
    await app.premiTasto("Z");
    await app.premiTasto("9");
    expect(app.stato()).toBe(prima);
  });

  it("l'interfaccia funziona anche in inglese", async () => {
    const app = await giocatore("en");
    expect(testo(app.schermata())).toContain("The Village");
    expect(testo(app.schermata())).toContain("Enter the forest");
  });
});

describe("opzioni, esportazione e importazione", () => {
  it("le opzioni cambiano lingua, esportano il salvataggio e tornano al gioco", async () => {
    const amb = creaAmbiente("it");
    const app = amb.nuovaApp();
    await iniziaPartita(app, "Aldo");
    await app.premiTasto("O");
    expect(app.stato().fase).toBe("opzioni");
    expect(tasti(app.schermata())).toEqual(["0", "L", "T", "E", "I"]);

    await app.premiTasto("L");
    expect(app.stato().lingua).toBe("en");
    expect(creaPreferenzeStorage(amb.contenitore).leggiLingua()).toBe("en");
    expect(testo(app.schermata())).toContain("Options");

    await app.premiTasto("E");
    expect(amb.scaricati).toHaveLength(1);
    expect(amb.scaricati[0]?.nomeFile).toBe("clb-salvataggio.json");
    expect(amb.scaricati[0]?.testo).toContain("Aldo");
    expect(testo(app.schermata())).toContain("Save exported.");

    await app.premiTasto("0");
    expect(app.stato().fase).toBe("gioco");
  });

  it("importare un file valido sostituisce la partita", async () => {
    const amb = creaAmbiente("it");
    const app = amb.nuovaApp();
    await iniziaPartita(app, "Aldo");
    amb.fileDaScegliere = serializzaPartita(creaStatoIniziale(registro, "Importato", LUGLIO));
    await app.premiTasto("O");
    await app.premiTasto("I");
    expect(app.stato().vista?.personaggio.nome).toBe("Importato");
    expect(app.stato().fase).toBe("gioco");
    expect(testo(app.schermata())).toContain("Salvataggio importato.");
  });

  it("un file non valido o l'annullamento non cambiano nulla", async () => {
    const amb = creaAmbiente("en");
    const app = amb.nuovaApp();
    await iniziaPartita(app, "Aldo");
    await app.premiTasto("O");
    amb.fileDaScegliere = "non è un salvataggio";
    await app.premiTasto("I");
    expect(testo(app.schermata())).toContain("Invalid file");
    expect(app.stato().vista?.personaggio.nome).toBe("Aldo");
    amb.fileDaScegliere = undefined;
    const prima = app.stato();
    await app.premiTasto("I");
    expect(app.stato()).toBe(prima);
  });

  it("un personaggio morto può solo aprire le opzioni", async () => {
    const amb = creaAmbiente("en");
    const app = amb.nuovaApp();
    await app.avvia();
    const base = creaStatoIniziale(registro, "Fantasma", LUGLIO);
    const morto = { ...base, personaggio: { ...base.personaggio, hp: 0, morto: true } };
    amb.fileDaScegliere = serializzaPartita(morto);
    await app.premiTasto("I");
    expect(tasti(app.schermata())).toEqual(["O"]);
    expect(testo(app.schermata())).toContain("You are dead");
  });
});

describe("separatore GIOCO / SETTAGGI e grafica", () => {
  async function giocatore() {
    const app = creaAmbiente("it").nuovaApp();
    await iniziaPartita(app, "Aldo");
    await app.premiTasto("1");
    return app;
  }

  it("il villaggio separa le voci di gioco dai settaggi con un delimitatore", async () => {
    const app = await giocatore();
    const righe = testo(app.schermata()).split("\n");
    const iGioco = righe.findIndex((r) => r.startsWith("── GIOCO"));
    const iSettaggi = righe.findIndex((r) => r.startsWith("── SETTAGGI"));
    const iForesta = righe.findIndex((r) => r.includes("[F]"));
    const iOpzioni = righe.findIndex((r) => r.includes("[O]"));
    expect(iGioco).toBeGreaterThanOrEqual(0);
    expect(iGioco).toBeLessThan(iForesta);
    expect(iForesta).toBeLessThan(iSettaggi);
    expect(iSettaggi).toBeLessThan(iOpzioni);
  });

  it("le righe del separatore non superano le 80 colonne e i titoli seguono la lingua", async () => {
    const app = creaAmbiente("en").nuovaApp();
    await iniziaPartita(app, "Zed");
    await app.premiTasto("1");
    const righe = testo(app.schermata()).split("\n");
    expect(righe.some((r) => r.startsWith("── GAME"))).toBe(true);
    expect(righe.some((r) => r.startsWith("── SETTINGS"))).toBe(true);
    for (const r of righe) expect(Array.from(r).length).toBeLessThanOrEqual(80);
  });

  it("la schermata delle opzioni ha i due gruppi; 'Torna al gioco' sta sotto GIOCO", async () => {
    const app = await giocatore();
    await app.premiTasto("O");
    const righe = testo(app.schermata()).split("\n");
    const iGioco = righe.findIndex((r) => r.startsWith("── GIOCO"));
    const iTorna = righe.findIndex((r) => r.includes("[0]"));
    const iSettaggi = righe.findIndex((r) => r.startsWith("── SETTAGGI"));
    const iTurni = righe.findIndex((r) => r.includes("[T]"));
    expect(iGioco).toBeLessThan(iTorna);
    expect(iTorna).toBeLessThan(iSettaggi);
    expect(iSettaggi).toBeLessThan(iTurni);
  });

  it("senza salvataggio il menu iniziale propone 'Nuova partita' senza avvertire di sovrascritture", async () => {
    const app = creaAmbiente("it").nuovaApp();
    await app.avvia();
    expect(testo(app.schermata())).toContain("[2] Nuova partita");
    expect(testo(app.schermata())).not.toContain("sovrascrive");
  });

  it("la scelta della lingua ha un solo gruppo e quindi nessun delimitatore", async () => {
    const app = creaAmbiente().nuovaApp();
    await app.avvia();
    expect(testo(app.schermata())).not.toContain("── ");
  });

  it("ogni schermata mostra un disegno prima del testo", async () => {
    const app = await giocatore();
    const primaRiga = (s: Schermata): string => s.righe[0]?.map((x) => x.testo).join("") ?? "";
    expect(primaRiga(app.schermata()).trim().length).toBeGreaterThan(0);
    expect(testo(app.schermata())).toContain("[]"); // finestre delle case del villaggio
    await app.premiTasto("A");
    expect(testo(app.schermata())).toContain("L'Armeria");
    expect(testo(app.schermata())).toContain("\\/"); // spade incrociate
    await app.premiTasto("0");
    await app.premiTasto("L");
    expect(testo(app.schermata())).toMatch(/\(\*\)|\(\(\*\)/);
  });

  it("l'armeria elenca le armi con prezzi e si compra con i tasti numerici", async () => {
    const app = await giocatore();
    await app.premiTasto("A");
    const s = app.schermata();
    expect(tasti(s)).toEqual(["1", "2", "3", "4", "5", "0", "O"]);
    expect(testo(s)).toContain("[1] Spada liv. 1");
    expect(testo(s)).toContain("50 monete");
    await app.premiTasto("1");
    expect(testo(app.schermata())).toContain("non hai abbastanza monete".replace("non", "Non"));
  });

  it("dalle opzioni si cambiano gli incontri al giorno con effetto immediato", async () => {
    const app = await giocatore();
    await app.premiTasto("O");
    expect(testo(app.schermata())).toContain("Incontri al giorno (ora: 30)");
    await app.premiTasto("T");
    expect(app.stato().fase).toBe("impostazione");
    await app.inviaTesto("50");
    expect(app.stato().fase).toBe("opzioni");
    expect(testo(app.schermata())).toContain("Incontri al giorno (ora: 50)");
    await app.premiTasto("0");
    expect(testo(app.schermata())).toContain("Incontri rimasti oggi: 50/50");
  });

  it("Invio da solo conferma il valore attuale senza cambiarlo", async () => {
    const app = await giocatore();
    await app.premiTasto("O");
    await app.premiTasto("T");
    await app.inviaTesto("");
    expect(app.stato().fase).toBe("opzioni");
    expect(app.stato().vista?.impostazioni[0]?.valore).toBe(30);
  });
});
