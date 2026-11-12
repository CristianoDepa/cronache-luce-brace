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
    expect(vociMenu(registro, "creazione").map((v) => v.tasto)).toEqual(["1", "2", "3", "D"]);
    const pannello = vista.pannelli.find((p) => p.titoloChiave === "classi.pannello.titolo");
    // per ogni classe solo la descrizione breve: i valori stanno nelle pagine delle classi
    expect(pannello?.righe).toHaveLength(3);
    expect(pannello?.righe.filter((r) => r.chiave === "classi.pannello.valori")).toHaveLength(0);
  });

  it("i moduli dichiarano le voci della colonna di destra: velocità per tutti, barra del mana solo per chi ha mana", () => {
    const con = (classeId: string) => creaVistaPartita(eseguiOk(statoDiProva(registro), { tipo: "scegliClasse", dati: { classeId } }, ctx).stato, ctx).laterale;
    const mistico = con("mistico");
    expect(mistico.map((v) => v.tipo)).toEqual(["esperienza", "statistica", "barra", "statistica", "riga", "riga"]); // esperienza, velocità, mana, fortuna, luogo, azioni
    expect(mistico[0]).toMatchObject({ tipo: "esperienza", necessaria: 150 });
    expect(mistico[1]).toMatchObject({ etichettaChiave: "combattimento.laterale.velocita", valore: 10 });
    expect(mistico[2]).toMatchObject({ stile: "mana", attuale: 10, massimo: 10 });
    expect(con("cavaliere").filter((v) => v.tipo === "statistica")).toEqual([
      { tipo: "statistica", etichettaChiave: "combattimento.laterale.velocita", valore: 6, ordine: 10 },
      { tipo: "statistica", etichettaChiave: "fortuna.laterale.etichetta", valore: 2, ordine: 20 }, // la Fortuna a destra, dopo la velocità (0.16.0)
    ]);
    expect(con("cavaliere").filter((v) => v.tipo === "riga").map((v) => v.tipo === "riga" && v.riga.chiave)).toEqual(["citta.laterale", "azioni.laterale"]);
    expect(con("ladro").find((v) => v.tipo === "statistica")).toMatchObject({ valore: 15 });
  });

  it("dopo la scelta della classe si è alla Porta San Pietro, liberi di addentrarsi nella foresta o di aprire la mappa", () => {
    const scelta = eseguiOk(statoDiProva(registro), { tipo: "scegliClasse", dati: { classeId: "ladro" } }, ctx);
    const vista = creaVistaPartita(scelta.stato, ctx);
    expect(vista.contestoForzato).toBeUndefined();
    expect(vista.contestoBase).toBe("citta:porta-s");
    expect(vociMenu(registro, "citta:porta-s").map((v) => v.tasto)).toEqual(["N", "F", "T", "E", "L", "M"]); // parla, addentrati nella foresta, apri il forziere (nascosta finché non ce n'è uno), esci (nascosta: la porta è aperta), Locanda, mappa
    expect(vista.pannelli.some((p) => p.contesti?.includes("citta:porta-s") && p.righe[0]?.chiave === "citta.pannello.descrizione")).toBe(true);
    expect(vista.pannelli.some((p) => p.titoloChiave === "classi.pannello.titolo")).toBe(false);
  });

  it("durante un combattimento il contesto imposto è il combattimento", () => {
    const scelta = eseguiOk(statoDiProva(registro), { tipo: "scegliClasse", dati: { classeId: "ladro" } }, ctx);
    const scontro = eseguiOk(scelta.stato, { tipo: "esploraForesta", dati: { luogoId: "foresta" } }, ctx);
    const vista = creaVistaPartita(scontro.stato, ctx);
    expect(vista.contestoForzato).toBe("combattimento");
    expect(vociMenu(registro, "combattimento").map((v) => v.tasto)).toEqual(["C", "A", "B", "T", "S", "D", "F"]); // C = cambia arma (con una riserva), T = combatti fino alla fine
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
    for (const contesto of ["citta:porta-s", "mappa", "mappa:porte", "sviluppo", "luogo:foresta", "combattimento", "creazione"]) {
      expect(registro.titoliContesto.has(contesto), contesto).toBe(true);
    }
  });

  it("la vista indica quando scatta il prossimo giorno", () => {
    const stato = statoDiProva(registro);
    expect(creaVistaPartita(stato, ctx).prossimoReset).toBe(stato.ultimoReset + DURATA_CICLO_MS);
  });
});
