import { describe, expect, it } from "vitest";
import type { StatoGioco } from "../../src/core/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { statoClassi } from "../../src/moduli/classi/indice";
import { creaVistaPartita } from "../../src/core/indice";
import { conFortuna, fortunaBase, fortunaBonus, fortunaTotale, probabilitaConFortuna } from "../../src/moduli/fortuna/indice";
import { statoPozioni } from "../../src/moduli/pozioni/indice";
import { creaContestoDiProva, registroDa, statoDiProva } from "../aiuti";

const registro = registroDa(MODULI_ATTIVI);
const ctx = creaContestoDiProva(registro, 3);

const pg = (classe: string, livello = 1): StatoGioco => {
  const s = statoClassi.scrivi(statoDiProva(registro), { classeId: classe });
  return { ...s, personaggio: { ...s.personaggio, livello } };
};
const conEffetto = (st: StatoGioco, tipo: "fortuna" | "forza", restanti: number): StatoGioco => statoPozioni.scrivi(st, { ...statoPozioni.leggi(st), effetto: { tipo, restanti } });

describe("Fortuna: peso sulle probabilità (funzione pura)", () => {
  it("+3% moltiplicativo per punto: con fortuna 5 la pozione trovata passa da 2% a 2,3% e il forziere da 60% a 69%", () => {
    expect(conFortuna(0.02, 5)).toBeCloseTo(0.023, 10);
    expect(conFortuna(0.6, 5)).toBeCloseTo(0.69, 10);
    expect(conFortuna(0.1, 5)).toBeCloseTo(0.115, 10); // la preda di Castruccio
  });
  it("nessuna probabilità supera il 90% e una probabilità già oltre il tetto non diminuisce; fortuna 0 non cambia nulla", () => {
    expect(conFortuna(0.6, 20)).toBe(0.9);
    expect(conFortuna(0.6, 100)).toBe(0.9);
    expect(conFortuna(0.95, 10)).toBe(0.95);
    expect(conFortuna(0.37, 0)).toBe(0.37);
  });
});

describe("Fortuna: da dove viene", () => {
  it("base dalla classe (Cavaliere 2, Mistico 3, Ladro 5) più 1 ogni 2 livelli", () => {
    expect(fortunaBase(pg("cavaliere"), ctx)).toBe(2);
    expect(fortunaBase(pg("mistico"), ctx)).toBe(3);
    expect(fortunaBase(pg("ladro"), ctx)).toBe(5);
    expect(fortunaBase(pg("ladro", 2), ctx)).toBe(6);
    expect(fortunaBase(pg("ladro", 3), ctx)).toBe(6);
    expect(fortunaBase(pg("cavaliere", 8), ctx)).toBe(6);
  });
  it("la pozione della fortuna dà +5 finché non scade; le altre pozioni non toccano la Fortuna", () => {
    const st = pg("mistico");
    expect(fortunaBonus(st, ctx)).toBe(0);
    expect(fortunaBonus(conEffetto(st, "fortuna", 4), ctx)).toBe(5);
    expect(fortunaTotale(conEffetto(st, "fortuna", 4), ctx)).toBe(8);
    expect(fortunaBonus(conEffetto(st, "fortuna", 0), ctx)).toBe(0);
    expect(fortunaBonus(conEffetto(st, "forza", 4), ctx)).toBe(0);
  });
  it("probabilitaConFortuna usa il totale (base + bonus)", () => {
    const st = conEffetto(pg("mistico"), "fortuna", 4); // fortuna 8
    expect(probabilitaConFortuna(st, ctx, 0.5)).toBeCloseTo(0.5 * 1.24, 10);
  });
});

describe("Fortuna: colonna di destra", () => {
  it("compare dopo la Velocità con il valore totale (base + bonus)", () => {
    const base = creaVistaPartita(pg("cavaliere"), ctx).laterale.filter((v) => v.tipo === "statistica");
    expect(base.map((v) => v.valore)).toContain(2); // Fortuna 2 del Cavaliere
    const conPozione = creaVistaPartita(conEffetto(pg("cavaliere"), "fortuna", 4), ctx).laterale.filter((v) => v.tipo === "statistica");
    expect(conPozione.map((v) => v.valore)).toContain(7); // 2 + 5
    const ordini = base.map((v) => v.ordine);
    expect(ordini[ordini.length - 1]).toBe(20); // l'ultima della riga
  });
});
