import { describe, expect, it } from "vitest";
import { elencaContenuti, leggiContenuto, rasterizza, tipoIllustrazione } from "../../src/core/indice";
import { MODULI_ATTIVI } from "../../src/moduli/indice";
import { ID_SCENARI_RISERVA } from "../../src/moduli/scenari/indice";
import { tipoLuogo } from "../../src/moduli/luoghi/tipi";
import { registroDa } from "../aiuti";

// Gli scenari di riserva (0.33.0): venti scene pronte ma non collocate.
const registro = registroDa(MODULI_ATTIVI);

describe("Scenari di riserva", () => {
  it("ci sono 20 scenari 96 x 64, senza pixel trasparenti, con versione di giorno e al massimo 62 colori", () => {
    expect(ID_SCENARI_RISERVA).toHaveLength(20);
    expect(new Set(ID_SCENARI_RISERVA).size).toBe(20);
    for (const id of ID_SCENARI_RISERVA) {
      expect(id).toMatch(/^scenario\./);
      const r = rasterizza(leggiContenuto(registro, tipoIllustrazione, id)!);
      expect([r.larghezza, r.altezza], id).toEqual([96, 64]);
      expect(r.pixel.includes(-1), `${id}: pixel trasparenti`).toBe(false);
      expect(r.palette.length, id).toBeLessThanOrEqual(62);
      expect(r.paletteGiorno, id).toBeDefined();
    }
  });

  it("nessun luogo le usa come scena (restano di riserva)", () => {
    const usate = new Set(elencaContenuti(registro, tipoLuogo).map((l) => JSON.stringify(l.dati)));
    for (const id of ID_SCENARI_RISERVA) for (const u of usate) expect(u.includes(id), id).toBe(false);
  });
});
