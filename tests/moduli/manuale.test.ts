import { describe, expect, it } from "vitest";
import { generaManuale } from "../../strumenti/manuale/genera";

describe("Manuale di gioco (generato dai dati)", () => {
  const testo = generaManuale();
  it("ha una pagina per ogni skill", () => {
    for (const titolo of ["## HP massimi", "## Forza", "## Difesa", "## Velocità", "## Mana", "## Fortuna", "## Scasso"]) expect(testo).toContain(titolo);
  });
  it("i numeri vengono dai dati: Fortuna per classe, pozione +5, tetto 90%, amuleti +2/+4/+6 e +6/+12/+18", () => {
    expect(testo).toContain("Cavaliere +2, Mistico +3, Ladro +5");
    expect(testo).toContain("+5 per 5 + d6 turni");
    expect(testo).toContain("nessuna supera il 90%");
    expect(testo).toContain("bronzo +2, argento +4, oro +6");
    expect(testo).toContain("bronzo +6, argento +12, oro +18");
  });
  it("è deterministico (stesso testo a ogni generazione)", () => {
    expect(generaManuale()).toBe(testo);
  });
});
