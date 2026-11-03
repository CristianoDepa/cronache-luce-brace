import { describe, expect, it } from "vitest";
import { DURATA_CICLO_MS, applicaGiorno, creaVistaPartita, eseguiAzione, leggiContenuto, testoRaster, traduci, traduciEvento, vociMenu } from "../../src/core/indice";
import { statoCombattimento } from "../../src/moduli/combattimento/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { tipoLuogo } from "../../src/moduli/luoghi/indice";
import { LUGLIO, NATALE, creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";
import { MANA_MAX, moduloMagiaProva, moduloNataleProva, moduloTorreProva, statoMagia, tipoIncantesimo } from "./moduliProva";

const registroBase = registroDa(MODULI_ATTIVI);
const registroEsteso = registroDa([...MODULI_ATTIVI, moduloNataleProva, moduloMagiaProva]);

describe("L1: nuovi contenuti solo come dati", () => {
  it("il nuovo luogo e le nuove creature sono disponibili", () => {
    const palude = leggiContenuto(registroEsteso, tipoLuogo, "palude-prova");
    expect(palude?.creature).toEqual(["ranocchio-prova", "elfo-prova"]);
    expect(leggiContenuto(registroBase, tipoLuogo, "palude-prova")).toBeUndefined();
  });

  it("i testi dei nuovi contenuti esistono in italiano e inglese", () => {
    expect(traduci(registroEsteso, "it", "natale-prova.luogo.palude")).toBe("La Palude");
    expect(traduci(registroEsteso, "en", "natale-prova.luogo.palude")).toBe("The Marsh");
  });
});

describe("L2: evento stagionale solo come dati e calendario", () => {
  const richiesta = { tipo: "iniziaCombattimento", dati: { creaturaId: "elfo-prova" } };

  it("l'elfo è disponibile solo durante la finestra di Natale", () => {
    const estate = eseguiAzione(statoDiProva(registroEsteso), richiesta, creaContestoDiProva(registroEsteso, 1, LUGLIO));
    expect(estate.ok ? "" : estate.errore.chiave).toBe("combattimento.errore.creatura_non_disponibile");
    const natale = eseguiAzione(statoDiProva(registroEsteso), richiesta, creaContestoDiProva(registroEsteso, 1, NATALE));
    expect(natale.ok).toBe(true);
  });

  it("la creatura ordinaria resta sempre disponibile", () => {
    const ctx = creaContestoDiProva(registroEsteso, 1, LUGLIO);
    const r = eseguiAzione(statoDiProva(registroEsteso), { tipo: "iniziaCombattimento", dati: { creaturaId: "ranocchio-prova" } }, ctx);
    expect(r.ok).toBe(true);
  });
});

describe("L3: un intero sistema magico come nuovo modulo", () => {
  const avvia = () => {
    const ctx = creaContestoDiProva(registroEsteso, 21);
    const stato = statoDiProva(registroEsteso);
    const inizio = eseguiOk(stato, { tipo: "iniziaCombattimento", dati: { creaturaId: "lupo" } }, ctx);
    return { ctx, stato: inizio.stato };
  };

  it("lo stato del nuovo modulo è separato e parte dal valore iniziale", () => {
    expect(statoMagia.leggi(statoDiProva(registroEsteso)).mana).toBe(MANA_MAX);
    expect(leggiContenuto(registroEsteso, tipoIncantesimo, "dardo")?.costoMana).toBe(3);
  });

  it("l'incantesimo costa mana, danneggia il nemico e innesca il suo turno", () => {
    const { ctx, stato } = avvia();
    const lancio = eseguiOk(stato, { tipo: "lanciaIncantesimo", dati: { incantesimoId: "dardo" } }, ctx);
    expect(statoMagia.leggi(lancio.stato).mana).toBe(MANA_MAX - 3);
    expect(statoCombattimento.leggi(lancio.stato).scontro?.hpNemico).toBe(14 - 6);
    expect(lancio.eventi.map((e) => e.chiave)).toEqual([
      "magia-prova.lancio",
      "combattimento.colpoGiocatore",
      "combattimento.colpoNemico",
    ]);
    const primo = lancio.eventi[0];
    if (primo) expect(traduciEvento(registroEsteso, "it", primo)).toBe("Lanci Dardo di fuoco!");
  });

  it("senza mana l'incantesimo fallisce e lo stato non cambia", () => {
    const { ctx, stato } = avvia();
    const senzaMana = statoMagia.scrivi(stato, { mana: 1 });
    const esito = eseguiAzione(senzaMana, { tipo: "lanciaIncantesimo", dati: { incantesimoId: "dardo" } }, ctx);
    expect(esito.ok ? "" : esito.errore.chiave).toBe("magia-prova.errore.mana_insufficiente");
  });

  it("fuori dal combattimento l'incantesimo fallisce senza consumare mana", () => {
    const ctx = creaContestoDiProva(registroEsteso, 21);
    const stato = statoDiProva(registroEsteso);
    const esito = eseguiAzione(stato, { tipo: "lanciaIncantesimo", dati: { incantesimoId: "dardo" } }, ctx);
    expect(esito.ok ? "" : esito.errore.chiave).toBe("combattimento.errore.nessun_combattimento");
    expect(statoMagia.leggi(stato).mana).toBe(MANA_MAX);
  });

  it("la regola del modulo potenzia l'attacco normale di esattamente 1", () => {
    const colpo = (registro: typeof registroBase): number => {
      const ctx = creaContestoDiProva(registro, 77);
      const inizio = eseguiOk(statoDiProva(registro), { tipo: "iniziaCombattimento", dati: { creaturaId: "lupo" } }, ctx);
      const dopo = eseguiOk(inizio.stato, { tipo: "attacca" }, ctx);
      return 14 - (statoCombattimento.leggi(dopo.stato).scontro?.hpNemico ?? 0);
    };
    expect(colpo(registroEsteso)).toBe(colpo(registroBase) + 1);
  });

  it("il mana si ricarica al nuovo giorno", () => {
    const ctx = creaContestoDiProva(registroEsteso, 1, LUGLIO + DURATA_CICLO_MS);
    const esaurito = statoMagia.scrivi(statoDiProva(registroEsteso), { mana: 0 });
    const esito = applicaGiorno(esaurito, ctx);
    expect(esito.ok && statoMagia.leggi(esito.stato).mana).toBe(MANA_MAX);
  });
});

describe("L1 con grafica e menu: un nuovo luogo giocabile solo con dati", () => {
  const registroTorre = registroDa([...MODULI_ATTIVI, moduloTorreProva]);

  it("compare nel menu del villaggio e ha titolo e disegno propri", () => {
    expect(vociMenu(registroTorre, "villaggio").map((v) => v.tasto)).toContain("R");
    expect(vociMenu(registroBase, "villaggio").map((v) => v.tasto)).not.toContain("R");
    expect(registroTorre.titoliContesto.get("luogo:torre")).toBe("torre-prova.luogo");
  });

  it("l'azione di esplorazione esistente funziona sul nuovo luogo e il combattimento mostra scena e creatura", () => {
    const ctxTorre = creaContestoDiProva(registroTorre, 6);
    const classe = eseguiOk(statoDiProva(registroTorre), { tipo: "scegliClasse", dati: { classeId: "cavaliere" } }, ctxTorre);
    const incontro = eseguiOk(classe.stato, { tipo: "esploraForesta", dati: { luogoId: "torre" } }, ctxTorre);
    const arte = creaVistaPartita(incontro.stato, ctxTorre).illustrazioni["combattimento"];
    expect(arte).toBeDefined();
    const testo = testoRaster(arte!);
    expect(testo).toContain("[]"); // la torre
    expect(testo).toContain("{o,o}"); // il gufo
    expect(traduci(registroTorre, "en", "torre-prova.luogo")).toBe("The Tower");
  });
});

describe("regole architetturali (guardie automatiche)", () => {
  const nucleo = import.meta.glob("../../src/core/**/*.ts", { query: "?raw", import: "default", eager: true });
  const sorgenti = import.meta.glob("../../src/**/*.ts", { query: "?raw", import: "default", eager: true });

  it("il nucleo non importa mai dai moduli", () => {
    const file = Object.entries(nucleo);
    expect(file.length).toBeGreaterThan(10);
    for (const [percorso, codice] of file) {
      expect(typeof codice, percorso).toBe("string");
      expect(String(codice), percorso).not.toMatch(/from\s+["'][^"']*moduli/);
    }
  });

  it("nessun file usa 'as any'", () => {
    for (const [percorso, codice] of Object.entries(sorgenti)) {
      expect(String(codice), percorso).not.toMatch(/\bas any\b/);
    }
  });
});
