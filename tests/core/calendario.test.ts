import { describe, expect, it } from "vitest";
import { dataLocale, finestraAttiva } from "../../src/core/indice";

describe("calendario", () => {
  const natale = { id: "natale", da: "12-20", a: "12-26" };
  const capodanno = { id: "feste", da: "12-28", a: "01-06" };

  it("finestra semplice: estremi inclusi", () => {
    expect(finestraAttiva(natale, 1220)).toBe(true);
    expect(finestraAttiva(natale, 1226)).toBe(true);
    expect(finestraAttiva(natale, 1219)).toBe(false);
    expect(finestraAttiva(natale, 1227)).toBe(false);
  });

  it("finestra a cavallo d'anno", () => {
    expect(finestraAttiva(capodanno, 1231)).toBe(true);
    expect(finestraAttiva(capodanno, 101)).toBe(true);
    expect(finestraAttiva(capodanno, 106)).toBe(true);
    expect(finestraAttiva(capodanno, 107)).toBe(false);
    expect(finestraAttiva(capodanno, 1227)).toBe(false);
  });

  it("dataLocale applica l'offset del fuso", () => {
    const istante = Date.UTC(2026, 11, 31, 23, 30);
    expect(dataLocale(istante, 0)).toBe(1231);
    expect(dataLocale(istante, 60)).toBe(101);
  });
});
