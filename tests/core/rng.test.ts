import { describe, expect, it } from "vitest";
import { creaRng } from "../../src/core/indice";

describe("rng con seme", () => {
  it("stesso seme, stessa sequenza", () => {
    const a = creaRng(42);
    const b = creaRng(42);
    const sequenzaA = Array.from({ length: 20 }, () => a.prossimo());
    const sequenzaB = Array.from({ length: 20 }, () => b.prossimo());
    expect(sequenzaA).toEqual(sequenzaB);
  });

  it("semi diversi, sequenze diverse", () => {
    expect(creaRng(1).prossimo()).not.toBe(creaRng(2).prossimo());
  });

  it("prossimo è in [0, 1)", () => {
    const r = creaRng(7);
    for (let i = 0; i < 1000; i++) {
      const v = r.prossimo();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("intero rispetta gli estremi inclusi e li raggiunge", () => {
    const r = creaRng(3);
    const visti = new Set<number>();
    for (let i = 0; i < 500; i++) visti.add(r.intero(0, 4));
    expect([...visti].sort()).toEqual([0, 1, 2, 3, 4]);
  });
});
