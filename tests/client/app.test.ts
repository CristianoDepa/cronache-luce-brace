import { describe, expect, it } from "vitest";
import type { Lingua } from "../../src/core/indice";
import { DURATA_CICLO_MS, creaRng, creaStatoIniziale } from "../../src/core/indice";
import { creaArchivioStorage } from "../../src/adattatori/locale/archivioStorage";
import { creaGatewayLocale } from "../../src/adattatori/locale/gatewayLocale";
import { creaApp } from "../../src/client/app";
import type { Piattaforma, PreferenzeUi } from "../../src/client/app";
import { creaPreferenzeStorage } from "../../src/client/preferenze";
import { ANSI } from "../../src/client/ansi";
import { coloreMana } from "../../src/client/schermata";
import type { Schermata } from "../../src/client/schermata";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { VERSIONE_GIOCO } from "../../src/versione";
import { serializzaPartita } from "../../src/porte/archivio";
import { LUGLIO, contenitoreInMemoria, orologioModificabile, registroDa } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);

interface Ambiente {
  readonly contenitore: ReturnType<typeof contenitoreInMemoria>;
  readonly orologio: ReturnType<typeof orologioModificabile>;
  readonly scaricati: { nomeFile: string; testo: string }[];
  fileDaScegliere: string | undefined;
  movimentoRidotto: boolean;
  sviluppo: boolean;
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
    movimentoRidotto: false,
    sviluppo: false,
    nuovaApp() {
      const gateway = creaGatewayLocale(registro, creaArchivioStorage(contenitore), orologio, creaRng(5));
      const piattaforma: Piattaforma = {
        adesso: () => orologio.adesso(),
        scarica: (nomeFile, testo) => void ambiente.scaricati.push({ nomeFile, testo }),
        scegliFile: async () => ambiente.fileDaScegliere,
        movimentoRidotto: () => ambiente.movimentoRidotto,
        sviluppo: () => ambiente.sviluppo,
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

// Raggiunge un luogo dalla mappa: M, la categoria (1 porte, 2 mura, 3 piazze e torre) e il numero del luogo.
async function vai(app: ReturnType<typeof creaApp>, categoria: string, luogo: string): Promise<void> {
  await app.premiTasto("M");
  await app.premiTasto(categoria);
  await app.premiTasto(luogo);
}

// Raggiunge un edificio: cammina fino al suo luogo ospite (dalla mappa) e vi entra con il tasto d'ingresso.
// Armeria e Sartoria: Piazza dell'Anfiteatro (lettere A e S); Banca: San Michele (B); Guaritore: Napoleone (U); Locanda: Porta San Pietro (L).
async function entraIn(app: ReturnType<typeof creaApp>, edificio: "armeria" | "sartoria" | "banca" | "guaritore" | "locanda"): Promise<void> {
  const dove = { armeria: ["4", "A"], sartoria: ["4", "S"], banca: ["2", "B"], guaritore: ["3", "U"], locanda: [undefined, "L"] } as const;
  const [piazza, tasto] = dove[edificio];
  if (piazza !== undefined) await vai(app, "3", piazza);
  await app.premiTasto(tasto);
}

// Testo di tutta la schermata: prima la colonna di sinistra (il gioco), poi quella di destra (disegno e scheda).
const testo = (s: Schermata): string => [...s.sinistra, ...s.destra].map((r) => r.map((x) => x.testo).join("")).join("\n");
// Vero se la schermata ha un'immagine (la mostra la colonna di destra).
const haDisegno = (s: Schermata): boolean => s.immagine !== undefined && s.immagine.altezza > 20;
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
    expect(testo(app.schermata())).toContain("Actions per day (now: 50)");
    for (const sbagliato of ["3", "101", "abc", "12.5"]) {
      await app.inviaTesto(sbagliato);
      expect(app.stato().fase, sbagliato).toBe("impostazione");
      expect(testo(app.schermata())).toContain("Invalid value");
    }
    await app.inviaTesto("40");
    expect(app.stato().fase).toBe("gioco");
    expect(app.stato().vista?.impostazioni.find((i) => i.id === "azioni.giorno")?.valore).toBe(40);
    const creazione = app.schermata();
    expect(testo(creazione)).toContain("Choose your class");
    expect(testo(creazione)).toContain("Knight");
    expect(tasti(creazione)).toEqual(["1", "2", "3", "D", "O"]); // le tre classi e le descrizioni complete
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

describe("una giornata in città e nella foresta", () => {
  async function giocatore(lingua: Lingua = "it") {
    const app = creaAmbiente(lingua).nuovaApp();
    await iniziaPartita(app, "Aldo");
    await app.premiTasto("1"); // Cavaliere
    return app;
  }

  it("si parte alla Porta San Pietro: addentrarsi nella foresta, mappa, luogo e azioni rimaste a destra", async () => {
    const app = await giocatore();
    const s = app.schermata();
    expect(tasti(s)).toEqual(["F", "L", "M", "I", "O"]); // F = Addentrati nella foresta; il comando "Parla" non c'è dove non c'è nessuno
    expect(testo(s)).toContain("Porta San Pietro");
    expect(testo(s)).toContain("Luogo: Porta San Pietro");
    expect(testo(s)).toContain("Azioni 50/50");
    expect(testo(s)).toContain("Aldo");
  });

  it("il bestiario si apre a livelli: famiglie, mostri con il loro nome, scheda; i numeri portano avanti e 0 torna indietro di un livello", async () => {
    const app = await giocatore();
    await app.premiTasto("F"); // esplora: uno scontro (si può solo scoprire un mostro)
    await app.premiTasto("T"); // combatti fino alla fine
    expect(app.stato().vista?.contestoForzato).toBeUndefined();
    await app.premiTasto("I");
    await app.premiTasto("5");
    expect(app.stato().navigazione).toBe("info:bestiario");
    expect(tasti(app.schermata())).toEqual(["1", "0", "O"]); // una sola famiglia incontrata, numerata 1
    expect(testo(app.schermata())).toContain("Animali (1)");
    await app.premiTasto("1");
    expect(app.stato().navigazione).toBe("info:bestiario:famiglia"); // l'azione ha portato alla schermata successiva
    expect(tasti(app.schermata())).toEqual(["1", "0", "O"]);
    expect(testo(app.schermata())).toMatch(/\[1\] (Ratto gigante|Lupo famelico)/); // il numero porta il nome del mostro
    await app.premiTasto("1");
    expect(app.stato().navigazione).toBe("info:bestiario:scheda");
    expect(testo(app.schermata())).toContain("Punti vita");
    expect(testo(app.schermata())).toContain("Premio:");
    await app.premiTasto("0");
    expect(app.stato().navigazione).toBe("info:bestiario:famiglia");
    await app.premiTasto("0");
    expect(app.stato().navigazione).toBe("info:bestiario");
  });

  it("dalla porta ci si addentra nella foresta (senza schermata intermedia) e si incontra un nemico", async () => {
    const app = await giocatore();
    expect(testo(app.schermata())).toContain("Addentrati nella foresta");
    expect(testo(app.schermata())).toContain("Luogo: Porta San Pietro");
    expect(testo(app.schermata())).toContain("Azioni 50/50");
    await app.premiTasto("f"); // le minuscole funzionano
    const combattimento = app.schermata();
    expect(tasti(combattimento)).toEqual(["A", "T", "S", "F", "O"]); // T = combatti fino alla fine; la seconda abilità si vede solo dal livello 4
    expect(testo(combattimento)).toContain("Combattimento");
    expect(testo(combattimento)).toContain("Il nemico");
    expect(testo(combattimento)).toContain("Round 1");
  });

  it("combattendo fino alla fine si torna alla foresta con l'esito nel registro", async () => {
    const app = await giocatore();
    await app.premiTasto("F"); // addentrati nella foresta (dalla porta)
    for (let i = 0; i < 40 && app.stato().vista?.contestoForzato === "combattimento"; i++) {
      await app.premiTasto("A");
    }
    expect(app.stato().vista?.contestoForzato).toBeUndefined();
    expect(testo(app.schermata())).toMatch(/Vittoria!|sconfitto/);
    expect(testo(app.schermata())).toContain("Azioni 49/50");
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
    expect(testo(app.schermata())).toContain("San Pietro Gate");
    expect(testo(app.schermata())).toContain("Venture into the forest");
  });
});

describe("opzioni, esportazione e importazione", () => {
  it("le opzioni cambiano lingua, esportano il salvataggio e tornano al gioco", async () => {
    const amb = creaAmbiente("it");
    const app = amb.nuovaApp();
    await iniziaPartita(app, "Aldo");
    await app.premiTasto("O");
    expect(app.stato().fase).toBe("opzioni");
    expect(tasti(app.schermata())).toEqual(["0", "L", "G", "C", "A", "S", "T", "E", "I"]); // A e S: combattimento automatico e soglia di sicurezza

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
    // Da morti restano solo le schermate INFO e le opzioni
    expect(tasti(app.schermata())).toEqual(["I", "O"]);
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

  it("la porta separa le voci di gioco dai settaggi con un delimitatore", async () => {
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
    // i delimitatori stanno in 80 colonne (le descrizioni dei luoghi possono andare a capo)
    for (const r of righe.filter((x) => x.startsWith("──"))) expect(Array.from(r).length).toBeLessThanOrEqual(80);
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

  it("ogni schermata mostra il suo disegno nella colonna di destra", async () => {
    const app = await giocatore();
    expect(haDisegno(app.schermata())).toBe(true); // porta
    await app.premiTasto("M");
    expect(haDisegno(app.schermata())).toBe(true); // mappa
    await app.premiTasto("0");
    for (const edificio of ["locanda", "armeria", "sartoria", "banca", "guaritore"] as const) {
      await entraIn(app, edificio);
      expect(haDisegno(app.schermata()), edificio).toBe(true);
      await app.premiTasto("E"); // si esce in strada: da lì si prosegue
    }
    await app.premiTasto("O");
    expect(haDisegno(app.schermata())).toBe(true); // opzioni
  });

  it("la scheda del personaggio sta a destra, il testo del gioco a sinistra", async () => {
    const app = await giocatore();
    const s = app.schermata();
    const sinistra = s.sinistra.map((r) => r.map((x) => x.testo).join("")).join("\n");
    const destra = s.destra.map((r) => r.map((x) => x.testo).join("")).join("\n");
    expect(sinistra).toContain("Porta San Pietro");
    expect(sinistra).toContain("[F]");
    expect(sinistra).not.toContain("Livello 1");
    expect(destra).toContain("Aldo");
    expect(destra).toContain("Livello 1");
    expect(destra).toContain("HP ");
    expect(destra).toContain("Forza 5");
    expect(destra).toMatch(/Nuovo giorno tra \d+h \d+m/);
    expect(destra).toContain("█"); // barra HP e pixel del disegno
  });

  it("l'armeria elenca le armi con prezzi e si compra con i tasti numerici", async () => {
    const app = await giocatore();
    await entraIn(app, "armeria"); // 12 movimenti fino a Via Fillungo e 3 per entrare: 1 azione
    const s = app.schermata();
    expect(tasti(s)).toEqual(["1", "2", "3", "4", "5", "6", "M", "E", "I", "O"]); // 4 armi comuni, la tua, l'arma di riserva
    expect(testo(s)).toContain("[1] Spada liv. 1 (taglio)");
    expect(testo(s)).toContain("63 monete");
    expect(testo(s)).toContain("[5] Spadone liv. 1");
    expect(testo(s)).toContain("differenza rispetto a ciò che indossi");
    await app.premiTasto("1");
    expect(testo(app.schermata())).toContain("non hai abbastanza monete".replace("non", "Non"));
  });

  it("dalle opzioni si cambiano le azioni al giorno con effetto immediato", async () => {
    const app = await giocatore();
    await app.premiTasto("O");
    expect(testo(app.schermata())).toContain("Azioni al giorno (ora: 50)");
    await app.premiTasto("T");
    expect(app.stato().fase).toBe("impostazione");
    await app.inviaTesto("80");
    expect(app.stato().fase).toBe("opzioni");
    expect(testo(app.schermata())).toContain("Azioni al giorno (ora: 80)");
    await app.premiTasto("0");
    expect(testo(app.schermata())).toContain("Azioni 80/80");
  });

  it("Invio da solo conferma il valore attuale senza cambiarlo", async () => {
    const app = await giocatore();
    await app.premiTasto("O");
    await app.premiTasto("T");
    await app.inviaTesto("");
    expect(app.stato().fase).toBe("opzioni");
    expect(app.stato().vista?.impostazioni.find((i) => i.id === "azioni.giorno")?.valore).toBe(50);
  });
});

describe("pulizia dello schermo e aggiornamento", () => {
  async function giocatore(lingua: Lingua = "it") {
    const amb = creaAmbiente(lingua);
    const app = amb.nuovaApp();
    await iniziaPartita(app, "Aldo");
    await app.premiTasto("1");
    return { amb, app };
  }

  it("spostandosi in un altro luogo il registro degli eventi si svuota", async () => {
    const { app } = await giocatore();
    expect(app.stato().log.length).toBeGreaterThan(0); // "Hai scelto la classe"
    await vai(app, "2", "1"); // ci si sposta (sulle mura): restano solo gli eventi dell'arrivo
    expect(app.stato().log).toHaveLength(1);
    expect(app.stato().log[0]?.testo).toContain("Arrivi");
  });

  it("finita la creazione lo schermo riparte pulito, senza avvisi dei passaggi precedenti", async () => {
    const app = creaAmbiente("it").nuovaApp();
    await app.avvia();
    await app.premiTasto("2");
    await app.inviaTesto("Aldo");
    await app.inviaTesto("3"); // non valido
    expect(testo(app.schermata())).toContain("Valore non valido");
    await app.inviaTesto("100");
    expect(app.stato().fase).toBe("gioco");
    expect(app.stato().log).toHaveLength(0);
    expect(testo(app.schermata())).not.toContain("Valore non valido");
    expect(testo(app.schermata())).not.toContain("Azioni al giorno impostate a 100");
  });

  it("dalle opzioni la conferma di un settaggio resta visibile", async () => {
    const { app } = await giocatore();
    await app.premiTasto("O");
    await app.premiTasto("T");
    await app.inviaTesto("80");
    expect(testo(app.schermata())).toContain("Azioni al giorno impostate a 80");
  });

  it("scaduto il giorno, controllaNuovoGiorno lo applica senza ricaricare la pagina", async () => {
    const { amb, app } = await giocatore();
    await app.premiTasto("F"); // addentrati nella foresta (dalla porta)
    const prima = app.stato().vista?.prossimoReset ?? 0;
    amb.orologio.avanza(DURATA_CICLO_MS - 60_000);
    await app.controllaNuovoGiorno();
    expect(app.stato().vista?.prossimoReset).toBe(prima); // manca ancora un minuto
    amb.orologio.avanza(60_000);
    await app.controllaNuovoGiorno();
    expect(app.stato().vista?.prossimoReset).toBeGreaterThan(prima);
    expect(testo(app.schermata())).toContain("Un nuovo giorno comincia.");
  });

  it("la chiave della schermata cambia con il contesto e non con le azioni dentro lo stesso", async () => {
    const { app } = await giocatore();
    const villaggio = app.schermata().chiave;
    await app.premiTasto("F"); // addentrati nella foresta: scontro
    const combattimento = app.schermata().chiave;
    expect(combattimento).not.toBe(villaggio);
    await app.premiTasto("A");
    expect(app.schermata().chiave).toBe(combattimento);
  });
});

describe("schermate INFO: il personaggio e le statistiche incontri", () => {
  async function giocatore(lingua: Lingua = "it") {
    const amb = creaAmbiente(lingua);
    const app = amb.nuovaApp();
    await iniziaPartita(app, "Aldo");
    await app.premiTasto("1"); // Cavaliere
    return { amb, app };
  }
  const sx = (s: Schermata): string => s.sinistra.map((r) => r.map((x) => x.testo).join("")).join("\n");

  it("il menu ha tre gruppi nell'ordine GIOCO, INFO, SETTAGGI", async () => {
    const { app } = await giocatore();
    const righe = sx(app.schermata()).split("\n");
    const iGioco = righe.findIndex((r) => r.startsWith("── GIOCO"));
    const iInfo = righe.findIndex((r) => r.startsWith("── INFO"));
    const iSettaggi = righe.findIndex((r) => r.startsWith("── SETTAGGI"));
    expect(iGioco).toBeGreaterThanOrEqual(0);
    expect(iGioco).toBeLessThan(iInfo);
    expect(iInfo).toBeLessThan(iSettaggi);
    expect(righe[iInfo + 1]).toContain("[I] Informazioni");
    expect(righe[iInfo + 2]).not.toContain("["); // una sola voce INFO: il resto è l'elenco delle schede
  });

  it("la scheda del personaggio mostra la scomposizione di base e bonus, la classe e l'equipaggiamento", async () => {
    const { app } = await giocatore();
    await app.premiTasto("I");
    await app.premiTasto("1");
    const s = sx(app.schermata());
    expect(s).toContain("Il personaggio");
    expect(s).toContain("HP massimi: 30 (base 20, bonus +10)");
    expect(s).toContain("Forza: 5 (base 5, bonus 0)");
    expect(s).toContain("Difesa: 4 (base 2, bonus +2)");
    expect(s).toContain("Classe");
    expect(s).toContain("  Cavaliere"); // solo il nome: i modificatori con i segni negativi fuorviavano
    expect(s).not.toContain("velocità -4");
    expect(s).toContain("Al prossimo livello:"); // cosa si guadagna salendo (dai dati di crescita della classe)
    expect(s).toContain("HP massimi +5");
    expect(s).toContain("Arma: nessuna");
    expect(s).toContain("Armatura: nessuna");
    expect(s).toContain("Velocità: 6 (base 10, bonus -4)");
    expect(s).toContain("Oro in banca: 0");
    expect(haDisegno(app.schermata())).toBe(true);
  });

  it("le statistiche incontri sono vuote all'inizio e si riempiono dopo un combattimento", async () => {
    const { app } = await giocatore();
    await app.premiTasto("I");
    await app.premiTasto("2");
    expect(sx(app.schermata())).toContain("Nessun nemico incontrato finora.");
    await app.premiTasto("0"); // all'elenco delle schede
    await app.premiTasto("0"); // al luogo da cui si è venuti
    await app.premiTasto("F"); // addentrati nella foresta (dalla porta)
    for (let i = 0; i < 40 && app.stato().vista?.contestoForzato === "combattimento"; i++) await app.premiTasto("A");
    await app.premiTasto("I");
    await app.premiTasto("2");
    const s = sx(app.schermata());
    expect(s).toContain("Nemico");
    expect(s).toMatch(/(Ratto gigante|Lupo famelico)\s+1\s+/);
    expect(s).toContain("Totale");
    expect(s).toContain("Inc incontri");
  });

  it("Torna indietro dalle schede INFO riporta all'elenco e poi al luogo da cui si è aperta la schermata", async () => {
    const { app } = await giocatore();
    await entraIn(app, "locanda");
    expect(app.schermata().chiave).toBe("gioco:luogo:locanda");
    await app.premiTasto("I");
    expect(app.stato().navigazione).toBe("info:indice");
    await app.premiTasto("1");
    expect(app.stato().navigazione).toBe("info:personaggio");
    await app.premiTasto("0"); // dalla scheda all'elenco
    expect(app.stato().navigazione).toBe("info:indice");
    await app.premiTasto("2");
    expect(app.stato().navigazione).toBe("info:statistiche");
    await app.premiTasto("0");
    await app.premiTasto("0"); // dall'elenco al luogo in cui si era
    expect(app.schermata().chiave).toBe("gioco:luogo:locanda");
    expect(tasti(app.schermata())).not.toContain("0"); // il luogo di casa non ha "Torna indietro"
  });

  it("l'elenco INFO ha le schede numerate; dentro le schede non c'è altro gruppo INFO", async () => {
    const { app } = await giocatore();
    await app.premiTasto("I");
    expect(tasti(app.schermata())).toEqual(["1", "2", "3", "4", "5", "0", "O"]); // personaggio, statistiche, classi, inventario, bestiario
    await app.premiTasto("1");
    expect(tasti(app.schermata())).toEqual(["0", "O"]);
    await app.premiTasto("0");
    await app.premiTasto("2");
    expect(tasti(app.schermata())).toEqual(["0", "O"]);
  });

  it("durante il combattimento e la creazione le voci INFO non ci sono", async () => {
    const amb = creaAmbiente("it");
    const app = amb.nuovaApp();
    await iniziaPartita(app, "Aldo");
    expect(tasti(app.schermata())).toEqual(["1", "2", "3", "D", "O"]); // creazione
    await app.premiTasto("1");
    await app.premiTasto("F"); // addentrati nella foresta (dalla porta)
    expect(tasti(app.schermata())).toEqual(["A", "T", "S", "F", "O"]); // combattimento
  });

  it("l'inglese ha i propri testi e la versione compare nelle opzioni", async () => {
    const { app } = await giocatore("en");
    await app.premiTasto("I");
    await app.premiTasto("1");
    expect(sx(app.schermata())).toContain("Max HP: 30 (base 20, bonus +10)");
    await app.premiTasto("O");
    expect(sx(app.schermata())).toContain(`Version ${VERSIONE_GIOCO}`);
  });
});

describe("messaggi ripetuti, effetti grafici e CRT", () => {
  async function giocatore(lingua: Lingua = "it") {
    const amb = creaAmbiente(lingua);
    const app = amb.nuovaApp();
    await iniziaPartita(app, "Aldo");
    await app.premiTasto("1");
    return { amb, app };
  }
  const sx = (s: Schermata): string => s.sinistra.map((r) => r.map((x) => x.testo).join("")).join("\n");

  it("lo stesso messaggio di fila compare una volta sola, con il contatore", async () => {
    const { app } = await giocatore();
    await entraIn(app, "guaritore");
    for (let i = 0; i < 6; i++) await app.premiTasto("1"); // già in piena salute
    const righe = sx(app.schermata()).split("\n").filter((r) => r.includes("Sei già in piena salute."));
    expect(righe).toHaveLength(1);
    expect(righe[0]).toContain("(×6)");
  });

  it("un messaggio diverso interrompe il conteggio e poi si ricomincia", async () => {
    const { app } = await giocatore();
    await entraIn(app, "guaritore");
    await app.premiTasto("1");
    await app.premiTasto("1");
    await app.premiTasto("2"); // un altro tipo di errore? stessa salute: stesso messaggio
    expect(app.stato().log.at(-1)?.conteggio).toBe(3);
    await entraIn(app, "banca");
    await app.premiTasto("1"); // deposito delle monete iniziali (messaggio diverso)
    expect(app.stato().log.at(-1)?.testo).toContain("Depositi 50 monete");
    expect(app.stato().log.at(-1)?.conteggio ?? 1).toBe(1);
  });

  it("le opzioni mostrano e cambiano gli effetti grafici, e la scelta viene salvata", async () => {
    const { amb, app } = await giocatore();
    await app.premiTasto("O");
    expect(sx(app.schermata())).toContain("Effetti grafici (ora: Pieni)");
    await app.premiTasto("G");
    expect(app.stato().effetti).toBe("ridotti");
    expect(sx(app.schermata())).toContain("Effetti grafici (ora: Ridotti)");
    expect(creaPreferenzeStorage(amb.contenitore).leggiEffetti()).toBe("ridotti");
    await app.premiTasto("G");
    expect(app.stato().effetti).toBe("spenti");
    await app.premiTasto("G");
    expect(app.stato().effetti).toBe("pieni");
  });

  it("l'effetto CRT si attiva e disattiva e la scelta resta alla prossima apertura", async () => {
    const { amb, app } = await giocatore();
    await app.premiTasto("O");
    expect(sx(app.schermata())).toContain("Effetto CRT (ora: No)");
    await app.premiTasto("C");
    expect(app.stato().crt).toBe(true);
    expect(sx(app.schermata())).toContain("Effetto CRT (ora: Sì)");
    const nuova = amb.nuovaApp();
    await nuova.avvia();
    expect(nuova.stato().crt).toBe(true);
  });

  it("senza una scelta salvata, se il sistema chiede meno movimento gli effetti partono ridotti", async () => {
    const amb = creaAmbiente("it");
    amb.movimentoRidotto = true;
    const app = amb.nuovaApp();
    await app.avvia();
    expect(app.stato().effetti).toBe("ridotti");
    // una scelta esplicita ha la precedenza
    creaPreferenzeStorage(amb.contenitore).salvaEffetti("pieni");
    const altra = amb.nuovaApp();
    await altra.avvia();
    expect(altra.stato().effetti).toBe("pieni");
  });

  it("le voci delle opzioni si chiamano nelle due lingue", async () => {
    const { app } = await giocatore("en");
    await app.premiTasto("O");
    expect(sx(app.schermata())).toContain("Graphics effects (now: Full)");
    expect(sx(app.schermata())).toContain("CRT effect (now: Off)");
  });

  it("le immagini della schermata sono dati con la loro palette (la colonna di destra le mostra)", async () => {
    const { app } = await giocatore();
    const s = app.schermata();
    expect(s.immagine?.larghezza).toBe(96);
    expect(s.immagine?.palette.length).toBeGreaterThan(10);
    expect(s.immagine?.cicli.length).toBeGreaterThan(0);
  });
});

describe("colonna di destra, versione e scelta della classe", () => {
  const sx = (s: Schermata): string => s.sinistra.map((r) => r.map((x) => x.testo).join("")).join("\n");
  const dx = (s: Schermata): string => s.destra.map((r) => r.map((x) => x.testo).join("")).join("\n");

  it("la versione compare come sottotitolo alla scelta della lingua, all'avvio e nelle opzioni", async () => {
    // primissima apertura: nessuna lingua scelta
    const primo = creaAmbiente().nuovaApp();
    await primo.avvia();
    expect(sx(primo.schermata())).toContain(`Versione / Version ${VERSIONE_GIOCO}`);
    const amb = creaAmbiente("it");
    const app = amb.nuovaApp();
    await app.avvia();
    expect(sx(app.schermata())).toContain(`Versione ${VERSIONE_GIOCO}`);
    expect(VERSIONE_GIOCO).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("la scelta della classe mostra una descrizione breve per classe; valori e abilità stanno nelle pagine, da cui si può scegliere", async () => {
    const amb = creaAmbiente("it");
    const app = amb.nuovaApp();
    await iniziaPartita(app, "Aldo");
    const t = sx(app.schermata());
    expect(t).toContain("Cavaliere: Robusto e ben protetto");
    expect(t).not.toContain("HP 30, forza 5"); // i valori non sono più qui
    expect(t).not.toContain("Abilità di classe");
    await app.premiTasto("D"); // descrizioni complete: l'elenco delle classi
    expect(app.schermata().chiave).toBe("gioco:info:classi");
    expect(tasti(app.schermata())).toEqual(["1", "2", "3", "0", "O"]); // niente INFO durante la creazione
    await app.premiTasto("2");
    const pagina = sx(app.schermata());
    expect(pagina).toContain("HP 18, forza 8, difesa 2, velocità 10, mana 10, oro x1");
    expect(pagina).toContain("Concentrazione");
    expect(tasti(app.schermata())).toEqual(["1", "0", "O"]); // scegli questa classe, indietro, opzioni
    await app.premiTasto("0"); // all'elenco
    await app.premiTasto("0"); // alla creazione
    expect(app.schermata().chiave).toBe("gioco:creazione");
    await app.premiTasto("D");
    await app.premiTasto("2");
    await app.premiTasto("1"); // sceglie il Mistico dalla sua pagina
    expect(app.schermata().chiave).toBe("gioco:citta:porta-s");
    expect(sx(app.schermata())).not.toContain("Scegli questa classe");
    expect(dx(app.schermata())).toContain("Mana");
  });

  it("il Mistico vede velocità e barra del mana a destra; il Cavaliere solo la velocità", async () => {
    const mistico = creaAmbiente("it").nuovaApp();
    await iniziaPartita(mistico, "Aldo");
    await mistico.premiTasto("2");
    const d = dx(mistico.schermata());
    expect(d).toContain("Forza 8 - Difesa 2 - Velocità 10");
    expect(d).toMatch(/HP\s+█+░*\s+18\/18/);
    expect(d).toMatch(/Mana\s+█+░*\s+10\/10/);
    const cavaliere = creaAmbiente("it").nuovaApp();
    await iniziaPartita(cavaliere, "Aldo");
    await cavaliere.premiTasto("1");
    expect(dx(cavaliere.schermata())).toContain("Forza 5 - Difesa 4 - Velocità 6");
    expect(dx(cavaliere.schermata())).not.toContain("Mana");
  });

  it("la barra del mana è blu quando è alta, viola a metà e rossa quando è bassa", () => {
    expect(coloreMana(10, 10)).toBe(ANSI.bluChiaro);
    expect(coloreMana(6, 10)).toBe(ANSI.bluChiaro);
    expect(coloreMana(5, 10)).toBe(ANSI.magentaChiaro);
    expect(coloreMana(3, 10)).toBe(ANSI.magentaChiaro);
    expect(coloreMana(2, 10)).toBe(ANSI.rossoChiaro);
    expect(coloreMana(0, 10)).toBe(ANSI.rossoChiaro);
    expect(coloreMana(0, 0)).toBe(ANSI.rossoChiaro);
  });

  it("i colori della barra del mana nella schermata seguono la quantità di mana", async () => {
    const app = creaAmbiente("it").nuovaApp();
    await iniziaPartita(app, "Aldo");
    await app.premiTasto("2");
    const colore = (): number | undefined => app.schermata().destra.find((r) => r.some((x) => x.testo.startsWith("Mana")))?.[1]?.colore;
    expect(colore()).toBe(ANSI.bluChiaro);
  });
});

describe("mappa, viaggi e comandi di prova", () => {
  const sx = (s: Schermata): string => s.sinistra.map((r) => r.map((x) => x.testo).join("")).join("\n");
  const dx = (s: Schermata): string => s.destra.map((r) => r.map((x) => x.testo).join("")).join("\n");
  async function giocatore(sviluppo = false, classe = "1") {
    const amb = creaAmbiente("it");
    amb.sviluppo = sviluppo;
    const app = amb.nuovaApp();
    await iniziaPartita(app, "Aldo");
    await app.premiTasto(classe);
    return { amb, app };
  }

  it("la mappa si apre con M, mostra categorie e costi, e \"Torna indietro\" risale di un livello", async () => {
    const { app } = await giocatore();
    await app.premiTasto("M");
    expect(sx(app.schermata())).toContain("Mappa e viaggi");
    expect(sx(app.schermata())).toContain("Sei qui: Porta San Pietro");
    expect(tasti(app.schermata())).toEqual(["1", "2", "3", "0", "I", "O"]);
    await app.premiTasto("1");
    expect(sx(app.schermata())).toContain("[1] Porta Santa Maria (nord) - 20 movimenti, 2 azioni"); // con la direzione
    expect(sx(app.schermata())).toContain("[4] Porta San Pietro (sud): Locanda - sei qui"); // già visitata: mostra cosa contiene
    expect(haDisegno(app.schermata())).toBe(true);
    await app.premiTasto("0"); // dalla lista torna alla mappa
    expect(sx(app.schermata())).toContain("Sei qui: Porta San Pietro");
    expect(tasti(app.schermata())).toContain("1");
    await app.premiTasto("0"); // dalla mappa torna al luogo
    expect(app.schermata().chiave).toBe("gioco:citta:porta-s");
  });

  it("viaggiando si arriva nel nuovo luogo: registro con l'arrivo, luogo e azioni aggiornati a destra", async () => {
    const { app } = await giocatore();
    await vai(app, "3", "1"); // Piazza dell'Anfiteatro: 14 movimenti, 1 azione
    expect(app.schermata().chiave).toBe("gioco:citta:piazza-n");
    expect(sx(app.schermata())).toContain("Arrivi in Piazza dell'Anfiteatro (14 movimenti, 1 azione).");
    expect(sx(app.schermata())).toContain("[G] Gilda dei Cavalieri - 2 movimenti, 1 azione"); // (con il resto di 6) gli edifici si vedono nella piazza
    await app.premiTasto("G"); // entra nella Gilda dei Cavalieri: 2 movimenti, con il resto di 6 fa 1 azione
    expect(app.schermata().chiave).toBe("gioco:luogo:gilda-cavaliere");
    expect(app.stato().log).toHaveLength(1);
    expect(sx(app.schermata())).toContain("Arrivi alla Gilda dei Cavalieri (2 movimenti, 1 azione).");
    expect(dx(app.schermata())).toContain("Luogo: Gilda dei Cavalieri");
    expect(dx(app.schermata())).toContain("Azioni 48/50");
    // uscire è gratis e riporta alla piazza
    await app.premiTasto("E");
    expect(app.schermata().chiave).toBe("gioco:citta:piazza-n");
    expect(dx(app.schermata())).toContain("Azioni 48/50");
    // un viaggio impossibile resta sulla mappa con il messaggio
    await app.premiTasto("M");
    await app.premiTasto("3");
    await app.premiTasto("1"); // è già lì
    expect(sx(app.schermata())).toContain("Sei già qui.");
    expect(app.stato().navigazione).toBe("mappa:piazze");
  });

  it("layout compatto: nome del luogo, righe di stato senza titoli ripetuti, linea sopra il registro, poi il menu", async () => {
    const { app } = await giocatore();
    await app.premiTasto("L"); // entra nella Locanda dalla Porta San Pietro
    const righe = app.schermata().sinistra.map((r) => r.map((x) => x.testo).join(""));
    const t = righe.join("\n");
    expect(righe[0]).toBe("La Locanda");
    expect(t).not.toContain("La locanda"); // niente titolo che ripete il nome del luogo
    expect(t).not.toContain("Il luogo");
    expect(t).not.toContain("Azioni rimaste"); // le azioni stanno già a destra
    expect(t).not.toContain("Ascolta le chiacchiere\n  "); // il titolo del pannello non ripete la voce di menu
    expect(righe[2]).toContain("Un fuoco acceso"); // descrizione subito sotto il nome
    expect(righe[3]).toBe("  Pasti oggi: 0/3."); // stato di seguito, senza riga vuota
    expect(righe[4]).toBe("  Chiacchiere ascoltate oggi: 0 (ogni tentativo: 1 azione e 3-5 monete).");
    const linea = righe.findIndex((r) => r.startsWith("────"));
    const log = righe.findIndex((r) => r.startsWith("> Arrivi alla Locanda"));
    const menu = righe.findIndex((r) => r.startsWith("── GIOCO"));
    expect(linea).toBeGreaterThan(4); // la linea sopra il registro viene dopo lo stato
    expect(log).toBe(linea + 1);
    expect(menu).toBeGreaterThan(log); // sotto il registro c'è l'intestazione del menu
    await app.premiTasto("E");
    expect(app.schermata().sinistra.map((r) => r.map((x) => x.testo).join("")).join("\n")).toContain("Esci: sei di nuovo a Porta San Pietro.");
  });

  it("le porte chiuse spiegano cosa c'è fuori; quella aperta porta nella foresta", async () => {
    const { app } = await giocatore();
    await vai(app, "1", "1"); // Porta Santa Maria: 19 movimenti
    expect(dx(app.schermata())).toContain("Luogo: Porta Santa Maria");
    await app.premiTasto("E");
    expect(sx(app.schermata())).toContain("colline di Monte Pisano. Strada ancora da esplorare.");
    expect(app.schermata().chiave).toBe("gioco:citta:porta-n");
  });

  it("senza ?dev=1 non ci sono comandi di prova nelle opzioni", async () => {
    const { app } = await giocatore(false);
    await app.premiTasto("O");
    expect(tasti(app.schermata())).not.toContain("V");
  });

  it("con ?dev=1 le opzioni offrono i comandi di prova: teletrasporto, giorno dopo, monete, mostro", async () => {
    const { app } = await giocatore(true);
    await app.premiTasto("O");
    expect(tasti(app.schermata())).toContain("V");
    expect(sx(app.schermata())).toContain("[V] Comandi di prova");
    await app.premiTasto("V");
    expect(sx(app.schermata())).toContain("Comandi di prova");
    expect(tasti(app.schermata())).toEqual(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "I", "O"]); // il 9 è "Avvia il torneo"
    // vai a un luogo: gratis, senza consumare azioni
    await app.premiTasto("4");
    await app.premiTasto("3"); // piazze e torre
    await app.premiTasto("5"); // Torre Guinigi (dopo Via Fillungo)
    expect(app.schermata().chiave).toBe("gioco:citta:torre");
    expect(dx(app.schermata())).toContain("Luogo: Torre Guinigi");
    expect(dx(app.schermata())).toContain("Azioni 50/50");
    // monete
    await app.premiTasto("O");
    await app.premiTasto("V");
    await app.premiTasto("2");
    expect(dx(app.schermata())).toContain("Oro 150");
    // dove sono gli NPC di oggi: tre righe nel registro
    await app.premiTasto("O");
    await app.premiTasto("V");
    await app.premiTasto("6");
    expect(sx(app.schermata())).toContain("Beatrice la mercante di stoffe si trova qui: Le Mura - San Pietro");
    // scegli il mostro: inizia un combattimento con l'orco
    await app.premiTasto("5");
    await app.premiTasto("4");
    expect(sx(app.schermata())).toContain("Combattimento");
    expect(sx(app.schermata())).toContain("un orco");
  });

  it("il giorno dopo di prova ripristina le azioni spese camminando", async () => {
    const { app } = await giocatore(true);
    await entraIn(app, "armeria"); // 49 azioni
    expect(dx(app.schermata())).toContain("Azioni 49/50");
    await app.premiTasto("O");
    await app.premiTasto("V");
    await app.premiTasto("1");
    expect(dx(app.schermata())).toContain("Azioni 50/50");
    expect(sx(app.schermata())).toContain("Un nuovo giorno comincia.");
  });

  it("le righe delle abilità sono in ciano chiaro con la stella; gli altri messaggi no", async () => {
    const { app } = await giocatore(true, "2"); // Mistico
    await app.premiTasto("O");
    await app.premiTasto("V");
    await app.premiTasto("5");
    await app.premiTasto("1"); // un ratto
    await app.premiTasto("S"); // Concentrazione
    const righe = app.schermata().sinistra;
    const uso = righe.find((r) => r.map((x) => x.testo).join("").includes("★ Usi Concentrazione!"));
    expect(uso?.[0]?.colore).toBe(ANSI.cianoChiaro);
    const attivo = righe.find((r) => r.map((x) => x.testo).join("").includes("★ Attivo: Concentrazione"));
    expect(attivo?.[0]?.colore).toBe(ANSI.cianoChiaro);
    const normale = righe.find((r) => r.map((x) => x.testo).join("").includes("Ti trovi di fronte"));
    expect(normale?.[0]?.colore).not.toBe(ANSI.cianoChiaro);
  });
});

describe("[C] Le classi", () => {
  const testo = (app: Awaited<ReturnType<typeof giocatore>>): string => app.schermata().sinistra.map((r) => r.map((x) => x.testo).join("")).join("\n");
  async function giocatore(classe = "1") {
    const app = creaAmbiente("it").nuovaApp();
    await iniziaPartita(app, "Aldo");
    await app.premiTasto(classe);
    return app;
  }

  it("da ogni schermata (non in combattimento) si apre l'elenco delle classi, e ogni classe ha la sua pagina completa", async () => {
    const app = await giocatore();
    await app.premiTasto("I");
    await app.premiTasto("3");
    expect(app.schermata().chiave).toBe("gioco:info:classi");
    let t = testo(app);
    for (const nome of ["Cavaliere", "Mistico", "Ladro"]) expect(t).toContain(nome);
    expect(tasti(app.schermata())).toEqual(["1", "2", "3", "0", "O"]); // dentro le schede INFO non c'è altro gruppo INFO
    await app.premiTasto("1");
    t = testo(app);
    expect(app.schermata().chiave).toBe("gioco:info:classe:cavaliere");
    expect(t).toContain("Cavaliere"); // titolo e descrizione
    expect(t).toMatch(/HP \d+, forza \d+, difesa \d+, velocità \d+/); // valori di partenza
    expect(t).toContain("Carica"); // abilità con la descrizione completa
    expect(t).toContain("Parata (dal livello 4)");
    expect(t).toContain("Ogni livello: forza +1");
    expect(t).toContain("Al livello 4: difesa +1");
    expect(t).toContain("Arma di classe: Spadone");
    await app.premiTasto("0"); // dalla pagina si torna all'elenco
    expect(app.schermata().chiave).toBe("gioco:info:classi");
    await app.premiTasto("0"); // all'elenco delle schede INFO
    await app.premiTasto("0"); // dall'elenco al luogo da cui si è venuti
    expect(app.schermata().chiave).toBe("gioco:citta:porta-s");
  });

  it("la pagina del Mistico mostra il ritmo del mana e Velo; non c'è alla scelta della classe né in combattimento", async () => {
    const app = await giocatore();
    await app.premiTasto("I");
    await app.premiTasto("3");
    await app.premiTasto("2");
    const t = testo(app);
    expect(t).toContain("Ogni livello: mana +2");
    expect(t).toContain("Velo (dal livello 4)");
    expect(t).toContain("Al livello 4: velocità +1");
  });
});

describe("da morti si consultano le schermate INFO", () => {
  it("anche l'elenco INFO, il bestiario e le schede restano navigabili dopo la morte", async () => {
    const app = creaAmbiente("it").nuovaApp();
    await iniziaPartita(app, "Aldo");
    await app.premiTasto("3"); // Ladro
    await app.premiTasto("V"); // comandi di prova non disponibili senza ?dev=1: si prova a morire in foresta contro i nemici
    for (let i = 0; i < 60 && !app.stato().vista?.personaggio.morto; i++) {
      await app.premiTasto("E");
      if (app.stato().vista?.contestoForzato !== undefined) for (let k = 0; k < 40 && app.stato().vista?.contestoForzato !== undefined; k++) await app.premiTasto("A");
    }
    if (!app.stato().vista?.personaggio.morto) return; // se non è morto nel tempo del test non c'è nulla da verificare
    await app.premiTasto("I");
    expect(tasti(app.schermata())).toContain("5"); // l'elenco INFO c'è anche da morti
    await app.premiTasto("5");
    expect(app.stato().navigazione).toBe("info:bestiario");
    expect(tasti(app.schermata())).toContain("0");
  });
});
