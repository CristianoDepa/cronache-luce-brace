import { describe, expect, it } from "vitest";
import type { Raster } from "../../src/core/indice";
import { rasterizza } from "../../src/core/indice";
import { fattoreLuce, fattoreLuceDaOre } from "../../src/client/luce";
import { indiciAlTempo, leggiColore, paletteAlTempo } from "../../src/client/palette";

const fuoco: Raster = rasterizza({
  palette: ["#aa0000", "#ff0000", "#ffaa00", "#ffff00"],
  pixel: ["0123"],
  cicli: [{ indici: [1, 2, 3], ritardoMs: 100 }],
});

describe("ciclo di palette", () => {
  it("al tempo zero i colori sono quelli della palette", () => {
    expect(indiciAlTempo(fuoco, 0, true)).toEqual([0, 1, 2, 3]);
  });

  it("ogni ritardo i colori del ciclo scorrono di uno, gli altri restano", () => {
    expect(indiciAlTempo(fuoco, 100, true)).toEqual([0, 2, 3, 1]);
    expect(indiciAlTempo(fuoco, 200, true)).toEqual([0, 3, 1, 2]);
    expect(indiciAlTempo(fuoco, 300, true)).toEqual([0, 1, 2, 3]); // ricomincia
    expect(indiciAlTempo(fuoco, 150, true)).toEqual([0, 2, 3, 1]); // tra due scatti vale l'ultimo
  });

  it("con le animazioni spente i colori restano fermi", () => {
    expect(indiciAlTempo(fuoco, 250, false)).toEqual([0, 1, 2, 3]);
  });

  it("due indici fanno lampeggiare un colore", () => {
    const stella = rasterizza({ palette: ["#ffffff", "#444444"], pixel: ["0"], cicli: [{ indici: [0, 1], ritardoMs: 500 }] });
    expect(paletteAlTempo(stella, 0, 0, true)[0]).toEqual(leggiColore("#ffffff"));
    expect(paletteAlTempo(stella, 500, 0, true)[0]).toEqual(leggiColore("#444444"));
    expect(paletteAlTempo(stella, 1000, 0, true)[0]).toEqual(leggiColore("#ffffff"));
  });
});

describe("tinta di notte e di giorno", () => {
  const scena: Raster = rasterizza({ palette: ["#000000", "#102030"], paletteGiorno: ["#ffffff", "#80a0c0"], pixel: ["01"] });

  it("luce 0 usa i colori di notte, luce 1 quelli di giorno, in mezzo si sfuma", () => {
    expect(paletteAlTempo(scena, 0, 0, false)).toEqual([[0, 0, 0], [16, 32, 48]]);
    expect(paletteAlTempo(scena, 0, 1, false)).toEqual([[255, 255, 255], [128, 160, 192]]);
    expect(paletteAlTempo(scena, 0, 0.5, false)[0]).toEqual([128, 128, 128]);
  });

  it("senza palette di giorno i colori non cambiano", () => {
    const fissa = rasterizza({ palette: ["#336699"], pixel: ["0"] });
    expect(paletteAlTempo(fissa, 0, 1, false)[0]).toEqual([51, 102, 153]);
  });

  it("il cambio di giorno e quello del ciclo si combinano", () => {
    const mista = rasterizza({
      palette: ["#000000", "#ff0000"],
      paletteGiorno: ["#000000", "#00ff00"],
      pixel: ["01"],
      cicli: [{ indici: [0, 1], ritardoMs: 100 }],
    });
    // dopo uno scatto l'indice 0 mostra il colore dell'indice 1: rosso di notte, verde di giorno
    expect(paletteAlTempo(mista, 100, 0, true)[0]).toEqual([255, 0, 0]);
    expect(paletteAlTempo(mista, 100, 1, true)[0]).toEqual([0, 255, 0]);
  });
});

describe("fattore di luce dall'ora", () => {
  it("di notte vale 0 e di giorno 1", () => {
    for (const ore of [0, 3, 5.5, 21, 23.9]) expect(fattoreLuceDaOre(ore), String(ore)).toBe(0);
    for (const ore of [8, 10, 12, 15, 17]) expect(fattoreLuceDaOre(ore), String(ore)).toBe(1);
  });

  it("all'alba e al tramonto passa gradualmente", () => {
    expect(fattoreLuceDaOre(7)).toBeCloseTo(0.5, 5);
    expect(fattoreLuceDaOre(18.5)).toBeCloseTo(0.5, 5);
    expect(fattoreLuceDaOre(6.5)).toBeLessThan(fattoreLuceDaOre(7.5));
    expect(fattoreLuceDaOre(18)).toBeGreaterThan(fattoreLuceDaOre(19));
  });

  it("un'ora oltre le 24 o negativa vale come l'ora equivalente", () => {
    expect(fattoreLuceDaOre(36)).toBe(fattoreLuceDaOre(12));
    expect(fattoreLuceDaOre(-12)).toBe(fattoreLuceDaOre(12));
  });

  it("dall'istante e dal fuso: mezzogiorno UTC con fuso +60 minuti è giorno, mezzanotte è notte", () => {
    expect(fattoreLuce(Date.UTC(2026, 6, 1, 11, 0), 60)).toBe(1);
    expect(fattoreLuce(Date.UTC(2026, 6, 1, 23, 0), 60)).toBe(0);
    expect(fattoreLuce(Date.UTC(2026, 6, 1, 5, 0), -300)).toBe(0); // 00:00 locale
  });
});
