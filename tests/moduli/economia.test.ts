import { describe, expect, it } from "vitest";
import { calcolaStatistiche, eseguiAzione, leggiContenuto, traduciEvento } from "../../src/core/indice";
import type { StatoGioco } from "../../src/core/indice";
import { puntoFuga } from "../../src/moduli/combattimento/indice";
import { LINEE, calcolaPrezzo, idOggetto, statoEquipaggiamento, tipoOggetto } from "../../src/moduli/equipaggiamento/indice";
import { statoBanca } from "../../src/moduli/banca/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { creaContestoDiProva, eseguiOk, registroDa, statoDiProva } from "../aiuti";
import { applicaRegole } from "../../src/core/indice";

const registro = registroDa(MODULI_ATTIVI);
const ctx = creaContestoDiProva(registro, 9);

function conOro(oro: number, hp?: number): StatoGioco {
  const base = statoDiProva(registro);
  return { ...base, personaggio: { ...base.personaggio, oro, ...(hp !== undefined ? { hp } : {}) } };
}

const compra = (linea: string) => ({ tipo: "compraOggetto", dati: { linea } });

describe("catalogo di armi e armature", () => {
  it("ha 9 linee da 10 livelli ciascuna", () => {
    expect(LINEE).toHaveLength(9);
    expect(LINEE.filter((l) => l.tipo === "arma")).toHaveLength(5);
    expect(LINEE.filter((l) => l.tipo === "armatura")).toHaveLength(4);
    for (const l of LINEE) {
      expect(leggiContenuto(registro, tipoOggetto, idOggetto(l.id, 10)), l.id).toBeDefined();
      expect(leggiContenuto(registro, tipoOggetto, idOggetto(l.id, 11)), l.id).toBeUndefined();
    }
  });

  it("i prezzi corrispondono alla tabella concordata", () => {
    const prezzo = (id: string, livello: number): number => calcolaPrezzo(LINEE.find((l) => l.id === id)!, livello);
    expect([prezzo("spada", 1), prezzo("spada", 3), prezzo("spada", 10)]).toEqual([50, 128, 3436]);
    expect([prezzo("ascia", 1), prezzo("ascia", 3), prezzo("ascia", 10)]).toEqual([80, 231, 9487]);
    expect([prezzo("pugnale", 1), prezzo("pugnale", 3), prezzo("pugnale", 10)]).toEqual([30, 68, 1153]);
    expect([prezzo("mazza", 1), prezzo("mazza", 3), prezzo("mazza", 10)]).toEqual([40, 90, 1538]);
    expect([prezzo("lancia", 1), prezzo("lancia", 3), prezzo("lancia", 10)]).toEqual([70, 179, 4810]);
    expect([prezzo("cuoio", 1), prezzo("cuoio", 3), prezzo("cuoio", 10)]).toEqual([40, 96, 2066]);
    expect([prezzo("maglia", 1), prezzo("maglia", 3), prezzo("maglia", 10)]).toEqual([70, 191, 6345]);
    expect([prezzo("piastre", 1), prezzo("piastre", 3), prezzo("piastre", 10)]).toEqual([120, 347, 14231]);
    expect([prezzo("veste", 1), prezzo("veste", 3), prezzo("veste", 10)]).toEqual([60, 154, 4123]);
  });

  it("i dati dei contenuti coincidono con la formula", () => {
    const ascia5 = leggiContenuto(registro, tipoOggetto, idOggetto("ascia", 5));
    expect(ascia5?.prezzo).toBe(calcolaPrezzo(LINEE.find((l) => l.id === "ascia")!, 5));
    expect(ascia5?.effetti.forza).toBe(15);
  });
});

describe("acquisti all'armeria e alla sartoria", () => {
  it("la prima spada costa 50 e aumenta la forza", () => {
    const r = eseguiOk(conOro(50), compra("spada"), ctx);
    expect(r.stato.personaggio.oro).toBe(0);
    expect(statoEquipaggiamento.leggi(r.stato).arma).toEqual({ linea: "spada", livello: 1 });
    expect(calcolaStatistiche(r.stato, ctx).forza).toBe(5 + 2);
  });

  it("senza abbastanza monete l'acquisto fallisce e nulla cambia", () => {
    const stato = conOro(49);
    const r = eseguiAzione(stato, compra("spada"), ctx);
    expect(r.ok ? "" : r.errore.chiave).toBe("equipaggiamento.errore.oro_insufficiente");
  });

  it("si compra sempre il livello successivo e il vecchio oggetto si rivende al 33%", () => {
    const primo = eseguiOk(conOro(50), compra("spada"), ctx).stato;
    const ricco = { ...primo, personaggio: { ...primo.personaggio, oro: 1000 } };
    // Ascia livello 2 = 136 monete; rivendita della spada liv. 1 = floor(50 x 0,33) = 16
    const cambio = eseguiOk(ricco, compra("ascia"), ctx).stato;
    expect(statoEquipaggiamento.leggi(cambio).arma).toEqual({ linea: "ascia", livello: 2 });
    expect(cambio.personaggio.oro).toBe(1000 - (136 - 16));
  });

  it("arma e armatura sono slot separati", () => {
    let stato = conOro(500);
    stato = eseguiOk(stato, compra("spada"), ctx).stato;
    stato = eseguiOk(stato, compra("cuoio"), ctx).stato;
    const eq = statoEquipaggiamento.leggi(stato);
    expect(eq.arma?.linea).toBe("spada");
    expect(eq.armatura?.linea).toBe("cuoio");
    expect(stato.personaggio.oro).toBe(500 - 50 - 40);
  });

  it("al livello 10 non si può più comprare nella stessa linea", () => {
    const massimo = statoEquipaggiamento.scrivi(conOro(100000), { arma: { linea: "spada", livello: 10 }, armatura: null });
    const r = eseguiAzione(massimo, compra("spada"), ctx);
    expect(r.ok ? "" : r.errore.chiave).toBe("equipaggiamento.errore.non_disponibile");
  });

  it("una linea inesistente è rifiutata", () => {
    const r = eseguiAzione(conOro(1000), compra("bacchetta"), ctx);
    expect(r.ok ? "" : r.errore.chiave).toBe("equipaggiamento.errore.non_disponibile");
  });

  it("gli effetti di ogni linea modificano le statistiche e la fuga", () => {
    const con = (linea: string, livello: number): StatoGioco => {
      const slot = { linea, livello };
      const tipo = LINEE.find((l) => l.id === linea)!.tipo;
      return statoEquipaggiamento.scrivi(conOro(0), tipo === "arma" ? { arma: slot, armatura: null } : { arma: null, armatura: slot });
    };
    const fuga = (s: StatoGioco): number => Math.round(applicaRegole(ctx, puntoFuga, { stato: s, probabilita: 0 }).probabilita * 100);
    expect(calcolaStatistiche(con("pugnale", 3), ctx).forza).toBe(5 + 3);
    expect(fuga(con("pugnale", 3))).toBe(9);
    expect(calcolaStatistiche(con("lancia", 2), ctx)).toMatchObject({ forza: 5 + 4, difesa: 2 + 2 });
    expect(fuga(con("mazza", 2))).toBe(-4);
    expect(calcolaStatistiche(con("piastre", 2), ctx).difesa).toBe(2 + 6);
    expect(fuga(con("piastre", 2))).toBe(-8);
    expect(calcolaStatistiche(con("veste", 2), ctx)).toMatchObject({ hpMax: 20 + 6, difesa: 2 + 2 });
    expect(fuga(con("cuoio", 5))).toBe(10);
  });

  it("il pannello del negozio mostra l'oggetto in uso e il prezzo netto", () => {
    const primo = eseguiOk(conOro(50), compra("spada"), ctx).stato;
    const vista = (stato: StatoGioco) => registro.moduli.flatMap((m) => m.interfaccia?.pannelli?.(stato, ctx) ?? []);
    const armeria = vista(primo).find((p) => p.contesti?.includes("luogo:armeria"));
    const testi = (armeria?.righe ?? []).map((r) => traduciEvento(registro, "it", r));
    expect(testi[0]).toContain("In uso:");
    expect(testi.some((t) => t.includes("[1]") && t.includes("Spada liv. 2"))).toBe(true);
    expect(testi).toHaveLength(6);
  });
});

describe("guaritore", () => {
  it("costa il livello del personaggio per ogni HP curato", () => {
    const stato = conOro(100, 9);
    const r = eseguiOk(stato, { tipo: "curaGuaritore", dati: { quantita: 10 } }, ctx);
    expect(r.stato.personaggio.hp).toBe(19);
    expect(r.stato.personaggio.oro).toBe(90);
    const alto = { ...stato, personaggio: { ...stato.personaggio, livello: 3 } };
    const r3 = eseguiOk(alto, { tipo: "curaGuaritore", dati: { quantita: 10 } }, ctx);
    expect(r3.stato.personaggio.oro).toBe(70);
  });

  it("la cura completa porta agli HP massimi effettivi", () => {
    const r = eseguiOk(conOro(100, 3), { tipo: "curaGuaritore", dati: { quantita: "tutto" } }, ctx);
    expect(r.stato.personaggio.hp).toBe(20);
    expect(r.stato.personaggio.oro).toBe(100 - 17);
  });

  it("la cura piccola non supera gli HP mancanti", () => {
    const r = eseguiOk(conOro(100, 16), { tipo: "curaGuaritore", dati: { quantita: 10 } }, ctx);
    expect(r.stato.personaggio.hp).toBe(20);
    expect(r.stato.personaggio.oro).toBe(96);
  });

  it("fallisce se si è in salute o senza monete", () => {
    const salute = eseguiAzione(conOro(100), { tipo: "curaGuaritore", dati: { quantita: "tutto" } }, ctx);
    expect(salute.ok ? "" : salute.errore.chiave).toBe("guaritore.errore.in_salute");
    const povero = eseguiAzione(conOro(2, 3), { tipo: "curaGuaritore", dati: { quantita: "tutto" } }, ctx);
    expect(povero.ok ? "" : povero.errore.chiave).toBe("guaritore.errore.oro_insufficiente");
  });
});

describe("banca", () => {
  it("deposita e preleva senza interessi", () => {
    let stato = conOro(250);
    stato = eseguiOk(stato, { tipo: "deposita", dati: { importo: 100 } }, ctx).stato;
    expect([stato.personaggio.oro, statoBanca.leggi(stato).saldo]).toEqual([150, 100]);
    stato = eseguiOk(stato, { tipo: "deposita", dati: { importo: "tutto" } }, ctx).stato;
    expect([stato.personaggio.oro, statoBanca.leggi(stato).saldo]).toEqual([0, 250]);
    stato = eseguiOk(stato, { tipo: "preleva", dati: { importo: 100 } }, ctx).stato;
    expect([stato.personaggio.oro, statoBanca.leggi(stato).saldo]).toEqual([100, 150]);
    stato = eseguiOk(stato, { tipo: "preleva", dati: { importo: "tutto" } }, ctx).stato;
    expect([stato.personaggio.oro, statoBanca.leggi(stato).saldo]).toEqual([250, 0]);
  });

  it("con meno di 100 monete, 'deposita 100' sposta quel che c'è", () => {
    const r = eseguiOk(conOro(40), { tipo: "deposita", dati: { importo: 100 } }, ctx);
    expect([r.stato.personaggio.oro, statoBanca.leggi(r.stato).saldo]).toEqual([0, 40]);
  });

  it("non si sposta nulla se non c'è nulla", () => {
    const d = eseguiAzione(conOro(0), { tipo: "deposita", dati: { importo: "tutto" } }, ctx);
    const p = eseguiAzione(conOro(5), { tipo: "preleva", dati: { importo: "tutto" } }, ctx);
    expect(d.ok ? "" : d.errore.chiave).toBe("banca.errore.nulla_da_depositare");
    expect(p.ok ? "" : p.errore.chiave).toBe("banca.errore.saldo_vuoto");
  });

  it("l'oro in banca non è toccato dalla penalità di morte", () => {
    const sicuro = eseguiOk(conOro(100), { tipo: "deposita", dati: { importo: 60 } }, ctx).stato;
    expect(statoBanca.leggi(sicuro).saldo).toBe(60);
    expect(sicuro.personaggio.oro).toBe(40);
  });
});
