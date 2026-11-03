import { describe, expect, it } from "vitest";
import { DURATA_CICLO_MS, creaVistaPartita, traduci, vociMenu } from "../../src/core/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);
const ctx = creaContestoDiProva(registro, 4);

describe("vista e menu", () => {
  it("all'inizio il contesto imposto è la creazione del personaggio", () => {
    const vista = creaVistaPartita(statoDiProva(registro), ctx);
    expect(vista.contestoForzato).toBe("creazione");
    expect(vociMenu(registro, "creazione").map((v) => v.tasto)).toEqual(["1", "2", "3"]);
    const pannello = vista.pannelli.find((p) => p.titoloChiave === "classi.pannello.titolo");
    expect(pannello?.righe).toHaveLength(3);
  });

  it("dopo la scelta della classe si è liberi di muoversi nel villaggio", () => {
    const scelta = eseguiOk(statoDiProva(registro), { tipo: "scegliClasse", dati: { classeId: "ladro" } }, ctx);
    const vista = creaVistaPartita(scelta.stato, ctx);
    expect(vista.contestoForzato).toBeUndefined();
    expect(vociMenu(registro, "villaggio").map((v) => v.tasto)).toContain("F");
    expect(vista.pannelli.some((p) => p.titoloChiave === "foresta.pannello.titolo")).toBe(true);
    expect(vista.pannelli.some((p) => p.titoloChiave === "classi.pannello.titolo")).toBe(false);
  });

  it("durante un combattimento il contesto imposto è il combattimento", () => {
    const scelta = eseguiOk(statoDiProva(registro), { tipo: "scegliClasse", dati: { classeId: "ladro" } }, ctx);
    const scontro = eseguiOk(scelta.stato, { tipo: "esploraForesta", dati: { luogoId: "foresta" } }, ctx);
    const vista = creaVistaPartita(scontro.stato, ctx);
    expect(vista.contestoForzato).toBe("combattimento");
    expect(vociMenu(registro, "combattimento").map((v) => v.tasto)).toEqual(["A", "F"]);
    expect(vista.pannelli.some((p) => p.titoloChiave === "combattimento.pannello.titolo")).toBe(true);
  });

  it("ogni contesto ha un titolo e tutti i testi dei menu esistono in entrambe le lingue", () => {
    for (const [contesto, chiave] of registro.titoliContesto) {
      expect(traduci(registro, "it", chiave), contesto).not.toMatch(/^\[/);
      expect(traduci(registro, "en", chiave), contesto).not.toMatch(/^\[/);
    }
    for (const voci of registro.menu.values()) {
      for (const v of voci) {
        expect(traduci(registro, "it", v.etichettaChiave)).not.toMatch(/^\[/);
        expect(traduci(registro, "en", v.etichettaChiave)).not.toMatch(/^\[/);
      }
    }
    for (const contesto of ["villaggio", "luogo:foresta", "combattimento", "creazione"]) {
      expect(registro.titoliContesto.has(contesto), contesto).toBe(true);
    }
  });

  it("la vista indica quando scatta il prossimo giorno", () => {
    const stato = statoDiProva(registro);
    expect(creaVistaPartita(stato, ctx).prossimoReset).toBe(stato.ultimoReset + DURATA_CICLO_MS);
  });
});
